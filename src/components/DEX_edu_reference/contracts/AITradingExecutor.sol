// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AITradingExecutor
 * @dev Smart Contract pentru executarea automată a trade-urilor AI
 * @notice Execută trade-uri bazate pe signals AI, cu stop loss și take profit on-chain
 * @author BitSwapDEX Team
 * @custom:security-contact security@bitswapdex.com
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AITradingAccessControl.sol";
import "./BitSwapDEXWrapper.sol";
import "./constants/BitcoinTokens.sol";

contract AITradingExecutor is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // ============ STRUCTS & ENUMS ============
    
    /**
     * @notice Trade status enum
     */
    enum TradeStatus {
        PENDING,        // Trade creat dar încă nu executat
        EXECUTED,       // Trade executat cu succes
        STOPPED,        // Stop loss triggered
        PROFIT_TAKEN,   // Take profit triggered
        CANCELLED,      // Trade anulat manual
        FAILED          // Trade failed (slippage, gas, etc.)
    }
    
    /**
     * @notice Trade struct
     */
    struct Trade {
        uint256 tradeId;
        address user;               // User pentru care se execută trade-ul
        address botAddress;         // Bot care a creat trade-ul
        uint256 taskId;             // Task ID asociat (0 = no task, created manually)
        uint256 strategyId;         // Strategy ID asociat (0 = no strategy)
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        uint256 amountOutMin;       // Slippage protection
        uint256 entryPrice;         // Price at execution time
        uint256 stopLoss;           // Stop loss price (0 = disabled)
        uint256 takeProfit;         // Take profit price (0 = disabled)
        uint256 deadline;
        uint256 executedAt;
        uint256 closedAt;
        bytes32 signalHash;         // Hash of AI signal pentru validation
        TradeStatus status;
        string txHash;              // Transaction hash (off-chain tracking)
        bool isNativeIn;            // true dacă tokenIn este native (BNB)
        bool isNativeOut;           // true dacă tokenOut este native (BNB)
    }
    
    // ============ STATE VARIABLES ============
    
    /// @notice Access control contract
    AITradingAccessControl public accessControl;
    
    /// @notice BitSwapDEXWrapper contract
    BitSwapDEXWrapper public wrapper;
    
    /// @notice Trade counter (pentru unique trade IDs)
    uint256 public tradeCounter;
    
    /// @notice Mapping: tradeId => Trade
    mapping(uint256 => Trade) public trades;
    
    /// @notice Mapping: user => tradeIds[]
    mapping(address => uint256[]) public userTrades;
    
    /// @notice Mapping: botAddress => tradeIds[]
    mapping(address => uint256[]) public botTrades;
    
    /// @notice Mapping: token pair => active trades (pentru stop loss/take profit checking)
    mapping(address => mapping(address => uint256[])) public activeTradesByPair;
    
    /// @notice Mapping: taskId => tradeIds[]
    mapping(uint256 => uint256[]) public taskTrades;
    
    /// @notice Mapping: strategyId => tradeIds[]
    mapping(uint256 => uint256[]) public strategyTrades;
    
    /// @notice Oracle price feed contract (opțional - pentru stop loss/take profit on-chain)
    address public oraclePriceFeed;
    
    /// @notice Fee pentru trade execution (in basis points, 0 = no fee)
    uint256 public executionFeeBps;
    
    /// @notice Fee recipient
    address public feeRecipient;
    
    // ============ CONSTANTS ============
    
    /// @notice Fee denominator (for precision)
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    /// @notice Default deadline extension (5 minutes)
    uint256 public constant DEFAULT_DEADLINE_EXTENSION = 300;
    
    // ============ EVENTS ============
    
    event TradeCreated(
        uint256 indexed tradeId,
        address indexed user,
        address indexed botAddress,
        uint256 taskId,
        uint256 strategyId,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 stopLoss,
        uint256 takeProfit,
        bytes32 signalHash
    );
    
    event TradeExecuted(
        uint256 indexed tradeId,
        address indexed user,
        address indexed botAddress,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 entryPrice,
        string txHash
    );
    
    event TradeStopped(
        uint256 indexed tradeId,
        address indexed user,
        uint256 stopLossPrice,
        uint256 exitPrice,
        string txHash
    );
    
    event TradeProfitTaken(
        uint256 indexed tradeId,
        address indexed user,
        uint256 takeProfitPrice,
        uint256 exitPrice,
        string txHash
    );
    
    event TradeCancelled(
        uint256 indexed tradeId,
        address indexed user,
        address indexed botAddress
    );
    
    event StopLossUpdated(
        uint256 indexed tradeId,
        uint256 oldStopLoss,
        uint256 newStopLoss
    );
    
    event TakeProfitUpdated(
        uint256 indexed tradeId,
        uint256 oldTakeProfit,
        uint256 newTakeProfit
    );
    
    event OraclePriceFeedUpdated(address indexed oldOracle, address indexed newOracle);
    
    // ============ MODIFIERS ============
    
    /**
     * @notice Verifică dacă trade-ul există
     */
    modifier tradeExists(uint256 _tradeId) {
        require(trades[_tradeId].user != address(0), "AITradingExecutor: Trade does not exist");
        _;
    }
    
    /**
     * @notice Verifică dacă trade-ul este în status valid pentru operație
     */
    modifier validTradeStatus(uint256 _tradeId, TradeStatus _requiredStatus) {
        require(
            trades[_tradeId].status == _requiredStatus,
            "AITradingExecutor: Invalid trade status"
        );
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Constructor
     * @param _accessControl Address-ul AITradingAccessControl contract
     * @param _wrapper Address-ul BitSwapDEXWrapper contract
     * @param _feeRecipient Address-ul fee recipient
     */
    constructor(
        address _accessControl,
        address _wrapper,
        address _feeRecipient
    ) {
        require(_accessControl != address(0), "AITradingExecutor: Invalid access control address");
        require(_wrapper != address(0), "AITradingExecutor: Invalid wrapper address");
        require(_feeRecipient != address(0), "AITradingExecutor: Invalid fee recipient");
        
        accessControl = AITradingAccessControl(_accessControl);
        wrapper = BitSwapDEXWrapper(_wrapper);
        feeRecipient = _feeRecipient;
        executionFeeBps = 0; // Default: no fee (poate fi setat ulterior)
        
        // Start trade counter from 1
        tradeCounter = 1;
    }
    
    // ============ BOT FUNCTIONS (Only Authorized Bots) ============
    
    /**
     * @notice Creează și execută un trade (pentru autorized bots)
     * @param _user Address-ul user-ului pentru care se execută trade-ul
     * @param _tokenIn Address-ul token-ului de input (address(0) pentru BNB)
     * @param _tokenOut Address-ul token-ului de output (address(0) pentru BNB)
     * @param _amountIn Cantitatea de input tokens
     * @param _amountOutMin Minimum output tokens (slippage protection)
     * @param _stopLoss Stop loss price (0 = disabled)
     * @param _takeProfit Take profit price (0 = disabled)
     * @param _deadline Deadline pentru swap
     * @param _signalHash Hash of AI signal pentru validation
     * @param _taskId Task ID asociat (0 = no task)
     * @param _strategyId Strategy ID asociat (0 = no strategy)
     * @return tradeId ID-ul trade-ului creat
     */
    function executeTrade(
        address _user,
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _amountOutMin,
        uint256 _stopLoss,
        uint256 _takeProfit,
        uint256 _deadline,
        bytes32 _signalHash,
        uint256 _taskId,
        uint256 _strategyId
    ) external nonReentrant whenNotPaused returns (uint256) {
        // Verifică dacă bot-ul este autorizat și poate executa
        require(
            accessControl.canExecuteTrade(_user, _amountIn),
            "AITradingExecutor: Bot not authorized or rate limit exceeded"
        );
        
        // Validate inputs
        require(_user != address(0), "AITradingExecutor: Invalid user address");
        require(_amountIn > 0, "AITradingExecutor: Invalid amount");
        require(_amountOutMin > 0, "AITradingExecutor: Invalid minimum output");
        require(_deadline >= block.timestamp, "AITradingExecutor: Deadline has passed");
        require(_tokenIn != _tokenOut, "AITradingExecutor: Same token in and out");
        
        // Check dacă cel puțin un token nu este native
        require(
            _tokenIn != address(0) || _tokenOut != address(0),
            "AITradingExecutor: Both tokens cannot be native"
        );
        
        // Generate trade ID
        uint256 tradeId = tradeCounter;
        tradeCounter++;
        
        // Determine native token flags
        bool isNativeIn = _tokenIn == address(0);
        bool isNativeOut = _tokenOut == address(0);
        
        // Execute swap through wrapper
        uint256 amountOut = 0;
        string memory txHash = "";
        
        // Calculate entry price (will be updated after swap execution)
        uint256 entryPrice = 0;
        
        try this._executeSwapInternal(
            _user,
            _tokenIn,
            _tokenOut,
            _amountIn,
            _amountOutMin,
            _deadline,
            isNativeIn,
            isNativeOut
        ) returns (uint256 _amountOut, string memory _txHash, uint256 _price) {
            amountOut = _amountOut;
            txHash = _txHash;
            entryPrice = _price;
        } catch Error(string memory reason) {
            // Trade failed
            _createFailedTrade(
                tradeId,
                _user,
                _tokenIn,
                _tokenOut,
                _amountIn,
                _amountOutMin,
                _stopLoss,
                _takeProfit,
                _deadline,
                _signalHash,
                isNativeIn,
                isNativeOut,
                reason,
                _taskId,
                _strategyId
            );
            revert(reason);
        }
        
        // Create trade struct
        Trade memory trade = Trade({
            tradeId: tradeId,
            user: _user,
            botAddress: msg.sender,
            taskId: _taskId,
            strategyId: _strategyId,
            tokenIn: _tokenIn,
            tokenOut: _tokenOut,
            amountIn: _amountIn,
            amountOut: amountOut,
            amountOutMin: _amountOutMin,
            entryPrice: entryPrice,
            stopLoss: _stopLoss,
            takeProfit: _takeProfit,
            deadline: _deadline,
            executedAt: block.timestamp,
            closedAt: 0,
            signalHash: _signalHash,
            status: TradeStatus.EXECUTED,
            txHash: txHash,
            isNativeIn: isNativeIn,
            isNativeOut: isNativeOut
        });
        
        // Store trade
        trades[tradeId] = trade;
        userTrades[_user].push(tradeId);
        botTrades[msg.sender].push(tradeId);
        
        if (_taskId > 0) {
            taskTrades[_taskId].push(tradeId);
        }
        
        if (_strategyId > 0) {
            strategyTrades[_strategyId].push(tradeId);
        }
        
        // Add to active trades if stop loss or take profit is set
        if (_stopLoss > 0 || _takeProfit > 0) {
            address pairKeyIn = isNativeIn ? address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE) : _tokenIn;
            address pairKeyOut = isNativeOut ? address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE) : _tokenOut;
            activeTradesByPair[pairKeyIn][pairKeyOut].push(tradeId);
        }
        
        // Emit events
        emit TradeCreated(
            tradeId,
            _user,
            msg.sender,
            _taskId,
            _strategyId,
            _tokenIn,
            _tokenOut,
            _amountIn,
            _stopLoss,
            _takeProfit,
            _signalHash
        );
        
        emit TradeExecuted(
            tradeId,
            _user,
            msg.sender,
            _tokenIn,
            _tokenOut,
            _amountIn,
            amountOut,
            entryPrice,
            txHash
        );
        
        return tradeId;
    }
    
    /**
     * @notice Internal function pentru executarea swap-ului (pentru try-catch)
     * @dev Transfer tokens de la user la contract, apoi execute swap prin wrapper
     */
    function _executeSwapInternal(
        address _user,
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _amountOutMin,
        uint256 _deadline,
        bool _isNativeIn,
        bool _isNativeOut
    ) external returns (uint256 amountOut, string memory txHash, uint256 entryPrice) {
        require(msg.sender == address(this), "AITradingExecutor: Internal function only");
        
        // Transfer tokens dacă nu e native (de la user la contract)
        if (!_isNativeIn) {
            IERC20(_tokenIn).safeTransferFrom(_user, address(this), _amountIn);
            
            // Calculate and collect execution fee
            if (executionFeeBps > 0) {
                uint256 feeAmount = (_amountIn * executionFeeBps) / FEE_DENOMINATOR;
                IERC20(_tokenIn).safeTransfer(feeRecipient, feeAmount);
                _amountIn -= feeAmount;
            }
        } else {
            // Pentru BNB, user trebuie să trimită BNB la contract înainte
            // Sau folosim transfer din msg.value în executeTrade
            require(address(this).balance >= _amountIn, "AITradingExecutor: Insufficient BNB balance");
        }
        
        // Execute swap through wrapper using executor functions
        uint256[] memory amounts;
        
        if (_isNativeIn) {
            // BNB for tokens - folosim swapETHForTokens normal (BNB vine prin msg.value în executeTrade)
            // NOTĂ: Pentru BNB, trebuie să folosim funcția normală de wrapper cu msg.value
            // Trebuie să modificăm executeTrade pentru a gestiona BNB diferit
            revert("AITradingExecutor: BNB input not yet supported in executor mode");
        } else if (_isNativeOut) {
            // Swap tokens for BNB (folosim swapTokensForETHForExecutor)
            amounts = wrapper.swapTokensForETHForExecutor(
                _tokenIn,
                _amountIn,
                _amountOutMin,
                _deadline,
                _user // Recipient primește BNB direct
            );
        } else {
            // Swap tokens for tokens (folosim swapTokensForTokensForExecutor)
            amounts = wrapper.swapTokensForTokensForExecutor(
                _tokenIn,
                _tokenOut,
                _amountIn,
                _amountOutMin,
                _deadline,
                _user // Recipient primește tokens direct
            );
        }
        
        // Get amountOut din rezultat
        amountOut = amounts[amounts.length - 1];
        
        // Calculate entry price (simplified - in reality would need oracle)
        if (amountOut > 0) {
            entryPrice = (_amountIn * 1e18) / amountOut; // Assuming 18 decimals
        } else {
            entryPrice = 0;
        }
        
        // Generate tx hash (off-chain tracking - will be set by backend after actual transaction)
        // Format: "pending-{tradeId}-{timestamp}"
        txHash = ""; // Will be set by backend after actual transaction (sau din event logs)
    }
    
    /**
     * @notice Creează un trade failed
     */
    function _createFailedTrade(
        uint256 _tradeId,
        address _user,
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _amountOutMin,
        uint256 _stopLoss,
        uint256 _takeProfit,
        uint256 _deadline,
        bytes32 _signalHash,
        bool _isNativeIn,
        bool _isNativeOut,
        string memory _reason,
        uint256 _taskId,
        uint256 _strategyId
    ) internal {
        Trade memory trade = Trade({
            tradeId: _tradeId,
            user: _user,
            botAddress: msg.sender,
            taskId: _taskId,
            strategyId: _strategyId,
            tokenIn: _tokenIn,
            tokenOut: _tokenOut,
            amountIn: _amountIn,
            amountOut: 0,
            amountOutMin: _amountOutMin,
            entryPrice: 0,
            stopLoss: _stopLoss,
            takeProfit: _takeProfit,
            deadline: _deadline,
            executedAt: 0,
            closedAt: block.timestamp,
            signalHash: _signalHash,
            status: TradeStatus.FAILED,
            txHash: "",
            isNativeIn: _isNativeIn,
            isNativeOut: _isNativeOut
        });
        
        trades[_tradeId] = trade;
        userTrades[_user].push(_tradeId);
        botTrades[msg.sender].push(_tradeId);
    }
    
    /**
     * @notice Anulează un trade pending
     * @param _tradeId ID-ul trade-ului
     */
    function cancelTrade(uint256 _tradeId) 
        external 
        tradeExists(_tradeId) 
        validTradeStatus(_tradeId, TradeStatus.PENDING) 
    {
        Trade storage trade = trades[_tradeId];
        
        // Verifică dacă user-ul sau bot-ul care a creat trade-ul poate anula
        require(
            msg.sender == trade.user || msg.sender == trade.botAddress,
            "AITradingExecutor: Not authorized to cancel this trade"
        );
        
        // Return tokens to user if not yet executed
        if (trade.amountIn > 0 && !trade.isNativeIn) {
            IERC20(trade.tokenIn).safeTransfer(trade.user, trade.amountIn);
        }
        
        // Update trade status
        trade.status = TradeStatus.CANCELLED;
        trade.closedAt = block.timestamp;
        
        // Remove from active trades
        _removeFromActiveTrades(_tradeId);
        
        emit TradeCancelled(_tradeId, trade.user, trade.botAddress);
    }
    
    // ============ USER FUNCTIONS ============
    
    /**
     * @notice Actualizează stop loss pentru un trade
     * @param _tradeId ID-ul trade-ului
     * @param _newStopLoss New stop loss price
     */
    function updateStopLoss(
        uint256 _tradeId,
        uint256 _newStopLoss
    ) external tradeExists(_tradeId) {
        Trade storage trade = trades[_tradeId];
        
        require(msg.sender == trade.user, "AITradingExecutor: Not authorized");
        require(
            trade.status == TradeStatus.EXECUTED,
            "AITradingExecutor: Trade must be executed"
        );
        
        uint256 oldStopLoss = trade.stopLoss;
        trade.stopLoss = _newStopLoss;
        
        emit StopLossUpdated(_tradeId, oldStopLoss, _newStopLoss);
    }
    
    /**
     * @notice Actualizează take profit pentru un trade
     * @param _tradeId ID-ul trade-ului
     * @param _newTakeProfit New take profit price
     */
    function updateTakeProfit(
        uint256 _tradeId,
        uint256 _newTakeProfit
    ) external tradeExists(_tradeId) {
        Trade storage trade = trades[_tradeId];
        
        require(msg.sender == trade.user, "AITradingExecutor: Not authorized");
        require(
            trade.status == TradeStatus.EXECUTED,
            "AITradingExecutor: Trade must be executed"
        );
        
        uint256 oldTakeProfit = trade.takeProfit;
        trade.takeProfit = _newTakeProfit;
        
        emit TakeProfitUpdated(_tradeId, oldTakeProfit, _newTakeProfit);
    }
    
    // ============ OWNER FUNCTIONS ============
    
    /**
     * @notice Set oracle price feed address
     * @param _oracle Address-ul oracle contract
     */
    function setOraclePriceFeed(address _oracle) external onlyOwner {
        require(_oracle != address(0), "AITradingExecutor: Invalid oracle address");
        address oldOracle = oraclePriceFeed;
        oraclePriceFeed = _oracle;
        emit OraclePriceFeedUpdated(oldOracle, _oracle);
    }
    
    /**
     * @notice Set execution fee
     * @param _feeBps Fee in basis points (100 = 1%)
     */
    function setExecutionFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 100, "AITradingExecutor: Fee cannot exceed 1%");
        executionFeeBps = _feeBps;
    }
    
    /**
     * @notice Set fee recipient
     * @param _feeRecipient Address-ul fee recipient
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "AITradingExecutor: Invalid fee recipient");
        feeRecipient = _feeRecipient;
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
     * @notice Emergency withdraw (pentru stuck funds)
     * @param _token Address-ul token-ului (address(0) pentru BNB)
     * @param _amount Cantitatea
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        if (_token == address(0)) {
            (bool success, ) = payable(owner()).call{value: _amount}("");
            require(success, "BNB transfer failed");
        } else {
            IERC20(_token).safeTransfer(owner(), _amount);
        }
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    /**
     * @notice Remove trade from active trades
     */
    function _removeFromActiveTrades(uint256 _tradeId) internal {
        Trade memory trade = trades[_tradeId];
        address pairKeyIn = trade.isNativeIn ? address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE) : trade.tokenIn;
        address pairKeyOut = trade.isNativeOut ? address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE) : trade.tokenOut;
        
        uint256[] storage activeTrades = activeTradesByPair[pairKeyIn][pairKeyOut];
        
        for (uint256 i = 0; i < activeTrades.length; i++) {
            if (activeTrades[i] == _tradeId) {
                // Swap with last element
                activeTrades[i] = activeTrades[activeTrades.length - 1];
                activeTrades.pop();
                break;
            }
        }
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Returnează un trade
     * @param _tradeId ID-ul trade-ului
     * @return Trade Trade struct
     */
    function getTrade(uint256 _tradeId) external view returns (Trade memory) {
        return trades[_tradeId];
    }
    
    /**
     * @notice Returnează toate trade-urile unui user
     * @param _user Address-ul user-ului
     * @return uint256[] Lista de trade IDs
     */
    function getUserTrades(address _user) external view returns (uint256[] memory) {
        return userTrades[_user];
    }
    
    /**
     * @notice Returnează toate trade-urile unui bot
     * @param _botAddress Address-ul bot-ului
     * @return uint256[] Lista de trade IDs
     */
    function getBotTrades(address _botAddress) external view returns (uint256[] memory) {
        return botTrades[_botAddress];
    }
    
    /**
     * @notice Returnează trade-urile active pentru un pair
     * @param _tokenIn Address-ul token-ului de input
     * @param _tokenOut Address-ul token-ului de output
     * @return uint256[] Lista de trade IDs
     */
    function getActiveTradesByPair(
        address _tokenIn,
        address _tokenOut
    ) external view returns (uint256[] memory) {
        return activeTradesByPair[_tokenIn][_tokenOut];
    }
    
    /**
     * @notice Returnează numărul total de trades
     * @return uint256 Numărul total
     */
    function getTotalTrades() external view returns (uint256) {
        return tradeCounter - 1;
    }
    
    // ============ BITCOIN HELPER FUNCTIONS ============
    
    /**
     * @notice Verifică dacă un pair este un Bitcoin pair
     * @param _tokenIn Address-ul token-ului de input
     * @param _tokenOut Address-ul token-ului de output
     * @return bool True dacă cel puțin un token este Bitcoin token
     */
    function isBitcoinPair(address _tokenIn, address _tokenOut) external pure returns (bool) {
        return BitcoinTokens.isBitcoinToken(_tokenIn) || BitcoinTokens.isBitcoinToken(_tokenOut);
    }
    
    /**
     * @notice Verifică dacă un token este un Bitcoin token (WBTC sau BTCB)
     * @param _token Address-ul token-ului
     * @return bool True dacă token-ul este WBTC sau BTCB
     */
    function isBitcoinToken(address _token) external pure returns (bool) {
        return BitcoinTokens.isBitcoinToken(_token);
    }
    
    /**
     * @notice Returnează numele token-ului Bitcoin
     * @param _token Token address
     * @return string Numele token-ului (WBTC sau BTCB)
     */
    function getBitcoinTokenName(address _token) external pure returns (string memory) {
        return BitcoinTokens.getBitcoinTokenName(_token);
    }
    
    /**
     * @notice Returnează symbol-ul token-ului Bitcoin
     * @param _token Token address
     * @return string Symbol-ul token-ului (WBTC sau BTCB)
     */
    function getBitcoinTokenSymbol(address _token) external pure returns (string memory) {
        return BitcoinTokens.getBitcoinTokenSymbol(_token);
    }
    
    /**
     * @notice Returnează toate trade-urile pentru un task
     * @param _taskId ID-ul task-ului
     * @return uint256[] Lista de trade IDs
     */
    function getTaskTrades(uint256 _taskId) external view returns (uint256[] memory) {
        return taskTrades[_taskId];
    }
    
    /**
     * @notice Returnează toate trade-urile pentru o strategie
     * @param _strategyId ID-ul strategiei
     * @return uint256[] Lista de trade IDs
     */
    function getStrategyTrades(uint256 _strategyId) external view returns (uint256[] memory) {
        return strategyTrades[_strategyId];
    }
    
    /**
     * @notice Returnează toate trade-urile cu Bitcoin pairs pentru un user
     * @param _user Address-ul user-ului
     * @return uint256[] Lista de trade IDs cu Bitcoin pairs
     */
    function getUserBitcoinTrades(address _user) external view returns (uint256[] memory) {
        uint256[] memory allTrades = userTrades[_user];
        uint256[] memory bitcoinTrades = new uint256[](allTrades.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < allTrades.length; i++) {
            Trade memory trade = trades[allTrades[i]];
            if (BitcoinTokens.isBitcoinToken(trade.tokenIn) || BitcoinTokens.isBitcoinToken(trade.tokenOut)) {
                bitcoinTrades[count] = allTrades[i];
                count++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = bitcoinTrades[i];
        }
        
        return result;
    }
    
    // ============ RECEIVE ============
    
    /**
     * @dev Receive BNB (pentru swapETHForTokens)
     */
    receive() external payable {
        // Contractul poate primi BNB
    }
}

