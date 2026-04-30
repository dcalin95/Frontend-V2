// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BitSwapDEXWrapper
 * @dev Smart Contract Wrapper pentru BitSwapDEX
 * @notice Interceptează swap-urile, colectează fee-uri (0.1%), și trimite restul la PancakeSwap Router
 * @author BitSwapDEX Team
 * @custom:security-contact security@bitswapdex.com
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

interface IPancakeRouter {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);
    
    function swapExactTokensForETH(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function WETH() external pure returns (address);
}

contract BitSwapDEXWrapper is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // ============ CONSTANTS ============
    
    /// @notice PancakeSwap Router V2 (BSC)
    address public constant PANCAKE_ROUTER = 0x10ED43C718714eb63d5aA57B78B54704E256024E;
    
    /// @notice Protocol fee: 0.1% (10 basis points)
    uint256 public constant PROTOCOL_FEE_BPS = 10; // 0.1%
    
    /// @notice Maximum fee: 1% (safety limit)
    uint256 public constant MAX_FEE_BPS = 100; // 1%
    
    /// @notice Fee denominator (for precision)
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    // ============ STATE VARIABLES ============
    
    /// @notice Treasury wallet pentru fee collection
    address public treasury;
    
    /// @notice UserVault contract (pentru fee distribution către users)
    address public userVault;
    
    /// @notice StakingRewards contract (pentru fee distribution către stakers)
    address public stakingRewards;
    
    /// @notice Fee distribution: percentage pentru burn (0-100%)
    uint256 public burnPercentage = 0; // 0% - burn eliminat complet
    
    /// @notice Fee distribution: percentage pentru stakers (0-100%)
    uint256 public stakersPercentage = 0; // 0% - poate fi activat mai târziu dacă ai nevoie
    
    /// @notice Fee distribution: percentage pentru treasury (0-100%)
    uint256 public treasuryPercentage = 100; // 100% - toate fee-urile la treasury
    
    /// @notice Total fees collected (historical)
    mapping(address => uint256) public totalFeesCollected; // token => amount
    
    /// @notice Total fees collected in USD (estimated)
    uint256 public totalFeesCollectedUSD;
    
    /// @notice Authorized contracts (pentru execuție din partea altor contracte)
    mapping(address => bool) public authorizedExecutors;
    
    // ============ EVENTS ============
    
    event FeeCollected(
        address indexed token,
        uint256 amount,
        uint256 burnAmount,
        uint256 stakersAmount,
        uint256 treasuryAmount
    );
    
    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 feeAmount
    );
    
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event FeeDistributionUpdated(
        uint256 burnPercentage,
        uint256 stakersPercentage,
        uint256 treasuryPercentage
    );
    
    event ExecutorAuthorized(address indexed executor);
    event ExecutorRevoked(address indexed executor);
    
    event UserVaultUpdated(address indexed oldVault, address indexed newVault);
    event StakingRewardsUpdated(address indexed oldStaking, address indexed newStaking);
    
    event FeesDistributedToStaking(
        address indexed token,
        uint256 amount
    );
    
    // ============ MODIFIERS ============
    
    modifier validFeeDistribution() {
        require(
            burnPercentage + stakersPercentage + treasuryPercentage == 100,
            "Invalid fee distribution"
        );
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Constructor
     * @param _treasury Address-ul treasury wallet pentru fee collection
     */
    constructor(address _treasury) {
        require(_treasury != address(0), "Treasury cannot be zero address");
        treasury = _treasury;
        transferOwnership(msg.sender);
    }
    
    // ============ PUBLIC/EXTERNAL FUNCTIONS ============
    
    /**
     * @dev Swap tokens for tokens prin PancakeSwap Router
     * @param tokenIn Address-ul token-ului de input
     * @param tokenOut Address-ul token-ului de output
     * @param amountIn Cantitatea de input tokens
     * @param amountOutMin Minimum output tokens (slippage protection)
     * @param deadline Deadline pentru swap
     * @return amounts Array cu amountIn și amountOut
     */
    function swapTokensForTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline
    ) external nonReentrant whenNotPaused returns (uint[] memory amounts) {
        require(amountIn > 0, "Amount must be greater than 0");
        require(tokenIn != address(0) && tokenOut != address(0), "Invalid token addresses");
        require(deadline >= block.timestamp, "Deadline has passed");
        
        // 1. Transfer tokens de la user la contract
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // 2. Calculează fee (0.1%)
        uint256 feeAmount = calculateFee(amountIn);
        uint256 amountToSwap = amountIn - feeAmount;
        
        // 3. Distribuie fee (burn/stakers/treasury)
        _distributeFee(tokenIn, feeAmount);
        
        // 4. Aprobă PancakeSwap Router
        IERC20(tokenIn).safeApprove(PANCAKE_ROUTER, amountToSwap);
        
        // 5. Execută swap
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        IPancakeRouter router = IPancakeRouter(PANCAKE_ROUTER);
        amounts = router.swapExactTokensForTokens(
            amountToSwap,
            amountOutMin,
            path,
            msg.sender, // User primește tokens direct
            deadline
        );
        
        // 6. Reset approval (security best practice)
        IERC20(tokenIn).safeApprove(PANCAKE_ROUTER, 0);
        
        // 7. Emit events
        emit SwapExecuted(
            msg.sender,
            tokenIn,
            tokenOut,
            amountIn,
            amounts[amounts.length - 1],
            feeAmount
        );
    }
    
    /**
     * @dev Swap BNB for tokens prin PancakeSwap Router
     * @param tokenOut Address-ul token-ului de output
     * @param amountOutMin Minimum output tokens (slippage protection)
     * @param deadline Deadline pentru swap
     * @return amounts Array cu amountIn și amountOut
     */
    function swapETHForTokens(
        address tokenOut,
        uint256 amountOutMin,
        uint256 deadline
    ) external payable nonReentrant whenNotPaused returns (uint[] memory amounts) {
        require(msg.value > 0, "Must send BNB");
        require(tokenOut != address(0), "Invalid token address");
        require(deadline >= block.timestamp, "Deadline has passed");
        
        // 1. Calculează fee din msg.value
        uint256 feeAmount = calculateFee(msg.value);
        uint256 amountToSwap = msg.value - feeAmount;
        
        // 2. Distribuie fee (burn/stakers/treasury) - pentru BNB, trimitem direct
        if (feeAmount > 0) {
            uint256 burnAmount = (feeAmount * burnPercentage) / 100;
            uint256 stakersAmount = (feeAmount * stakersPercentage) / 100;
            uint256 treasuryAmount = feeAmount - burnAmount - stakersAmount;
            
            // Burn BNB (trimitem la address(0) - nu e perfect dar e cea mai bună opțiune pentru BNB)
            // Pentru BNB, "burn" înseamnă să trimitem la un dead address
            address deadAddress = 0x000000000000000000000000000000000000dEaD;
            (bool burnSuccess, ) = deadAddress.call{value: burnAmount}("");
            require(burnSuccess, "Burn transfer failed");
            
            // Stakers (placeholder - va fi implementat când avem staking contract)
            // Pentru acum, trimitem la treasury
            (bool stakersSuccess, ) = treasury.call{value: stakersAmount}("");
            require(stakersSuccess, "Stakers transfer failed");
            
            // Treasury (toate fee-urile merg la treasury acum)
            (bool treasurySuccess, ) = treasury.call{value: treasuryAmount}("");
            require(treasurySuccess, "Treasury transfer failed");
            
            emit FeeCollected(address(0), feeAmount, burnAmount, stakersAmount, treasuryAmount);
        }
        
        // 3. Execută swap cu restul
        address[] memory path = new address[](2);
        path[0] = IPancakeRouter(PANCAKE_ROUTER).WETH();
        path[1] = tokenOut;
        
        IPancakeRouter router = IPancakeRouter(PANCAKE_ROUTER);
        amounts = router.swapExactETHForTokens{value: amountToSwap}(
            amountOutMin,
            path,
            msg.sender, // User primește tokens direct
            deadline
        );
        
        // 4. Emit events
        emit SwapExecuted(
            msg.sender,
            address(0), // BNB
            tokenOut,
            msg.value,
            amounts[amounts.length - 1],
            feeAmount
        );
    }
    
    /**
     * @dev Swap tokens for BNB prin PancakeSwap Router
     * @param tokenIn Address-ul token-ului de input
     * @param amountIn Cantitatea de input tokens
     * @param amountOutMin Minimum BNB output (slippage protection)
     * @param deadline Deadline pentru swap
     * @return amounts Array cu amountIn și amountOut
     */
    function swapTokensForETH(
        address tokenIn,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline
    ) external nonReentrant whenNotPaused returns (uint[] memory amounts) {
        require(amountIn > 0, "Amount must be greater than 0");
        require(tokenIn != address(0), "Invalid token address");
        require(deadline >= block.timestamp, "Deadline has passed");
        
        // 1. Transfer tokens de la user la contract
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // 2. Calculează fee (0.1%)
        uint256 feeAmount = calculateFee(amountIn);
        uint256 amountToSwap = amountIn - feeAmount;
        
        // 3. Distribuie fee (burn/stakers/treasury)
        _distributeFee(tokenIn, feeAmount);
        
        // 4. Aprobă PancakeSwap Router
        IERC20(tokenIn).safeApprove(PANCAKE_ROUTER, amountToSwap);
        
        // 5. Execută swap
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = IPancakeRouter(PANCAKE_ROUTER).WETH();
        
        IPancakeRouter router = IPancakeRouter(PANCAKE_ROUTER);
        amounts = router.swapExactTokensForETH(
            amountToSwap,
            amountOutMin,
            path,
            msg.sender, // User primește BNB direct
            deadline
        );
        
        // 6. Reset approval (security best practice)
        IERC20(tokenIn).safeApprove(PANCAKE_ROUTER, 0);
        
        // 7. Emit events
        emit SwapExecuted(
            msg.sender,
            tokenIn,
            address(0), // BNB
            amountIn,
            amounts[amounts.length - 1],
            feeAmount
        );
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Authorize un executor contract (pentru AITradingExecutor, etc.)
     * @param _executor Address-ul contract-ului executor
     */
    function authorizeExecutor(address _executor) external onlyOwner {
        require(_executor != address(0), "Invalid executor address");
        authorizedExecutors[_executor] = true;
        emit ExecutorAuthorized(_executor);
    }
    
    /**
     * @dev Revoke authorization pentru un executor
     * @param _executor Address-ul contract-ului executor
     */
    function revokeExecutor(address _executor) external onlyOwner {
        require(authorizedExecutors[_executor], "Executor not authorized");
        authorizedExecutors[_executor] = false;
        emit ExecutorRevoked(_executor);
    }
    
    /**
     * @dev Update treasury address
     * @param _newTreasury Address-ul nou al treasury wallet
     */
    function setTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Treasury cannot be zero address");
        address oldTreasury = treasury;
        treasury = _newTreasury;
        emit TreasuryUpdated(oldTreasury, _newTreasury);
    }
    
    /**
     * @dev Update fee distribution percentages
     * @param _burnPercentage Percentage pentru burn (0-100)
     * @param _stakersPercentage Percentage pentru stakers (0-100)
     * @param _treasuryPercentage Percentage pentru treasury (0-100)
     */
    function setFeeDistribution(
        uint256 _burnPercentage,
        uint256 _stakersPercentage,
        uint256 _treasuryPercentage
    ) external onlyOwner validFeeDistribution {
        burnPercentage = _burnPercentage;
        stakersPercentage = _stakersPercentage;
        treasuryPercentage = _treasuryPercentage;
        emit FeeDistributionUpdated(_burnPercentage, _stakersPercentage, _treasuryPercentage);
    }
    
    /**
     * @dev Set UserVault contract address
     * @param _userVault Address-ul UserVault contract
     */
    function setUserVault(address _userVault) external onlyOwner {
        require(_userVault != address(0), "BitSwapDEXWrapper: Invalid vault address");
        address oldVault = userVault;
        userVault = _userVault;
        emit UserVaultUpdated(oldVault, _userVault);
    }
    
    /**
     * @dev Set StakingRewards contract address
     * @param _stakingRewards Address-ul StakingRewards contract
     */
    function setStakingRewards(address _stakingRewards) external onlyOwner {
        require(_stakingRewards != address(0), "BitSwapDEXWrapper: Invalid staking address");
        address oldStaking = stakingRewards;
        stakingRewards = _stakingRewards;
        emit StakingRewardsUpdated(oldStaking, _stakingRewards);
    }
    
    /**
     * @dev Pause contract (emergency only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdraw (owner only, for stuck funds)
     * @param token Address-ul token-ului (address(0) pentru BNB)
     * @param amount Cantitatea de retras
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            // Withdraw BNB
            (bool success, ) = msg.sender.call{value: amount}("");
            require(success, "BNB transfer failed");
        } else {
            // Withdraw ERC20
            IERC20(token).safeTransfer(msg.sender, amount);
        }
    }
    
    // ============ AUTHORIZED EXECUTOR FUNCTIONS ============
    
    /**
     * @dev Swap tokens for tokens (pentru contracte autorizate - tokens deja în contract)
     * @param tokenIn Address-ul token-ului de input
     * @param tokenOut Address-ul token-ului de output
     * @param amountIn Cantitatea de input tokens (deja în contract)
     * @param amountOutMin Minimum output tokens (slippage protection)
     * @param deadline Deadline pentru swap
     * @param recipient Address-ul care primește output tokens
     * @return amounts Array cu amountIn și amountOut
     */
    function swapTokensForTokensForExecutor(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline,
        address recipient
    ) external nonReentrant whenNotPaused returns (uint[] memory amounts) {
        require(authorizedExecutors[msg.sender], "Not authorized executor");
        require(amountIn > 0, "Amount must be greater than 0");
        require(tokenIn != address(0) && tokenOut != address(0), "Invalid token addresses");
        require(recipient != address(0), "Invalid recipient address");
        require(deadline >= block.timestamp, "Deadline has passed");
        
        // 1. Verifică că tokens sunt în contract
        require(
            IERC20(tokenIn).balanceOf(address(this)) >= amountIn,
            "Insufficient tokens in contract"
        );
        
        // 2. Calculează fee (0.1%)
        uint256 feeAmount = calculateFee(amountIn);
        uint256 amountToSwap = amountIn - feeAmount;
        
        // 3. Distribuie fee (burn/stakers/treasury)
        _distributeFee(tokenIn, feeAmount);
        
        // 4. Aprobă PancakeSwap Router
        IERC20(tokenIn).safeApprove(PANCAKE_ROUTER, amountToSwap);
        
        // 5. Execută swap
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        IPancakeRouter router = IPancakeRouter(PANCAKE_ROUTER);
        amounts = router.swapExactTokensForTokens(
            amountToSwap,
            amountOutMin,
            path,
            recipient, // Recipient primește tokens direct
            deadline
        );
        
        // 6. Reset approval (security best practice)
        IERC20(tokenIn).safeApprove(PANCAKE_ROUTER, 0);
        
        // 7. Emit events
        emit SwapExecuted(
            recipient, // User pentru care se execută trade-ul
            tokenIn,
            tokenOut,
            amountIn,
            amounts[amounts.length - 1],
            feeAmount
        );
    }
    
    /**
     * @dev Swap tokens for ETH (pentru contracte autorizate - tokens deja în contract)
     * @param tokenIn Address-ul token-ului de input
     * @param amountIn Cantitatea de input tokens (deja în contract)
     * @param amountOutMin Minimum BNB output (slippage protection)
     * @param deadline Deadline pentru swap
     * @param recipient Address-ul care primește BNB
     * @return amounts Array cu amountIn și amountOut
     */
    function swapTokensForETHForExecutor(
        address tokenIn,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline,
        address recipient
    ) external nonReentrant whenNotPaused returns (uint[] memory amounts) {
        require(authorizedExecutors[msg.sender], "Not authorized executor");
        require(amountIn > 0, "Amount must be greater than 0");
        require(tokenIn != address(0), "Invalid token address");
        require(recipient != address(0), "Invalid recipient address");
        require(deadline >= block.timestamp, "Deadline has passed");
        
        // 1. Verifică că tokens sunt în contract
        require(
            IERC20(tokenIn).balanceOf(address(this)) >= amountIn,
            "Insufficient tokens in contract"
        );
        
        // 2. Calculează fee (0.1%)
        uint256 feeAmount = calculateFee(amountIn);
        uint256 amountToSwap = amountIn - feeAmount;
        
        // 3. Distribuie fee (burn/stakers/treasury)
        _distributeFee(tokenIn, feeAmount);
        
        // 4. Aprobă PancakeSwap Router
        IERC20(tokenIn).safeApprove(PANCAKE_ROUTER, amountToSwap);
        
        // 5. Execută swap
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = IPancakeRouter(PANCAKE_ROUTER).WETH();
        
        IPancakeRouter router = IPancakeRouter(PANCAKE_ROUTER);
        amounts = router.swapExactTokensForETH(
            amountToSwap,
            amountOutMin,
            path,
            recipient, // Recipient primește BNB direct
            deadline
        );
        
        // 6. Reset approval (security best practice)
        IERC20(tokenIn).safeApprove(PANCAKE_ROUTER, 0);
        
        // 7. Emit events
        emit SwapExecuted(
            recipient, // User pentru care se execută trade-ul
            tokenIn,
            address(0), // BNB
            amountIn,
            amounts[amounts.length - 1],
            feeAmount
        );
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Calculează fee-ul pentru o sumă dată
     * @param amount Suma pentru care se calculează fee-ul
     * @return fee Fee-ul calculat
     */
    function calculateFee(uint256 amount) public pure returns (uint256 fee) {
        fee = (amount * PROTOCOL_FEE_BPS) / FEE_DENOMINATOR;
    }
    
    /**
     * @dev Verifică dacă contractul este configurat corect
     * @return bool True dacă toate configurațiile sunt valide
     */
    function isConfigured() external view returns (bool) {
        return (
            treasury != address(0) &&
            burnPercentage + stakersPercentage + treasuryPercentage == 100 &&
            PROTOCOL_FEE_BPS <= MAX_FEE_BPS
        );
    }
    
    /**
     * @dev Returnează statistici despre fees collected
     * @return totalFees Total fees collected (tokens) - pentru token-ul specific
     * @return totalFeesUSD Total fees collected (USD estimated)
     * @notice Pentru statistici complete, trebuie să interogăm totalFeesCollected pentru fiecare token
     */
    function getFeeStatistics() external view returns (uint256 totalFees, uint256 totalFeesUSD) {
        // Returnează totalFeesCollectedUSD (care este agregate)
        totalFeesUSD = totalFeesCollectedUSD;
        // Pentru un token specific, trebuie să folosim totalFeesCollected[token]
        // Această funcție returnează doar USD aggregate
        totalFees = 0; // Pentru token-specific, folosește totalFeesCollected[token]
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    /**
     * @dev Distribuie fee-ul între burn/stakers/treasury
     * @param token Address-ul token-ului
     * @param feeAmount Cantitatea de fee
     */
    function _distributeFee(address token, uint256 feeAmount) internal {
        require(feeAmount > 0, "Fee amount must be greater than 0");
        
        // 1. Calculează părțile pentru burn/stakers/treasury
        uint256 burnAmount = (feeAmount * burnPercentage) / 100;
        uint256 stakersAmount = (feeAmount * stakersPercentage) / 100;
        uint256 treasuryAmount = feeAmount - burnAmount - stakersAmount;
        
        // 2. Burn tokens (eliminat - nu mai ardem nimic)
        // if (burnAmount > 0) {
        //     address deadAddress = 0x000000000000000000000000000000000000dEaD;
        //     IERC20(token).safeTransfer(deadAddress, burnAmount);
        // }
        // Notă: burnAmount va fi 0 pentru că burnPercentage = 0
        
        // 3. Transfer la stakers contract (StakingRewards) dacă este setat
        if (stakersAmount > 0) {
            if (stakingRewards != address(0)) {
                // Aprobă StakingRewards contract să primească tokens
                IERC20(token).safeApprove(stakingRewards, stakersAmount);
                // Transfer tokens către StakingRewards (contract-ul va avea funcție deposit pentru rewards)
                // Pentru acum, transferăm direct (StakingRewards va primi prin deposit function)
                IERC20(token).safeTransfer(stakingRewards, stakersAmount);
                emit FeesDistributedToStaking(token, stakersAmount);
            } else {
                // Fallback: trimitem la treasury dacă StakingRewards nu este setat
                IERC20(token).safeTransfer(treasury, stakersAmount);
            }
        }
        
        // 4. Transfer la treasury
        if (treasuryAmount > 0) {
            IERC20(token).safeTransfer(treasury, treasuryAmount);
        }
        
        // 5. Update totalFeesCollected
        totalFeesCollected[token] += feeAmount;
        // Note: totalFeesCollectedUSD ar trebui actualizat off-chain sau cu oracle
        
        // 6. Emit FeeCollected event
        emit FeeCollected(token, feeAmount, burnAmount, stakersAmount, treasuryAmount);
    }
    
    
    // ============ RECEIVE ============
    
    /**
     * @dev Receive BNB (pentru swapETHForTokens)
     */
    receive() external payable {
        // Contractul poate primi BNB
    }
}

