// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FeeDistributionAutomation
 * @dev Smart Contract pentru automatizarea distribuției fee-urilor
 * @notice Permite distribuția automată a fee-urilor între burn/stakers/treasury
 * @author BitSwapDEX Team
 * @custom:security-contact security@bitswapdex.com
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./BitSwapDEXWrapper.sol";
import "./TreasuryManagement.sol";
import "./StakingRewards.sol";

contract FeeDistributionAutomation is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // ============ STRUCTS & ENUMS ============
    
    /**
     * @notice Distribution config struct
     */
    struct DistributionConfig {
        uint256 distributionId;
        address token;              // Token address (address(0) pentru BNB)
        uint256 totalAmount;        // Total amount de distribuit
        uint256 burnAmount;         // Amount pentru burn (50%)
        uint256 stakersAmount;      // Amount pentru stakers (30%)
        uint256 treasuryAmount;     // Amount pentru treasury (20%)
        uint256 scheduledAt;        // Timestamp când distribution e scheduled
        uint256 executedAt;         // Timestamp când distribution a fost executat (0 = not executed)
        bool executed;              // Dacă distribution a fost executat
        bool cancelled;             // Dacă distribution a fost anulat
    }
    
    /**
     * @notice Distribution schedule struct
     */
    struct DistributionSchedule {
        address token;              // Token address (0 = all tokens)
        uint256 interval;           // Distribution interval (in seconds, e.g., 7 days = 604800)
        uint256 lastDistribution;   // Last distribution timestamp
        bool isActive;              // Dacă schedule-ul este activ
    }
    
    // ============ STATE VARIABLES ============
    
    /// @notice BitSwapDEXWrapper contract
    BitSwapDEXWrapper public wrapper;
    
    /// @notice TreasuryManagement contract
    TreasuryManagement public treasury;
    
    /// @notice StakingRewards contract
    StakingRewards public stakingRewards;
    
    /// @notice Distribution counter
    uint256 public distributionCounter;
    
    /// @notice Mapping: distributionId => DistributionConfig
    mapping(uint256 => DistributionConfig) public distributions;
    
    /// @notice Mapping: token => DistributionSchedule
    mapping(address => DistributionSchedule) public distributionSchedules;
    
    /// @notice Keeper address (pentru automatic execution)
    address public keeper;
    
    /// @notice Total distributions executed (historical)
    uint256 public totalDistributionsExecuted;
    
    /// @notice Total funds distributed (historical)
    uint256 public totalFundsDistributed;
    
    /// @notice Automatic distribution enabled
    bool public autoDistributionEnabled;
    
    /// @notice Minimum distribution amount (pentru a preveni gas waste)
    uint256 public minDistributionAmount;
    
    /// @notice Burn address (dead address pentru token burn)
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    // ============ CONSTANTS ============
    
    /// @notice Fee distribution percentages (din BitSwapDEXWrapper)
    uint256 public constant BURN_PERCENTAGE = 50;      // 50%
    uint256 public constant STAKERS_PERCENTAGE = 30;   // 30%
    uint256 public constant TREASURY_PERCENTAGE = 20;  // 20%
    uint256 public constant PERCENTAGE_DENOMINATOR = 100;
    
    // ============ EVENTS ============
    
    event DistributionScheduled(
        uint256 indexed distributionId,
        address indexed token,
        uint256 totalAmount,
        uint256 burnAmount,
        uint256 stakersAmount,
        uint256 treasuryAmount,
        uint256 scheduledAt
    );
    
    event DistributionExecuted(
        uint256 indexed distributionId,
        address indexed token,
        uint256 burnAmount,
        uint256 stakersAmount,
        uint256 treasuryAmount,
        uint256 executedAt
    );
    
    event DistributionCancelled(
        uint256 indexed distributionId,
        address indexed cancelledBy
    );
    
    event DistributionScheduleUpdated(
        address indexed token,
        uint256 interval,
        bool isActive
    );
    
    event KeeperUpdated(address indexed oldKeeper, address indexed newKeeper);
    
    event AutoDistributionToggled(bool enabled);
    
    // ============ MODIFIERS ============
    
    /**
     * @notice Verifică dacă msg.sender este keeper
     */
    modifier onlyKeeper() {
        require(msg.sender == keeper || msg.sender == owner(), "FeeDistributionAutomation: Only keeper or owner");
        _;
    }
    
    /**
     * @notice Verifică dacă distribution-ul există și nu e executat/cancelled
     */
    modifier validDistribution(uint256 _distributionId) {
        require(
            distributions[_distributionId].token != address(0),
            "FeeDistributionAutomation: Distribution does not exist"
        );
        require(
            !distributions[_distributionId].executed,
            "FeeDistributionAutomation: Distribution already executed"
        );
        require(
            !distributions[_distributionId].cancelled,
            "FeeDistributionAutomation: Distribution already cancelled"
        );
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Constructor
     * @param _wrapper Address-ul BitSwapDEXWrapper contract
     * @param _treasury Address-ul TreasuryManagement contract
     * @param _stakingRewards Address-ul StakingRewards contract (poate fi address(0) dacă nu e ready)
     * @param _minDistributionAmount Minimum distribution amount (pentru a preveni gas waste)
     */
    constructor(
        address _wrapper,
        address _treasury,
        address _stakingRewards,
        uint256 _minDistributionAmount
    ) {
        require(_wrapper != address(0), "FeeDistributionAutomation: Invalid wrapper address");
        require(_treasury != address(0), "FeeDistributionAutomation: Invalid treasury address");
        require(_minDistributionAmount > 0, "FeeDistributionAutomation: Invalid min amount");
        
        wrapper = BitSwapDEXWrapper(_wrapper);
        treasury = TreasuryManagement(_treasury);
        stakingRewards = StakingRewards(_stakingRewards);
        minDistributionAmount = _minDistributionAmount;
        
        autoDistributionEnabled = false; // Disabled by default (manual trigger)
        
        // Start distribution counter from 1
        distributionCounter = 1;
    }
    
    // ============ OWNER FUNCTIONS ============
    
    /**
     * @notice Schedule o distribuție manuală
     * @param _token Address-ul token-ului (address(0) pentru BNB)
     * @param _totalAmount Total amount de distribuit
     * @param _scheduledAt Timestamp când distribuția e scheduled (0 = now)
     * @return distributionId ID-ul distribuției
     */
    function scheduleDistribution(
        address _token,
        uint256 _totalAmount,
        uint256 _scheduledAt
    ) external onlyOwner nonReentrant whenNotPaused returns (uint256 distributionId) {
        require(_totalAmount >= minDistributionAmount, "FeeDistributionAutomation: Amount below minimum");
        
        // Calculate distribution amounts
        uint256 burnAmount = (_totalAmount * BURN_PERCENTAGE) / PERCENTAGE_DENOMINATOR;
        uint256 stakersAmount = (_totalAmount * STAKERS_PERCENTAGE) / PERCENTAGE_DENOMINATOR;
        uint256 treasuryAmount = _totalAmount - burnAmount - stakersAmount; // Rest pentru treasury
        
        // Verify contract has sufficient balance
        if (_token == address(0)) {
            require(
                address(this).balance >= _totalAmount,
                "FeeDistributionAutomation: Insufficient BNB balance"
            );
        } else {
            require(
                IERC20(_token).balanceOf(address(this)) >= _totalAmount,
                "FeeDistributionAutomation: Insufficient token balance"
            );
        }
        
        // Schedule distribution
        uint256 scheduledAt = _scheduledAt > 0 ? _scheduledAt : block.timestamp;
        
        distributionId = distributionCounter;
        distributionCounter++;
        
        distributions[distributionId] = DistributionConfig({
            distributionId: distributionId,
            token: _token,
            totalAmount: _totalAmount,
            burnAmount: burnAmount,
            stakersAmount: stakersAmount,
            treasuryAmount: treasuryAmount,
            scheduledAt: scheduledAt,
            executedAt: 0,
            executed: false,
            cancelled: false
        });
        
        emit DistributionScheduled(
            distributionId,
            _token,
            _totalAmount,
            burnAmount,
            stakersAmount,
            treasuryAmount,
            scheduledAt
        );
        
        // Auto-execute dacă scheduledAt <= now
        if (scheduledAt <= block.timestamp) {
            _executeDistribution(distributionId);
        }
        
        return distributionId;
    }
    
    /**
     * @notice Execute o distribuție scheduled
     * @param _distributionId ID-ul distribuției
     */
    function executeDistribution(uint256 _distributionId) 
        external 
        onlyKeeper 
        nonReentrant 
        whenNotPaused 
        validDistribution(_distributionId) 
    {
        DistributionConfig storage config = distributions[_distributionId];
        
        require(
            config.scheduledAt <= block.timestamp,
            "FeeDistributionAutomation: Distribution not ready"
        );
        
        _executeDistribution(_distributionId);
    }
    
    /**
     * @notice Execute multiple distributions (batch execution)
     * @param _distributionIds Array de distribution IDs
     * @return successCount Numărul de distributions executate cu succes
     */
    function executeDistributions(uint256[] memory _distributionIds) 
        external 
        onlyKeeper 
        nonReentrant 
        whenNotPaused 
        returns (uint256 successCount) 
    {
        require(_distributionIds.length > 0, "FeeDistributionAutomation: Empty array");
        require(_distributionIds.length <= 50, "FeeDistributionAutomation: Too many distributions");
        
        successCount = 0;
        
        for (uint256 i = 0; i < _distributionIds.length; i++) {
            DistributionConfig storage config = distributions[_distributionIds[i]];
            
            if (
                config.token != address(0) &&
                !config.executed &&
                !config.cancelled &&
                config.scheduledAt <= block.timestamp
            ) {
                try this._executeDistribution(_distributionIds[i]) {
                    successCount++;
                } catch {
                    // Continue cu următorul distribution dacă acesta fail-uită
                    continue;
                }
            }
        }
        
        return successCount;
    }
    
    /**
     * @notice Cancel o distribuție
     * @param _distributionId ID-ul distribuției
     */
    function cancelDistribution(uint256 _distributionId) 
        external 
        onlyOwner 
        validDistribution(_distributionId) 
    {
        distributions[_distributionId].cancelled = true;
        
        emit DistributionCancelled(_distributionId, msg.sender);
    }
    
    /**
     * @notice Set distribution schedule pentru un token
     * @param _token Address-ul token-ului (address(0) pentru all tokens)
     * @param _interval Distribution interval (in seconds, 0 = disable)
     */
    function setDistributionSchedule(address _token, uint256 _interval) external onlyOwner {
        require(_interval >= 3600 || _interval == 0, "FeeDistributionAutomation: Invalid interval (min 1 hour)");
        
        DistributionSchedule storage schedule = distributionSchedules[_token];
        schedule.token = _token;
        schedule.interval = _interval;
        schedule.isActive = _interval > 0;
        
        if (_interval > 0 && schedule.lastDistribution == 0) {
            schedule.lastDistribution = block.timestamp;
        }
        
        emit DistributionScheduleUpdated(_token, _interval, schedule.isActive);
    }
    
    /**
     * @notice Set keeper address
     * @param _keeper Address-ul keeper (pentru automatic execution)
     */
    function setKeeper(address _keeper) external onlyOwner {
        address oldKeeper = keeper;
        keeper = _keeper;
        emit KeeperUpdated(oldKeeper, _keeper);
    }
    
    /**
     * @notice Toggle auto distribution
     * @param _enabled Enable/disable auto distribution
     */
    function setAutoDistribution(bool _enabled) external onlyOwner {
        autoDistributionEnabled = _enabled;
        emit AutoDistributionToggled(_enabled);
    }
    
    /**
     * @notice Set min distribution amount
     * @param _minAmount New minimum amount
     */
    function setMinDistributionAmount(uint256 _minAmount) external onlyOwner {
        require(_minAmount > 0, "FeeDistributionAutomation: Invalid min amount");
        minDistributionAmount = _minAmount;
    }
    
    /**
     * @notice Update wrapper contract address
     * @param _wrapper Address-ul nou al wrapper contract
     */
    function setWrapper(address _wrapper) external onlyOwner {
        require(_wrapper != address(0), "FeeDistributionAutomation: Invalid wrapper address");
        wrapper = BitSwapDEXWrapper(_wrapper);
    }
    
    /**
     * @notice Update treasury contract address
     * @param _treasury Address-ul nou al treasury contract
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "FeeDistributionAutomation: Invalid treasury address");
        treasury = TreasuryManagement(_treasury);
    }
    
    /**
     * @notice Update staking rewards contract address
     * @param _stakingRewards Address-ul nou al staking rewards contract
     */
    function setStakingRewards(address _stakingRewards) external onlyOwner {
        stakingRewards = StakingRewards(_stakingRewards);
    }
    
    /**
     * @notice Pause contract (emergency only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Emergency withdraw (owner only, pentru stuck funds)
     * @param _token Address-ul token-ului (address(0) pentru BNB)
     * @param _amount Cantitatea
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        if (_token == address(0)) {
            (bool success, ) = payable(owner()).call{value: _amount}("");
            require(success, "FeeDistributionAutomation: BNB transfer failed");
        } else {
            IERC20(_token).safeTransfer(owner(), _amount);
        }
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    /**
     * @notice Execute o distribuție (internal)
     * @param _distributionId ID-ul distribuției
     */
    function _executeDistribution(uint256 _distributionId) external {
        require(msg.sender == address(this), "FeeDistributionAutomation: Internal function only");
        
        DistributionConfig storage config = distributions[_distributionId];
        
        require(config.token != address(0), "FeeDistributionAutomation: Distribution does not exist");
        require(!config.executed, "FeeDistributionAutomation: Distribution already executed");
        require(!config.cancelled, "FeeDistributionAutomation: Distribution cancelled");
        require(config.scheduledAt <= block.timestamp, "FeeDistributionAutomation: Not ready");
        
        address token = config.token;
        
        // Verify contract has sufficient balance
        if (token == address(0)) {
            require(
                address(this).balance >= config.totalAmount,
                "FeeDistributionAutomation: Insufficient BNB balance"
            );
        } else {
            require(
                IERC20(token).balanceOf(address(this)) >= config.totalAmount,
                "FeeDistributionAutomation: Insufficient token balance"
            );
        }
        
        // 1. Burn tokens (50%)
        if (config.burnAmount > 0) {
            if (token == address(0)) {
                // BNB burn - trimitem la dead address
                (bool burnSuccess, ) = payable(BURN_ADDRESS).call{value: config.burnAmount}("");
                require(burnSuccess, "FeeDistributionAutomation: BNB burn failed");
            } else {
                // Token burn - trimitem la dead address
                IERC20(token).safeTransfer(BURN_ADDRESS, config.burnAmount);
            }
        }
        
        // 2. Distribute to stakers (30%)
        if (config.stakersAmount > 0 && address(stakingRewards) != address(0)) {
            if (token == address(0)) {
                // BNB - staking rewards contract trebuie să accepte BNB
                // Pentru acum, trimitem la treasury (staking rewards va primi BNB altfel)
                (bool stakersSuccess, ) = payable(address(stakingRewards)).call{value: config.stakersAmount}("");
                if (!stakersSuccess) {
                    // Fallback: trimitem la treasury dacă staking rewards nu acceptă BNB direct
                    treasury.deposit{value: config.stakersAmount}(address(0), config.stakersAmount);
                }
            } else {
                // Token - approve și transfer la staking rewards
                IERC20(token).safeApprove(address(stakingRewards), config.stakersAmount);
                stakingRewards.distributeRewards(token, config.stakersAmount);
                IERC20(token).safeApprove(address(stakingRewards), 0); // Reset approval
            }
        } else if (config.stakersAmount > 0) {
            // Staking rewards contract nu e disponibil - trimitem la treasury temporar
            if (token == address(0)) {
                treasury.deposit{value: config.stakersAmount}(address(0), config.stakersAmount);
            } else {
                IERC20(token).safeApprove(address(treasury), config.stakersAmount);
                treasury.deposit(token, config.stakersAmount);
                IERC20(token).safeApprove(address(treasury), 0);
            }
        }
        
        // 3. Distribute to treasury (20%)
        if (config.treasuryAmount > 0) {
            if (token == address(0)) {
                // BNB deposit în treasury
                treasury.deposit{value: config.treasuryAmount}(address(0), config.treasuryAmount);
            } else {
                // Token deposit în treasury
                IERC20(token).safeApprove(address(treasury), config.treasuryAmount);
                treasury.deposit(token, config.treasuryAmount);
                IERC20(token).safeApprove(address(treasury), 0); // Reset approval
            }
        }
        
        // Update distribution
        config.executed = true;
        config.executedAt = block.timestamp;
        
        // Update totals
        totalDistributionsExecuted++;
        totalFundsDistributed += config.totalAmount;
        
        emit DistributionExecuted(
            _distributionId,
            token,
            config.burnAmount,
            config.stakersAmount,
            config.treasuryAmount,
            block.timestamp
        );
    }
    
    // ============ KEEPER FUNCTIONS (Automatic Execution) ============
    
    /**
     * @notice Check și execute distributions ready (pentru keeper)
     * @return executedCount Numărul de distributions executate
     */
    function checkAndExecuteDistributions() external onlyKeeper nonReentrant whenNotPaused returns (uint256 executedCount) {
        if (!autoDistributionEnabled) {
            return 0;
        }
        
        // Simplified - în producție ar trebui să iterăm prin toate distributions scheduled
        // Pentru acum, keeper va folosi executeDistribution() manual
        // Sau putem implementa un sistem de queue
        
        return 0;
    }
    
    /**
     * @notice Collect fees de la wrapper și schedule distribution
     * @param _token Address-ul token-ului (address(0) pentru BNB)
     * @return distributionId ID-ul distribuției scheduled
     */
    function collectAndScheduleDistribution(address _token) 
        external 
        onlyKeeper 
        nonReentrant 
        whenNotPaused 
        returns (uint256 distributionId) 
    {
        // Check dacă wrapper are fees collected
        // În producție, wrapper-ul ar avea o funcție pentru a colecta fees în acest contract
        // Pentru acum, assumăm că fees sunt deja în contract sau wrapper-ul le trimite direct
        
        // Check balance în contract
        uint256 balance = 0;
        if (_token == address(0)) {
            balance = address(this).balance;
        } else {
            balance = IERC20(_token).balanceOf(address(this));
        }
        
        require(balance >= minDistributionAmount, "FeeDistributionAutomation: Insufficient balance");
        
        // Schedule distribution
        return scheduleDistribution(_token, balance, block.timestamp);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Returnează o distribuție
     * @param _distributionId ID-ul distribuției
     * @return DistributionConfig Distribution config struct
     */
    function getDistribution(uint256 _distributionId) external view returns (DistributionConfig memory) {
        return distributions[_distributionId];
    }
    
    /**
     * @notice Returnează distribution schedule pentru un token
     * @param _token Address-ul token-ului
     * @return DistributionSchedule Schedule struct
     */
    function getDistributionSchedule(address _token) external view returns (DistributionSchedule memory) {
        return distributionSchedules[_token];
    }
    
    /**
     * @notice Returnează numărul total de distributions
     * @return uint256 Numărul total
     */
    function getTotalDistributions() external view returns (uint256) {
        return distributionCounter - 1;
    }
    
    // ============ RECEIVE ============
    
    /**
     * @dev Receive BNB (pentru fee collection de la wrapper)
     */
    receive() external payable {
        // Contractul poate primi BNB pentru fee distribution
        // Keeper va apela collectAndScheduleDistribution(address(0), msg.value)
    }
}

