// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title StakingRewards
 * @dev Smart Contract pentru staking BITS tokens și distribuția rewards (30% din fee-uri)
 * @notice Permite utilizatorilor să stake BITS tokens și să primească rewards din fee-uri
 * @author BitSwapDEX Team
 * @custom:security-contact security@bitswapdex.com
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract StakingRewards is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // ============ STRUCTS & ENUMS ============
    
    /**
     * @notice Staking tier levels
     */
    enum StakingTier {
        BRONZE,     // 0 - 1000 BITS
        SILVER,     // 1000 - 10000 BITS
        GOLD,       // 10000 - 100000 BITS
        PLATINUM    // 100000+ BITS
    }
    
    /**
     * @notice Stake struct
     */
    struct Stake {
        uint256 stakeId;
        address user;
        uint256 amount;                // Staked amount
        uint256 lockPeriod;            // Lock period in seconds (0 = no lock)
        uint256 stakedAt;              // Timestamp when staked
        uint256 unlockAt;              // Timestamp when can be unstaked (0 = no lock)
        uint256 rewardsClaimed;        // Total rewards claimed pentru acest stake
        uint256 lastRewardClaim;       // Last reward claim timestamp
        StakingTier tier;              // Staking tier
        bool isActive;                 // Dacă stake-ul este activ
    }
    
    /**
     * @notice Reward distribution struct
     */
    struct RewardDistribution {
        address token;                 // Token address (address(0) pentru BNB)
        uint256 amount;                // Reward amount
        uint256 distributedAt;         // Timestamp when distributed
        uint256 totalStaked;           // Total staked at distribution time
    }
    
    // ============ STATE VARIABLES ============
    
    /// @notice BITS token contract
    IERC20 public bitsToken;
    
    /// @notice Treasury contract (pentru primirea rewards - 30% din fees)
    address public treasury;
    
    /// @notice Stake counter
    uint256 public stakeCounter;
    
    /// @notice Mapping: stakeId => Stake
    mapping(uint256 => Stake) public stakes;
    
    /// @notice Mapping: user => stakeIds[]
    mapping(address => uint256[]) public userStakes;
    
    /// @notice Mapping: user => total staked amount
    mapping(address => uint256) public userTotalStaked;
    
    /// @notice Total staked BITS tokens
    uint256 public totalStaked;
    
    /// @notice Total rewards distributed (historical)
    uint256 public totalRewardsDistributed;
    
    /// @notice Reward distribution history
    RewardDistribution[] public rewardDistributions;
    
    /// @notice Min stake amount
    uint256 public minStakeAmount;
    
    /// @notice Max stake amount per user (0 = unlimited)
    uint256 public maxStakeAmountPerUser;
    
    /// @notice Lock periods disponibile (in seconds)
    uint256[] public lockPeriods;
    
    /// @notice Multiplier pentru fiecare lock period (in basis points, 10000 = 1x)
    mapping(uint256 => uint256) public lockPeriodMultipliers;
    
    /// @notice APR pentru fiecare tier (in basis points, 100 = 1%)
    mapping(StakingTier => uint256) public tierAPRs;
    
    /// @notice Tier thresholds (in BITS tokens, wei)
    mapping(StakingTier => uint256) public tierThresholds;
    
    /// @notice Total pending rewards (pentru calculare distribution)
    uint256 public totalPendingRewards;
    
    /// @notice Cooldown period pentru unstaking (in seconds)
    uint256 public cooldownPeriod;
    
    /// @notice Early unstake penalty (in basis points, 100 = 1%)
    uint256 public earlyUnstakePenaltyBps;
    
    // ============ CONSTANTS ============
    
    /// @notice Fee denominator (for precision)
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    /// @notice Year in seconds
    uint256 public constant YEAR = 365 days;
    
    // ============ EVENTS ============
    
    event StakeCreated(
        uint256 indexed stakeId,
        address indexed user,
        uint256 amount,
        uint256 lockPeriod,
        StakingTier tier
    );
    
    event StakeUnstaked(
        uint256 indexed stakeId,
        address indexed user,
        uint256 amount,
        uint256 penalty,
        uint256 returned
    );
    
    event RewardsClaimed(
        uint256 indexed stakeId,
        address indexed user,
        address token,
        uint256 amount
    );
    
    event RewardsDistributed(
        address indexed token,
        uint256 amount,
        uint256 totalStaked,
        uint256 distributedAt
    );
    
    event TierUpdated(
        uint256 indexed stakeId,
        address indexed user,
        StakingTier oldTier,
        StakingTier newTier
    );
    
    event CooldownStarted(
        uint256 indexed stakeId,
        address indexed user,
        uint256 cooldownEndsAt
    );
    
    event CooldownCancelled(
        uint256 indexed stakeId,
        address indexed user
    );
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Constructor
     * @param _bitsToken Address-ul BITS token contract
     * @param _treasury Address-ul treasury contract (pentru primirea rewards)
     * @param _minStakeAmount Minimum stake amount
     */
    constructor(
        address _bitsToken,
        address _treasury,
        uint256 _minStakeAmount
    ) {
        require(_bitsToken != address(0), "StakingRewards: Invalid BITS token address");
        require(_treasury != address(0), "StakingRewards: Invalid treasury address");
        require(_minStakeAmount > 0, "StakingRewards: Invalid min stake amount");
        
        bitsToken = IERC20(_bitsToken);
        treasury = _treasury;
        minStakeAmount = _minStakeAmount;
        
        // Initialize tier thresholds (in wei - assuming 18 decimals)
        tierThresholds[StakingTier.BRONZE] = 0;
        tierThresholds[StakingTier.SILVER] = 1000 * 1e18;      // 1000 BITS
        tierThresholds[StakingTier.GOLD] = 10000 * 1e18;       // 10000 BITS
        tierThresholds[StakingTier.PLATINUM] = 100000 * 1e18;  // 100000 BITS
        
        // Initialize tier APRs (in basis points)
        tierAPRs[StakingTier.BRONZE] = 500;   // 5% APR
        tierAPRs[StakingTier.SILVER] = 750;   // 7.5% APR
        tierAPRs[StakingTier.GOLD] = 1000;    // 10% APR
        tierAPRs[StakingTier.PLATINUM] = 1500; // 15% APR
        
        // Initialize lock periods și multipliers
        lockPeriods.push(0);              // No lock
        lockPeriods.push(30 days);        // 30 days
        lockPeriods.push(90 days);        // 90 days
        lockPeriods.push(180 days);       // 180 days
        lockPeriods.push(365 days);       // 365 days
        
        lockPeriodMultipliers[0] = 10000;        // 1x (no multiplier)
        lockPeriodMultipliers[30 days] = 11000;  // 1.1x
        lockPeriodMultipliers[90 days] = 12500;  // 1.25x
        lockPeriodMultipliers[180 days] = 15000; // 1.5x
        lockPeriodMultipliers[365 days] = 20000; // 2x
        
        // Initialize cooldown și penalty
        cooldownPeriod = 7 days;          // 7 days cooldown
        earlyUnstakePenaltyBps = 500;     // 5% penalty pentru early unstake
        
        // Start stake counter from 1
        stakeCounter = 1;
    }
    
    // ============ USER FUNCTIONS ============
    
    /**
     * @notice Stake BITS tokens
     * @param _amount Amount de BITS tokens de staked (in wei)
     * @param _lockPeriod Lock period (in seconds, must be în lockPeriods array)
     * @return stakeId ID-ul stake-ului creat
     */
    function stake(uint256 _amount, uint256 _lockPeriod) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 stakeId) 
    {
        require(_amount >= minStakeAmount, "StakingRewards: Amount below minimum");
        require(_isValidLockPeriod(_lockPeriod), "StakingRewards: Invalid lock period");
        
        if (maxStakeAmountPerUser > 0) {
            require(
                userTotalStaked[msg.sender] + _amount <= maxStakeAmountPerUser,
                "StakingRewards: Exceeds max stake per user"
            );
        }
        
        // Transfer tokens de la user la contract
        bitsToken.safeTransferFrom(msg.sender, address(this), _amount);
        
        // Determine tier
        StakingTier tier = _determineTier(userTotalStaked[msg.sender] + _amount);
        
        // Calculate unlock timestamp
        uint256 unlockAt = _lockPeriod > 0 ? block.timestamp + _lockPeriod : 0;
        
        // Create stake
        stakeId = stakeCounter;
        stakeCounter++;
        
        stakes[stakeId] = Stake({
            stakeId: stakeId,
            user: msg.sender,
            amount: _amount,
            lockPeriod: _lockPeriod,
            stakedAt: block.timestamp,
            unlockAt: unlockAt,
            rewardsClaimed: 0,
            lastRewardClaim: block.timestamp,
            tier: tier,
            isActive: true
        });
        
        // Update user data
        userStakes[msg.sender].push(stakeId);
        userTotalStaked[msg.sender] += _amount;
        totalStaked += _amount;
        
        emit StakeCreated(stakeId, msg.sender, _amount, _lockPeriod, tier);
        
        return stakeId;
    }
    
    /**
     * @notice Unstake BITS tokens
     * @param _stakeId ID-ul stake-ului
     * @return amount Amount de tokens returned (după penalty dacă e cazul)
     */
    function unstake(uint256 _stakeId) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 amount) 
    {
        Stake storage stakeInfo = stakes[_stakeId];
        
        require(stakeInfo.user == msg.sender, "StakingRewards: Not your stake");
        require(stakeInfo.isActive, "StakingRewards: Stake not active");
        
        // Check dacă lock period a expirat
        bool isEarlyUnstake = stakeInfo.unlockAt > 0 && block.timestamp < stakeInfo.unlockAt;
        
        // Calculate penalty dacă e early unstake
        uint256 penalty = 0;
        if (isEarlyUnstake) {
            penalty = (stakeInfo.amount * earlyUnstakePenaltyBps) / FEE_DENOMINATOR;
        }
        
        amount = stakeInfo.amount - penalty;
        
        // Transfer tokens back to user
        bitsToken.safeTransfer(msg.sender, amount);
        
        // Transfer penalty la treasury dacă există
        if (penalty > 0) {
            bitsToken.safeTransfer(treasury, penalty);
        }
        
        // Claim any pending rewards înainte de unstake
        _claimRewards(_stakeId);
        
        // Update totals
        userTotalStaked[msg.sender] -= stakeInfo.amount;
        totalStaked -= stakeInfo.amount;
        
        // Mark stake as inactive
        stakeInfo.isActive = false;
        
        emit StakeUnstaked(_stakeId, msg.sender, stakeInfo.amount, penalty, amount);
        
        return amount;
    }
    
    /**
     * @notice Claim rewards pentru un stake
     * @param _stakeId ID-ul stake-ului
     * @return rewardAmount Amount de rewards claimed
     */
    function claimRewards(uint256 _stakeId) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 rewardAmount) 
    {
        Stake storage stakeInfo = stakes[_stakeId];
        
        require(stakeInfo.user == msg.sender, "StakingRewards: Not your stake");
        require(stakeInfo.isActive, "StakingRewards: Stake not active");
        
        return _claimRewards(_stakeId);
    }
    
    /**
     * @notice Claim rewards pentru toate stake-urile unui user
     * @return totalRewards Total rewards claimed
     */
    function claimAllRewards() 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 totalRewards) 
    {
        uint256[] memory userStakeIds = userStakes[msg.sender];
        totalRewards = 0;
        
        for (uint256 i = 0; i < userStakeIds.length; i++) {
            if (stakes[userStakeIds[i]].isActive) {
                totalRewards += _claimRewards(userStakeIds[i]);
            }
        }
        
        return totalRewards;
    }
    
    /**
     * @notice Restake rewards într-un stake nou
     * @param _stakeId ID-ul stake-ului existent
     * @param _lockPeriod Lock period pentru noul stake
     * @return newStakeId ID-ul noului stake
     */
    function restakeRewards(uint256 _stakeId, uint256 _lockPeriod) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 newStakeId) 
    {
        Stake storage stakeInfo = stakes[_stakeId];
        
        require(stakeInfo.user == msg.sender, "StakingRewards: Not your stake");
        require(stakeInfo.isActive, "StakingRewards: Stake not active");
        require(_isValidLockPeriod(_lockPeriod), "StakingRewards: Invalid lock period");
        
        // Claim rewards
        uint256 rewards = _claimRewards(_stakeId);
        
        require(rewards >= minStakeAmount, "StakingRewards: Rewards below minimum");
        
        // Create new stake cu rewards
        return stake(rewards, _lockPeriod);
    }
    
    // ============ TREASURY FUNCTIONS (Only Treasury Contract) ============
    
    /**
     * @notice Distribute rewards (callable de la treasury contract)
     * @param _token Address-ul token-ului (address(0) pentru BNB)
     * @param _amount Amount de rewards de distribuit
     */
    function distributeRewards(address _token, uint256 _amount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(msg.sender == treasury, "StakingRewards: Only treasury can distribute");
        require(_amount > 0, "StakingRewards: Invalid amount");
        require(totalStaked > 0, "StakingRewards: No stakers");
        
        // Transfer tokens de la treasury la contract
        if (_token == address(0)) {
            require(address(this).balance >= _amount, "StakingRewards: Insufficient BNB balance");
            // Treasury ar trebui să trimită BNB la contract înainte
        } else {
            IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        }
        
        // Record distribution
        rewardDistributions.push(RewardDistribution({
            token: _token,
            amount: _amount,
            distributedAt: block.timestamp,
            totalStaked: totalStaked
        }));
        
        totalPendingRewards += _amount;
        totalRewardsDistributed += _amount;
        
        emit RewardsDistributed(_token, _amount, totalStaked, block.timestamp);
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    /**
     * @notice Claim rewards pentru un stake (internal)
     * @param _stakeId ID-ul stake-ului
     * @return rewardAmount Amount de rewards claimed
     */
    function _claimRewards(uint256 _stakeId) internal returns (uint256 rewardAmount) {
        Stake storage stakeInfo = stakes[_stakeId];
        
        // Calculate pending rewards (simplified - în producție ar trebui calculat based on APR și time)
        rewardAmount = _calculatePendingRewards(_stakeId);
        
        if (rewardAmount == 0) {
            return 0;
        }
        
        // Check dacă contractul are suficiente rewards
        require(totalPendingRewards >= rewardAmount, "StakingRewards: Insufficient rewards");
        
        // Determine reward token (pentru acum, folosim BITS token)
        // În producție, rewards ar putea fi în multiple tokens
        address rewardToken = address(bitsToken);
        
        // Transfer rewards to user
        if (rewardToken == address(bitsToken)) {
            // Pentru BITS rewards, verificăm balance
            require(
                bitsToken.balanceOf(address(this)) >= rewardAmount,
                "StakingRewards: Insufficient BITS balance"
            );
            bitsToken.safeTransfer(stakeInfo.user, rewardAmount);
        } else {
            // Pentru alte tokens (BNB, USDT, etc.)
            IERC20(rewardToken).safeTransfer(stakeInfo.user, rewardAmount);
        }
        
        // Update stake data
        stakeInfo.rewardsClaimed += rewardAmount;
        stakeInfo.lastRewardClaim = block.timestamp;
        
        // Update pending rewards
        totalPendingRewards -= rewardAmount;
        
        emit RewardsClaimed(_stakeId, stakeInfo.user, rewardToken, rewardAmount);
        
        // Update tier dacă este necesar
        StakingTier newTier = _determineTier(userTotalStaked[stakeInfo.user]);
        if (newTier != stakeInfo.tier) {
            StakingTier oldTier = stakeInfo.tier;
            stakeInfo.tier = newTier;
            emit TierUpdated(_stakeId, stakeInfo.user, oldTier, newTier);
        }
        
        return rewardAmount;
    }
    
    /**
     * @notice Calculate pending rewards pentru un stake (simplified)
     * @param _stakeId ID-ul stake-ului
     * @return rewardAmount Pending rewards
     */
    function _calculatePendingRewards(uint256 _stakeId) internal view returns (uint256 rewardAmount) {
        Stake memory stakeInfo = stakes[_stakeId];
        
        if (!stakeInfo.isActive || totalStaked == 0) {
            return 0;
        }
        
        // Simplified calculation: proportional distribution based on stake amount
        // În producție, ar trebui calculat based on APR, time, și tier
        if (totalPendingRewards == 0) {
            return 0;
        }
        
        // Calculate user share din total staked
        uint256 userShare = (stakeInfo.amount * FEE_DENOMINATOR) / totalStaked;
        
        // Calculate reward amount (proportional)
        rewardAmount = (totalPendingRewards * userShare) / FEE_DENOMINATOR;
        
        // Apply tier multiplier (higher tier = more rewards)
        uint256 tierMultiplier = _getTierMultiplier(stakeInfo.tier);
        rewardAmount = (rewardAmount * tierMultiplier) / FEE_DENOMINATOR;
        
        // Apply lock period multiplier
        if (stakeInfo.lockPeriod > 0) {
            uint256 lockMultiplier = lockPeriodMultipliers[stakeInfo.lockPeriod];
            rewardAmount = (rewardAmount * lockMultiplier) / FEE_DENOMINATOR;
        }
        
        return rewardAmount;
    }
    
    /**
     * @notice Determine staking tier pentru un amount
     * @param _amount Total staked amount
     * @return StakingTier Tier-ul determinat
     */
    function _determineTier(uint256 _amount) internal view returns (StakingTier) {
        if (_amount >= tierThresholds[StakingTier.PLATINUM]) {
            return StakingTier.PLATINUM;
        } else if (_amount >= tierThresholds[StakingTier.GOLD]) {
            return StakingTier.GOLD;
        } else if (_amount >= tierThresholds[StakingTier.SILVER]) {
            return StakingTier.SILVER;
        } else {
            return StakingTier.BRONZE;
        }
    }
    
    /**
     * @notice Get tier multiplier (pentru rewards calculation)
     * @param _tier Staking tier
     * @return multiplier Multiplier (in basis points)
     */
    function _getTierMultiplier(StakingTier _tier) internal view returns (uint256 multiplier) {
        // Bronze: 1x, Silver: 1.1x, Gold: 1.2x, Platinum: 1.5x
        if (_tier == StakingTier.PLATINUM) {
            return 15000; // 1.5x
        } else if (_tier == StakingTier.GOLD) {
            return 12000; // 1.2x
        } else if (_tier == StakingTier.SILVER) {
            return 11000; // 1.1x
        } else {
            return 10000; // 1x
        }
    }
    
    /**
     * @notice Verifică dacă lock period este valid
     * @param _lockPeriod Lock period în seconds
     * @return bool True dacă e valid
     */
    function _isValidLockPeriod(uint256 _lockPeriod) internal view returns (bool) {
        for (uint256 i = 0; i < lockPeriods.length; i++) {
            if (lockPeriods[i] == _lockPeriod) {
                return true;
            }
        }
        return false;
    }
    
    // ============ OWNER FUNCTIONS ============
    
    /**
     * @notice Update treasury address
     * @param _newTreasury Address-ul nou al treasury
     */
    function setTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "StakingRewards: Invalid treasury address");
        treasury = _newTreasury;
    }
    
    /**
     * @notice Update min stake amount
     * @param _minAmount New minimum stake amount
     */
    function setMinStakeAmount(uint256 _minAmount) external onlyOwner {
        require(_minAmount > 0, "StakingRewards: Invalid min amount");
        minStakeAmount = _minAmount;
    }
    
    /**
     * @notice Update max stake amount per user
     * @param _maxAmount New max stake amount (0 = unlimited)
     */
    function setMaxStakeAmountPerUser(uint256 _maxAmount) external onlyOwner {
        maxStakeAmountPerUser = _maxAmount;
    }
    
    /**
     * @notice Update tier APR
     * @param _tier Staking tier
     * @param _apr New APR (in basis points, 100 = 1%)
     */
    function setTierAPR(StakingTier _tier, uint256 _apr) external onlyOwner {
        require(_apr <= 10000, "StakingRewards: APR cannot exceed 100%");
        tierAPRs[_tier] = _apr;
    }
    
    /**
     * @notice Update lock period multiplier
     * @param _lockPeriod Lock period (in seconds)
     * @param _multiplier New multiplier (in basis points)
     */
    function setLockPeriodMultiplier(uint256 _lockPeriod, uint256 _multiplier) external onlyOwner {
        require(_isValidLockPeriod(_lockPeriod), "StakingRewards: Invalid lock period");
        require(_multiplier >= 10000, "StakingRewards: Multiplier must be >= 1x");
        lockPeriodMultipliers[_lockPeriod] = _multiplier;
    }
    
    /**
     * @notice Update early unstake penalty
     * @param _penaltyBps New penalty (in basis points, 100 = 1%)
     */
    function setEarlyUnstakePenalty(uint256 _penaltyBps) external onlyOwner {
        require(_penaltyBps <= 1000, "StakingRewards: Penalty cannot exceed 10%");
        earlyUnstakePenaltyBps = _penaltyBps;
    }
    
    /**
     * @notice Update cooldown period
     * @param _cooldown New cooldown period (in seconds)
     */
    function setCooldownPeriod(uint256 _cooldown) external onlyOwner {
        cooldownPeriod = _cooldown;
    }
    
    /**
     * @notice Add new lock period
     * @param _lockPeriod New lock period (in seconds)
     * @param _multiplier Multiplier pentru acest lock period (in basis points)
     */
    function addLockPeriod(uint256 _lockPeriod, uint256 _multiplier) external onlyOwner {
        require(_lockPeriod > 0, "StakingRewards: Invalid lock period");
        require(_multiplier >= 10000, "StakingRewards: Multiplier must be >= 1x");
        require(!_isValidLockPeriod(_lockPeriod), "StakingRewards: Lock period already exists");
        
        lockPeriods.push(_lockPeriod);
        lockPeriodMultipliers[_lockPeriod] = _multiplier;
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
            require(success, "StakingRewards: BNB transfer failed");
        } else {
            // Nu permitem withdraw BITS tokens (sunt staked)
            require(_token != address(bitsToken), "StakingRewards: Cannot withdraw BITS tokens");
            IERC20(_token).safeTransfer(owner(), _amount);
        }
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Returnează un stake
     * @param _stakeId ID-ul stake-ului
     * @return Stake Stake struct
     */
    function getStake(uint256 _stakeId) external view returns (Stake memory) {
        return stakes[_stakeId];
    }
    
    /**
     * @notice Returnează toate stake-urile unui user
     * @param _user Address-ul user-ului
     * @return uint256[] Lista de stake IDs
     */
    function getUserStakes(address _user) external view returns (uint256[] memory) {
        return userStakes[_user];
    }
    
    /**
     * @notice Calculate pending rewards pentru un stake
     * @param _stakeId ID-ul stake-ului
     * @return uint256 Pending rewards
     */
    function getPendingRewards(uint256 _stakeId) external view returns (uint256) {
        return _calculatePendingRewards(_stakeId);
    }
    
    /**
     * @notice Calculate total pending rewards pentru un user
     * @param _user Address-ul user-ului
     * @return uint256 Total pending rewards
     */
    function getTotalPendingRewards(address _user) external view returns (uint256) {
        uint256[] memory userStakeIds = userStakes[_user];
        uint256 total = 0;
        
        for (uint256 i = 0; i < userStakeIds.length; i++) {
            if (stakes[userStakeIds[i]].isActive) {
                total += _calculatePendingRewards(userStakeIds[i]);
            }
        }
        
        return total;
    }
    
    /**
     * @notice Calculate APR pentru un stake (estimated)
     * @param _stakeId ID-ul stake-ului
     * @return uint256 APR (in basis points, 100 = 1%)
     */
    function getStakeAPR(uint256 _stakeId) external view returns (uint256) {
        Stake memory stakeInfo = stakes[_stakeId];
        
        uint256 baseAPR = tierAPRs[stakeInfo.tier];
        
        // Apply lock period multiplier
        if (stakeInfo.lockPeriod > 0) {
            uint256 lockMultiplier = lockPeriodMultipliers[stakeInfo.lockPeriod];
            baseAPR = (baseAPR * lockMultiplier) / FEE_DENOMINATOR;
        }
        
        return baseAPR;
    }
    
    /**
     * @notice Returnează numărul total de stakers
     * @return uint256 Numărul de stakers activi
     */
    function getTotalStakers() external view returns (uint256) {
        // Simplified - în producție ar trebui să numărăm unique users cu stake-uri active
        return stakeCounter - 1; // Placeholder
    }
    
    /**
     * @notice Returnează lock periods disponibile
     * @return uint256[] Lista de lock periods (in seconds)
     */
    function getLockPeriods() external view returns (uint256[] memory) {
        return lockPeriods;
    }
    
    /**
     * @notice Returnează reward distribution history
     * @return RewardDistribution[] Lista de distributions
     */
    function getRewardDistributionHistory() external view returns (RewardDistribution[] memory) {
        return rewardDistributions;
    }
    
    /**
     * @notice Returnează numărul total de reward distributions
     * @return uint256 Numărul de distributions
     */
    function getTotalRewardDistributions() external view returns (uint256) {
        return rewardDistributions.length;
    }
    
    // ============ RECEIVE ============
    
    /**
     * @dev Receive BNB (pentru reward distributions)
     */
    receive() external payable {
        // Contractul poate primi BNB pentru reward distributions
        // Treasury ar trebui să apeleze distributeRewards(address(0), msg.value)
    }
}

