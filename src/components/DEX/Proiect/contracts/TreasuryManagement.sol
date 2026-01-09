// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TreasuryManagement
 * @dev Smart Contract pentru management-ul fondurilor treasury
 * @notice Gestionează fondurile colectate, distribuția automată, și withdrawals controlled
 * @author BitSwapDEX Team
 * @custom:security-contact security@bitswapdex.com
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TreasuryManagement is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // ============ STRUCTS & ENUMS ============
    
    /**
     * @notice Budget categories
     */
    enum BudgetCategory {
        DEVELOPMENT,    // Development și R&D
        MARKETING,      // Marketing și promotion
        OPERATIONS,     // Operational costs
        EMERGENCY,      // Emergency fund
        STAKING_REWARDS,// Rewards pentru stakers
        BURN            // Token burn
    }
    
    /**
     * @notice Withdrawal request struct
     */
    struct WithdrawalRequest {
        uint256 requestId;
        address token;              // address(0) pentru BNB
        uint256 amount;
        address to;
        BudgetCategory category;
        string reason;              // Reason pentru withdrawal
        uint256 scheduledAt;        // Timestamp când e scheduled
        uint256 executedAt;         // Timestamp când a fost executat (0 = not executed)
        bool executed;
        bool cancelled;
        address requestedBy;        // Address care a creat request-ul
    }
    
    /**
     * @notice Budget allocation struct
     */
    struct BudgetAllocation {
        BudgetCategory category;
        uint256 allocated;          // Total allocated
        uint256 spent;              // Total spent
        uint256 cap;                // Max cap (0 = unlimited)
        bool isActive;              // Dacă categoria este activă
    }
    
    /**
     * @notice Multi-sig configuration
     */
    struct MultisigConfig {
        address[] signers;          // Lista de signers
        uint256 requiredSignatures; // Numărul minim de semnături necesare
        mapping(address => bool) isSigner;
        mapping(uint256 => mapping(address => bool)) hasSigned; // requestId => signer => hasSigned
    }
    
    // ============ STATE VARIABLES ============
    
    /// @notice Multi-sig configuration
    MultisigConfig public multisigConfig;
    
    /// @notice Withdrawal request counter
    uint256 public withdrawalRequestCounter;
    
    /// @notice Mapping: requestId => WithdrawalRequest
    mapping(uint256 => WithdrawalRequest) public withdrawalRequests;
    
    /// @notice Mapping: category => BudgetAllocation
    mapping(BudgetCategory => BudgetAllocation) public budgetAllocations;
    
    /// @notice Mapping: token => balance
    mapping(address => uint256) public tokenBalances;
    
    /// @notice Total funds deposited
    uint256 public totalDeposited;
    
    /// @notice Total funds withdrawn
    uint256 public totalWithdrawn;
    
    /// @notice Timelock duration pentru withdrawals mari (in seconds)
    uint256 public timelockDuration;
    
    /// @notice Threshold pentru timelock (amount in wei/USD equivalent)
    uint256 public timelockThreshold;
    
    /// @notice Automatic distribution enabled
    bool public autoDistributionEnabled;
    
    /// @notice Last distribution timestamp
    uint256 public lastDistributionTime;
    
    /// @notice Distribution interval (in seconds, e.g., 7 days = 604800)
    uint256 public distributionInterval;
    
    // ============ CONSTANTS ============
    
    /// @notice Maximum number of signers în multi-sig
    uint256 public constant MAX_SIGNERS = 10;
    
    /// @notice Minimum required signatures
    uint256 public constant MIN_REQUIRED_SIGNATURES = 2;
    
    // ============ EVENTS ============
    
    event FundsDeposited(
        address indexed token,
        uint256 amount,
        address indexed from
    );
    
    event WithdrawalRequested(
        uint256 indexed requestId,
        address indexed token,
        uint256 amount,
        address indexed to,
        BudgetCategory category,
        string reason,
        uint256 scheduledAt
    );
    
    event WithdrawalExecuted(
        uint256 indexed requestId,
        address indexed token,
        uint256 amount,
        address indexed to,
        BudgetCategory category
    );
    
    event WithdrawalCancelled(
        uint256 indexed requestId,
        address indexed cancelledBy
    );
    
    event WithdrawalSigned(
        uint256 indexed requestId,
        address indexed signer
    );
    
    event BudgetAllocated(
        BudgetCategory category,
        uint256 amount,
        uint256 cap
    );
    
    event BudgetSpent(
        BudgetCategory category,
        uint256 amount
    );
    
    event MultisigSignerAdded(address indexed signer);
    event MultisigSignerRemoved(address indexed signer);
    event MultisigConfigUpdated(uint256 requiredSignatures);
    
    event TimelockDurationUpdated(uint256 oldDuration, uint256 newDuration);
    event TimelockThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    
    event AutoDistributionToggled(bool enabled);
    event DistributionExecuted(uint256 timestamp);
    
    // ============ MODIFIERS ============
    
    /**
     * @notice Verifică dacă msg.sender este un multisig signer
     */
    modifier onlyMultisigSigner() {
        require(
            multisigConfig.isSigner[msg.sender],
            "TreasuryManagement: Not a multisig signer"
        );
        _;
    }
    
    /**
     * @notice Verifică dacă request-ul există și nu e executat/cancelled
     */
    modifier validWithdrawalRequest(uint256 _requestId) {
        require(
            withdrawalRequests[_requestId].requestedBy != address(0),
            "TreasuryManagement: Request does not exist"
        );
        require(
            !withdrawalRequests[_requestId].executed,
            "TreasuryManagement: Request already executed"
        );
        require(
            !withdrawalRequests[_requestId].cancelled,
            "TreasuryManagement: Request already cancelled"
        );
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Constructor
     * @param _signers Lista de signers pentru multi-sig
     * @param _requiredSignatures Numărul minim de semnături necesare
     * @param _timelockDuration Timelock duration pentru withdrawals mari (in seconds)
     * @param _timelockThreshold Threshold pentru timelock (in wei/USD equivalent)
     */
    constructor(
        address[] memory _signers,
        uint256 _requiredSignatures,
        uint256 _timelockDuration,
        uint256 _timelockThreshold
    ) {
        require(_signers.length >= MIN_REQUIRED_SIGNATURES, "TreasuryManagement: Too few signers");
        require(_signers.length <= MAX_SIGNERS, "TreasuryManagement: Too many signers");
        require(
            _requiredSignatures >= MIN_REQUIRED_SIGNATURES && _requiredSignatures <= _signers.length,
            "TreasuryManagement: Invalid required signatures"
        );
        require(_timelockDuration > 0, "TreasuryManagement: Invalid timelock duration");
        
        // Initialize multisig config
        multisigConfig.signers = _signers;
        multisigConfig.requiredSignatures = _requiredSignatures;
        
        for (uint256 i = 0; i < _signers.length; i++) {
            require(_signers[i] != address(0), "TreasuryManagement: Invalid signer address");
            require(!multisigConfig.isSigner[_signers[i]], "TreasuryManagement: Duplicate signer");
            multisigConfig.isSigner[_signers[i]] = true;
        }
        
        timelockDuration = _timelockDuration;
        timelockThreshold = _timelockThreshold;
        
        // Initialize budget allocations
        for (uint256 i = 0; i <= uint256(BudgetCategory.BURN); i++) {
            budgetAllocations[BudgetCategory(i)] = BudgetAllocation({
                category: BudgetCategory(i),
                allocated: 0,
                spent: 0,
                cap: 0, // Unlimited by default
                isActive: true
            });
        }
        
        // Start request counter from 1
        withdrawalRequestCounter = 1;
        
        // Set default distribution interval (7 days)
        distributionInterval = 7 days;
    }
    
    // ============ MULTISIG FUNCTIONS ============
    
    /**
     * @notice Creează un withdrawal request
     * @param _token Address-ul token-ului (address(0) pentru BNB)
     * @param _amount Cantitatea
     * @param _to Address-ul destinatar
     * @param _category Budget category
     * @param _reason Reason pentru withdrawal
     * @return requestId ID-ul request-ului
     */
    function requestWithdrawal(
        address _token,
        uint256 _amount,
        address _to,
        BudgetCategory _category,
        string memory _reason
    ) external onlyMultisigSigner nonReentrant whenNotPaused returns (uint256) {
        require(_to != address(0), "TreasuryManagement: Invalid recipient address");
        require(_amount > 0, "TreasuryManagement: Invalid amount");
        require(uint256(_category) <= uint256(BudgetCategory.BURN), "TreasuryManagement: Invalid category");
        
        // Check budget cap
        BudgetAllocation memory budget = budgetAllocations[_category];
        require(budget.isActive, "TreasuryManagement: Category is not active");
        
        if (budget.cap > 0) {
            require(
                budget.spent + _amount <= budget.cap,
                "TreasuryManagement: Exceeds budget cap"
            );
        }
        
        // Check balance
        if (_token == address(0)) {
            require(address(this).balance >= _amount, "TreasuryManagement: Insufficient BNB balance");
        } else {
            require(
                IERC20(_token).balanceOf(address(this)) >= _amount,
                "TreasuryManagement: Insufficient token balance"
            );
        }
        
        // Calculate scheduled time (with timelock dacă amount > threshold)
        uint256 scheduledAt = block.timestamp;
        if (_amount >= timelockThreshold) {
            scheduledAt = block.timestamp + timelockDuration;
        }
        
        // Create request
        uint256 requestId = withdrawalRequestCounter;
        withdrawalRequestCounter++;
        
        withdrawalRequests[requestId] = WithdrawalRequest({
            requestId: requestId,
            token: _token,
            amount: _amount,
            to: _to,
            category: _category,
            reason: _reason,
            scheduledAt: scheduledAt,
            executedAt: 0,
            executed: false,
            cancelled: false,
            requestedBy: msg.sender
        });
        
        // Auto-sign by requester
        multisigConfig.hasSigned[requestId][msg.sender] = true;
        
        emit WithdrawalRequested(requestId, _token, _amount, _to, _category, _reason, scheduledAt);
        emit WithdrawalSigned(requestId, msg.sender);
        
        // Auto-execute dacă are suficiente semnături și timelock a trecut
        if (_hasEnoughSignatures(requestId) && scheduledAt <= block.timestamp) {
            _executeWithdrawal(requestId);
        }
        
        return requestId;
    }
    
    /**
     * @notice Signează un withdrawal request
     * @param _requestId ID-ul request-ului
     */
    function signWithdrawalRequest(uint256 _requestId) 
        external 
        onlyMultisigSigner 
        validWithdrawalRequest(_requestId) 
    {
        require(
            !multisigConfig.hasSigned[_requestId][msg.sender],
            "TreasuryManagement: Already signed"
        );
        
        multisigConfig.hasSigned[_requestId][msg.sender] = true;
        
        emit WithdrawalSigned(_requestId, msg.sender);
        
        // Auto-execute dacă are suficiente semnături și timelock a trecut
        WithdrawalRequest memory request = withdrawalRequests[_requestId];
        if (_hasEnoughSignatures(_requestId) && request.scheduledAt <= block.timestamp) {
            _executeWithdrawal(_requestId);
        }
    }
    
    /**
     * @notice Execută un withdrawal request (dacă are suficiente semnături)
     * @param _requestId ID-ul request-ului
     */
    function executeWithdrawal(uint256 _requestId) 
        external 
        validWithdrawalRequest(_requestId) 
        nonReentrant 
    {
        WithdrawalRequest memory request = withdrawalRequests[_requestId];
        
        require(
            request.scheduledAt <= block.timestamp,
            "TreasuryManagement: Timelock not expired"
        );
        
        require(
            _hasEnoughSignatures(_requestId),
            "TreasuryManagement: Not enough signatures"
        );
        
        _executeWithdrawal(_requestId);
    }
    
    /**
     * @notice Anulează un withdrawal request
     * @param _requestId ID-ul request-ului
     */
    function cancelWithdrawalRequest(uint256 _requestId) 
        external 
        onlyMultisigSigner 
        validWithdrawalRequest(_requestId) 
    {
        withdrawalRequests[_requestId].cancelled = true;
        
        emit WithdrawalCancelled(_requestId, msg.sender);
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    /**
     * @notice Execută un withdrawal request (internal)
     */
    function _executeWithdrawal(uint256 _requestId) internal {
        WithdrawalRequest storage request = withdrawalRequests[_requestId];
        
        // Update budget
        budgetAllocations[request.category].spent += request.amount;
        
        // Transfer funds
        if (request.token == address(0)) {
            // Transfer BNB
            (bool success, ) = payable(request.to).call{value: request.amount}("");
            require(success, "TreasuryManagement: BNB transfer failed");
        } else {
            // Transfer tokens
            IERC20(request.token).safeTransfer(request.to, request.amount);
        }
        
        // Update balances
        tokenBalances[request.token] -= request.amount;
        totalWithdrawn += request.amount;
        
        // Update request
        request.executed = true;
        request.executedAt = block.timestamp;
        
        emit WithdrawalExecuted(
            _requestId,
            request.token,
            request.amount,
            request.to,
            request.category
        );
    }
    
    /**
     * @notice Verifică dacă request-ul are suficiente semnături
     */
    function _hasEnoughSignatures(uint256 _requestId) internal view returns (bool) {
        uint256 signatureCount = 0;
        address[] memory signers = multisigConfig.signers;
        
        for (uint256 i = 0; i < signers.length; i++) {
            if (multisigConfig.hasSigned[_requestId][signers[i]]) {
                signatureCount++;
            }
        }
        
        return signatureCount >= multisigConfig.requiredSignatures;
    }
    
    // ============ OWNER FUNCTIONS ============
    
    /**
     * @notice Adaugă un multisig signer
     * @param _signer Address-ul signer-ului
     */
    function addMultisigSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "TreasuryManagement: Invalid signer address");
        require(!multisigConfig.isSigner[_signer], "TreasuryManagement: Already a signer");
        require(multisigConfig.signers.length < MAX_SIGNERS, "TreasuryManagement: Too many signers");
        
        multisigConfig.signers.push(_signer);
        multisigConfig.isSigner[_signer] = true;
        
        emit MultisigSignerAdded(_signer);
    }
    
    /**
     * @notice Elimină un multisig signer
     * @param _signer Address-ul signer-ului
     */
    function removeMultisigSigner(address _signer) external onlyOwner {
        require(multisigConfig.isSigner[_signer], "TreasuryManagement: Not a signer");
        require(
            multisigConfig.signers.length > multisigConfig.requiredSignatures,
            "TreasuryManagement: Cannot remove - would violate required signatures"
        );
        
        // Remove from signers array
        address[] storage signers = multisigConfig.signers;
        for (uint256 i = 0; i < signers.length; i++) {
            if (signers[i] == _signer) {
                signers[i] = signers[signers.length - 1];
                signers.pop();
                break;
            }
        }
        
        multisigConfig.isSigner[_signer] = false;
        
        emit MultisigSignerRemoved(_signer);
    }
    
    /**
     * @notice Actualizează numărul de semnături necesare
     * @param _requiredSignatures New required signatures
     */
    function updateRequiredSignatures(uint256 _requiredSignatures) external onlyOwner {
        require(
            _requiredSignatures >= MIN_REQUIRED_SIGNATURES && _requiredSignatures <= multisigConfig.signers.length,
            "TreasuryManagement: Invalid required signatures"
        );
        
        multisigConfig.requiredSignatures = _requiredSignatures;
        
        emit MultisigConfigUpdated(_requiredSignatures);
    }
    
    /**
     * @notice Allocate budget pentru o categorie
     * @param _category Budget category
     * @param _cap Max cap (0 = unlimited)
     */
    function allocateBudget(BudgetCategory _category, uint256 _cap) external onlyOwner {
        require(uint256(_category) <= uint256(BudgetCategory.BURN), "TreasuryManagement: Invalid category");
        
        budgetAllocations[_category].cap = _cap;
        budgetAllocations[_category].isActive = true;
        
        emit BudgetAllocated(_category, 0, _cap);
    }
    
    /**
     * @notice Set timelock duration
     * @param _duration New duration (in seconds)
     */
    function setTimelockDuration(uint256 _duration) external onlyOwner {
        require(_duration > 0, "TreasuryManagement: Invalid duration");
        uint256 oldDuration = timelockDuration;
        timelockDuration = _duration;
        emit TimelockDurationUpdated(oldDuration, _duration);
    }
    
    /**
     * @notice Set timelock threshold
     * @param _threshold New threshold (in wei/USD equivalent)
     */
    function setTimelockThreshold(uint256 _threshold) external onlyOwner {
        uint256 oldThreshold = timelockThreshold;
        timelockThreshold = _threshold;
        emit TimelockThresholdUpdated(oldThreshold, _threshold);
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
     * @notice Set distribution interval
     * @param _interval New interval (in seconds)
     */
    function setDistributionInterval(uint256 _interval) external onlyOwner {
        require(_interval > 0, "TreasuryManagement: Invalid interval");
        distributionInterval = _interval;
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
            require(success, "TreasuryManagement: BNB transfer failed");
        } else {
            IERC20(_token).safeTransfer(owner(), _amount);
        }
    }
    
    // ============ DEPOSIT FUNCTIONS ============
    
    /**
     * @notice Deposit funds (external call - de la BitSwapDEXWrapper sau alte contracte)
     * @param _token Address-ul token-ului (address(0) pentru BNB)
     * @param _amount Cantitatea
     */
    function deposit(address _token, uint256 _amount) external payable {
        if (_token == address(0)) {
            // BNB deposit
            require(msg.value > 0, "TreasuryManagement: Invalid BNB amount");
            require(msg.value == _amount, "TreasuryManagement: Amount mismatch");
            tokenBalances[address(0)] += msg.value;
            totalDeposited += msg.value;
            emit FundsDeposited(address(0), msg.value, msg.sender);
        } else {
            // Token deposit
            require(_amount > 0, "TreasuryManagement: Invalid token amount");
            IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
            tokenBalances[_token] += _amount;
            totalDeposited += _amount;
            emit FundsDeposited(_token, _amount, msg.sender);
        }
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Returnează un withdrawal request
     * @param _requestId ID-ul request-ului
     * @return WithdrawalRequest Request struct
     */
    function getWithdrawalRequest(uint256 _requestId) external view returns (WithdrawalRequest memory) {
        return withdrawalRequests[_requestId];
    }
    
    /**
     * @notice Returnează numărul de semnături pentru un request
     * @param _requestId ID-ul request-ului
     * @return uint256 Numărul de semnături
     */
    function getSignatureCount(uint256 _requestId) external view returns (uint256) {
        uint256 count = 0;
        address[] memory signers = multisigConfig.signers;
        
        for (uint256 i = 0; i < signers.length; i++) {
            if (multisigConfig.hasSigned[_requestId][signers[i]]) {
                count++;
            }
        }
        
        return count;
    }
    
    /**
     * @notice Verifică dacă un signer a semnat un request
     * @param _requestId ID-ul request-ului
     * @param _signer Address-ul signer-ului
     * @return bool True dacă a semnat
     */
    function hasSigned(uint256 _requestId, address _signer) external view returns (bool) {
        return multisigConfig.hasSigned[_requestId][_signer];
    }
    
    /**
     * @notice Returnează lista de multisig signers
     * @return address[] Lista de adrese
     */
    function getMultisigSigners() external view returns (address[] memory) {
        return multisigConfig.signers;
    }
    
    /**
     * @notice Returnează budget allocation pentru o categorie
     * @param _category Budget category
     * @return BudgetAllocation Budget struct
     */
    function getBudgetAllocation(BudgetCategory _category) external view returns (BudgetAllocation memory) {
        return budgetAllocations[_category];
    }
    
    // ============ RECEIVE ============
    
    /**
     * @dev Receive BNB (pentru deposits)
     */
    receive() external payable {
        tokenBalances[address(0)] += msg.value;
        totalDeposited += msg.value;
        emit FundsDeposited(address(0), msg.value, msg.sender);
    }
}

