// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SmartOffersManager
 * @dev Smart Contract pentru management-ul "Smart Offers" - offers condiționate
 * @notice Offers care se execută automat când condițiile sunt îndeplinite (similar cu Oxium)
 * @author BitSwapDEX Team
 * @custom:security-contact security@bitswapdex.com
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./BitSwapDEXWrapper.sol";
import "./OraclePriceFeed.sol";
import "./constants/BitcoinTokens.sol";

contract SmartOffersManager is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // ============ STRUCTS & ENUMS ============
    
    /**
     * @notice Offer type enum
     */
    enum OfferType {
        LIMIT_BUY,      // Execute when price <= limit
        LIMIT_SELL,     // Execute when price >= limit
        STOP_LOSS,      // Execute when price <= stop
        TAKE_PROFIT,    // Execute when price >= target
        TRAILING_STOP,  // Dynamic stop loss (trails price)
        TIME_BASED      // Execute at specific time
    }
    
    /**
     * @notice Offer status enum
     */
    enum OfferStatus {
        ACTIVE,         // Offer activ și așteaptă execution
        EXECUTED,       // Offer executat cu succes
        CANCELLED,      // Offer anulat manual
        EXPIRED,        // Offer expirat (deadline passed)
        FAILED          // Offer failed (slippage, gas, etc.)
    }
    
    /**
     * @notice Offer struct
     */
    struct SmartOffer {
        uint256 offerId;
        address user;               // User care a creat offer-ul
        address tokenIn;            // Token de input
        address tokenOut;           // Token de output
        uint256 amountIn;           // Amount de input tokens
        uint256 amountOutMin;       // Minimum output (slippage protection)
        OfferType offerType;        // Tipul de offer
        uint256 conditionPrice;     // Price condition (limit, stop, target, etc.)
        uint256 currentPrice;       // Current price at offer creation
        uint256 trailingDistance;   // Trailing stop distance (pentru TRAILING_STOP)
        uint256 expiry;             // Expiry timestamp (0 = no expiry)
        uint256 deadline;           // Swap deadline (pentru execution)
        uint256 createdAt;          // Timestamp când offer-ul a fost creat
        uint256 executedAt;         // Timestamp când offer-ul a fost executat (0 = not executed)
        bytes32 signalHash;         // Hash of AI signal (pentru validation)
        OfferStatus status;         // Offer status
        bool isNativeIn;            // true dacă tokenIn este native (BNB)
        bool isNativeOut;           // true dacă tokenOut este native (BNB)
        string txHash;              // Transaction hash (off-chain tracking)
    }
    
    /**
     * @notice Offer condition struct (pentru complex conditions)
     */
    struct OfferCondition {
        address token;              // Token pentru price check
        uint256 targetPrice;        // Target price
        bool greaterThan;           // true = >=, false = <=
        uint256 timeCondition;      // Timestamp condition (0 = no time condition)
    }
    
    // ============ STATE VARIABLES ============
    
    /// @notice BitSwapDEXWrapper contract
    BitSwapDEXWrapper public wrapper;
    
    /// @notice OraclePriceFeed contract
    OraclePriceFeed public oracle;
    
    /// @notice Offer counter
    uint256 public offerCounter;
    
    /// @notice Mapping: offerId => SmartOffer
    mapping(uint256 => SmartOffer) public offers;
    
    /// @notice Mapping: user => offerIds[]
    mapping(address => uint256[]) public userOffers;
    
    /// @notice Mapping: token pair => active offers (pentru execution checking)
    mapping(address => mapping(address => uint256[])) public activeOffersByPair;
    
    /// @notice Mapping: offerId => OfferCondition[] (pentru complex conditions)
    mapping(uint256 => OfferCondition[]) public offerConditions;
    
    /// @notice Total offers created (historical)
    uint256 public totalOffersCreated;
    
    /// @notice Total offers executed (historical)
    uint256 public totalOffersExecuted;
    
    /// @notice Execution fee (in basis points, 0 = no fee)
    uint256 public executionFeeBps;
    
    /// @notice Fee recipient
    address public feeRecipient;
    
    /// @notice Max offers per user (0 = unlimited)
    uint256 public maxOffersPerUser;
    
    /// @notice Keeper address (pentru automatic execution)
    address public keeper;
    
    /// @notice Execution gas limit (pentru protection)
    uint256 public executionGasLimit;
    
    // ============ CONSTANTS ============
    
    /// @notice Fee denominator (for precision)
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    /// @notice Default deadline extension (5 minutes)
    uint256 public constant DEFAULT_DEADLINE_EXTENSION = 300;
    
    // ============ EVENTS ============
    
    event SmartOfferCreated(
        uint256 indexed offerId,
        address indexed user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        OfferType offerType,
        uint256 conditionPrice,
        uint256 expiry
    );
    
    event SmartOfferExecuted(
        uint256 indexed offerId,
        address indexed user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 executedPrice,
        string txHash
    );
    
    event SmartOfferCancelled(
        uint256 indexed offerId,
        address indexed user
    );
    
    event SmartOfferExpired(
        uint256 indexed offerId,
        address indexed user
    );
    
    event SmartOfferFailed(
        uint256 indexed offerId,
        address indexed user,
        string reason
    );
    
    event ConditionPriceUpdated(
        uint256 indexed offerId,
        uint256 oldPrice,
        uint256 newPrice
    );
    
    event KeeperUpdated(address indexed oldKeeper, address indexed newKeeper);
    
    // ============ MODIFIERS ============
    
    /**
     * @notice Verifică dacă offer-ul există
     */
    modifier offerExists(uint256 _offerId) {
        require(offers[_offerId].user != address(0), "SmartOffersManager: Offer does not exist");
        _;
    }
    
    /**
     * @notice Verifică dacă offer-ul este în status valid pentru operație
     */
    modifier validOfferStatus(uint256 _offerId, OfferStatus _requiredStatus) {
        require(
            offers[_offerId].status == _requiredStatus,
            "SmartOffersManager: Invalid offer status"
        );
        _;
    }
    
    /**
     * @notice Verifică dacă msg.sender este keeper
     */
    modifier onlyKeeper() {
        require(msg.sender == keeper || msg.sender == owner(), "SmartOffersManager: Only keeper or owner");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Constructor
     * @param _wrapper Address-ul BitSwapDEXWrapper contract
     * @param _oracle Address-ul OraclePriceFeed contract (poate fi address(0) dacă nu e ready)
     * @param _feeRecipient Address-ul fee recipient
     */
    constructor(
        address _wrapper,
        address _oracle,
        address _feeRecipient
    ) {
        require(_wrapper != address(0), "SmartOffersManager: Invalid wrapper address");
        require(_feeRecipient != address(0), "SmartOffersManager: Invalid fee recipient");
        
        wrapper = BitSwapDEXWrapper(_wrapper);
        oracle = OraclePriceFeed(_oracle); // Poate fi address(0) inițial
        feeRecipient = _feeRecipient;
        executionFeeBps = 0; // Default: no fee
        executionGasLimit = 500000; // Default: 500k gas
        
        // Start offer counter from 1
        offerCounter = 1;
    }
    
    // ============ USER FUNCTIONS ============
    
    /**
     * @notice Creează un Smart Offer
     * @param _tokenIn Address-ul token-ului de input (address(0) pentru BNB)
     * @param _tokenOut Address-ul token-ului de output (address(0) pentru BNB)
     * @param _amountIn Cantitatea de input tokens
     * @param _amountOutMin Minimum output tokens (slippage protection)
     * @param _offerType Tipul de offer (LIMIT_BUY, LIMIT_SELL, etc.)
     * @param _conditionPrice Price condition (limit, stop, target, etc.)
     * @param _trailingDistance Trailing stop distance (pentru TRAILING_STOP, 0 = disabled)
     * @param _expiry Expiry timestamp (0 = no expiry)
     * @param _signalHash Hash of AI signal (pentru validation)
     * @return offerId ID-ul offer-ului creat
     */
    function createSmartOffer(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _amountOutMin,
        OfferType _offerType,
        uint256 _conditionPrice,
        uint256 _trailingDistance,
        uint256 _expiry,
        bytes32 _signalHash
    ) external nonReentrant whenNotPaused returns (uint256 offerId) {
        require(_amountIn > 0, "SmartOffersManager: Invalid amount");
        require(_amountOutMin > 0, "SmartOffersManager: Invalid minimum output");
        require(_tokenIn != _tokenOut, "SmartOffersManager: Same token in and out");
        require(
            _tokenIn != address(0) || _tokenOut != address(0),
            "SmartOffersManager: Both tokens cannot be native"
        );
        require(uint8(_offerType) <= uint8(OfferType.TIME_BASED), "SmartOffersManager: Invalid offer type");
        
        if (maxOffersPerUser > 0) {
            require(
                userOffers[msg.sender].length < maxOffersPerUser,
                "SmartOffersManager: Too many offers"
            );
        }
        
        // Validate offer type și condition price
        require(_validateOfferCondition(_offerType, _conditionPrice), "SmartOffersManager: Invalid offer condition");
        
        // Get current price pentru token pair (dacă oracle e disponibil)
        uint256 currentPrice = 0;
        if (address(oracle) != address(0)) {
            (uint256 price, , , bool isValid) = oracle.getTokenPairPrice(_tokenIn, _tokenOut);
            if (isValid) {
                currentPrice = price;
            }
        }
        
        // Transfer tokens de la user la contract
        bool isNativeIn = _tokenIn == address(0);
        bool isNativeOut = _tokenOut == address(0);
        
        if (!isNativeIn) {
            IERC20(_tokenIn).safeTransferFrom(msg.sender, address(this), _amountIn);
        } else {
            require(msg.value >= _amountIn, "SmartOffersManager: Insufficient BNB");
            // BNB vine prin msg.value
        }
        
        // Create offer
        offerId = offerCounter;
        offerCounter++;
        
        offers[offerId] = SmartOffer({
            offerId: offerId,
            user: msg.sender,
            tokenIn: _tokenIn,
            tokenOut: _tokenOut,
            amountIn: _amountIn,
            amountOutMin: _amountOutMin,
            offerType: _offerType,
            conditionPrice: _conditionPrice,
            currentPrice: currentPrice,
            trailingDistance: _trailingDistance,
            expiry: _expiry,
            deadline: block.timestamp + DEFAULT_DEADLINE_EXTENSION, // Default deadline
            createdAt: block.timestamp,
            executedAt: 0,
            signalHash: _signalHash,
            status: OfferStatus.ACTIVE,
            isNativeIn: isNativeIn,
            isNativeOut: isNativeOut,
            txHash: ""
        });
        
        // Update user data
        userOffers[msg.sender].push(offerId);
        activeOffersByPair[_tokenIn][_tokenOut].push(offerId);
        
        totalOffersCreated++;
        
        emit SmartOfferCreated(
            offerId,
            msg.sender,
            _tokenIn,
            _tokenOut,
            _amountIn,
            _offerType,
            _conditionPrice,
            _expiry
        );
        
        return offerId;
    }
    
    /**
     * @notice Anulează un Smart Offer
     * @param _offerId ID-ul offer-ului
     */
    function cancelSmartOffer(uint256 _offerId) 
        external 
        nonReentrant 
        offerExists(_offerId) 
        validOfferStatus(_offerId, OfferStatus.ACTIVE) 
    {
        SmartOffer storage offer = offers[_offerId];
        
        require(offer.user == msg.sender, "SmartOffersManager: Not your offer");
        
        // Return tokens to user
        if (offer.isNativeIn) {
            (bool success, ) = payable(offer.user).call{value: offer.amountIn}("");
            require(success, "SmartOffersManager: BNB transfer failed");
        } else {
            IERC20(offer.tokenIn).safeTransfer(offer.user, offer.amountIn);
        }
        
        // Update status
        offer.status = OfferStatus.CANCELLED;
        
        // Remove from active offers
        _removeFromActiveOffers(_offerId, offer.tokenIn, offer.tokenOut);
        
        emit SmartOfferCancelled(_offerId, offer.user);
    }
    
    /**
     * @notice Actualizează condition price pentru un offer (pentru TRAILING_STOP)
     * @param _offerId ID-ul offer-ului
     * @param _newConditionPrice New condition price
     */
    function updateConditionPrice(
        uint256 _offerId,
        uint256 _newConditionPrice
    ) external offerExists(_offerId) validOfferStatus(_offerId, OfferStatus.ACTIVE) {
        SmartOffer storage offer = offers[_offerId];
        
        require(offer.user == msg.sender, "SmartOffersManager: Not your offer");
        require(
            offer.offerType == OfferType.TRAILING_STOP,
            "SmartOffersManager: Only trailing stop offers can update condition price"
        );
        require(_validateOfferCondition(offer.offerType, _newConditionPrice), "SmartOffersManager: Invalid condition price");
        
        uint256 oldPrice = offer.conditionPrice;
        offer.conditionPrice = _newConditionPrice;
        
        emit ConditionPriceUpdated(_offerId, oldPrice, _newConditionPrice);
    }
    
    // ============ KEEPER FUNCTIONS (Automatic Execution) ============
    
    /**
     * @notice Execute un Smart Offer (pentru keeper sau owner)
     * @param _offerId ID-ul offer-ului
     * @return success True dacă execution a fost successful
     */
    function executeOffer(uint256 _offerId) 
        external 
        onlyKeeper 
        nonReentrant 
        whenNotPaused 
        offerExists(_offerId) 
        validOfferStatus(_offerId, OfferStatus.ACTIVE) 
        returns (bool success) 
    {
        SmartOffer storage offer = offers[_offerId];
        
        // Check expiry
        if (offer.expiry > 0 && block.timestamp > offer.expiry) {
            offer.status = OfferStatus.EXPIRED;
            _removeFromActiveOffers(_offerId, offer.tokenIn, offer.tokenOut);
            emit SmartOfferExpired(_offerId, offer.user);
            return false;
        }
        
        // Check conditions
        if (!_checkOfferConditions(_offerId)) {
            return false;
        }
        
        // Execute swap through wrapper
        uint256 amountOut = 0;
        string memory txHash = "";
        
        try this._executeSwapInternal(_offerId) returns (uint256 _amountOut, string memory _txHash) {
            amountOut = _amountOut;
            txHash = _txHash;
        } catch Error(string memory reason) {
            // Execution failed
            offer.status = OfferStatus.FAILED;
            _removeFromActiveOffers(_offerId, offer.tokenIn, offer.tokenOut);
            emit SmartOfferFailed(_offerId, offer.user, reason);
            return false;
        }
        
        // Update offer
        offer.status = OfferStatus.EXECUTED;
        offer.executedAt = block.timestamp;
        offer.txHash = txHash;
        
        // Update totals
        totalOffersExecuted++;
        
        // Remove from active offers
        _removeFromActiveOffers(_offerId, offer.tokenIn, offer.tokenOut);
        
        emit SmartOfferExecuted(
            _offerId,
            offer.user,
            offer.tokenIn,
            offer.tokenOut,
            offer.amountIn,
            amountOut,
            offer.conditionPrice,
            txHash
        );
        
        return true;
    }
    
    /**
     * @notice Execute multiple offers (batch execution pentru keeper)
     * @param _offerIds Array de offer IDs
     * @return successCount Numărul de offers executate cu succes
     */
    function executeOffers(uint256[] memory _offerIds) 
        external 
        onlyKeeper 
        nonReentrant 
        whenNotPaused 
        returns (uint256 successCount) 
    {
        require(_offerIds.length > 0, "SmartOffersManager: Empty array");
        require(_offerIds.length <= 50, "SmartOffersManager: Too many offers"); // Gas limit protection
        
        successCount = 0;
        
        for (uint256 i = 0; i < _offerIds.length; i++) {
            if (offers[_offerIds[i]].status == OfferStatus.ACTIVE) {
                try this.executeOffer(_offerIds[i]) returns (bool success) {
                    if (success) {
                        successCount++;
                    }
                } catch {
                    // Continue cu următorul offer dacă acesta fail-uită
                    continue;
                }
            }
        }
        
        return successCount;
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    /**
     * @notice Check dacă offer conditions sunt îndeplinite
     * @param _offerId ID-ul offer-ului
     * @return bool True dacă conditions sunt îndeplinite
     */
    function _checkOfferConditions(uint256 _offerId) internal view returns (bool) {
        SmartOffer memory offer = offers[_offerId];
        
        // Check dacă oracle e disponibil
        if (address(oracle) == address(0)) {
            return false; // Nu putem verifica conditions fără oracle
        }
        
        // Get current price
        (uint256 currentPrice, , , bool isValid) = oracle.getTokenPairPrice(offer.tokenIn, offer.tokenOut);
        if (!isValid) {
            return false; // Price nu e valid
        }
        
        // Check condition based on offer type
        if (offer.offerType == OfferType.LIMIT_BUY) {
            // Execute when price <= limit
            return currentPrice <= offer.conditionPrice;
        } else if (offer.offerType == OfferType.LIMIT_SELL) {
            // Execute when price >= limit
            return currentPrice >= offer.conditionPrice;
        } else if (offer.offerType == OfferType.STOP_LOSS) {
            // Execute when price <= stop
            return currentPrice <= offer.conditionPrice;
        } else if (offer.offerType == OfferType.TAKE_PROFIT) {
            // Execute when price >= target
            return currentPrice >= offer.conditionPrice;
        } else if (offer.offerType == OfferType.TRAILING_STOP) {
            // Execute when price drops by trailingDistance din peak
            // Pentru simplificare, verificăm dacă currentPrice <= conditionPrice
            return currentPrice <= offer.conditionPrice;
        } else if (offer.offerType == OfferType.TIME_BASED) {
            // Execute at specific time
            return block.timestamp >= offer.conditionPrice; // conditionPrice = execution timestamp
        }
        
        return false;
    }
    
    /**
     * @notice Execute swap pentru un offer (internal - pentru try-catch)
     * @param _offerId ID-ul offer-ului
     * @return amountOut Output amount
     * @return txHash Transaction hash
     */
    function _executeSwapInternal(uint256 _offerId) external returns (uint256 amountOut, string memory txHash) {
        require(msg.sender == address(this), "SmartOffersManager: Internal function only");
        
        SmartOffer storage offer = offers[_offerId];
        
        // Calculate execution fee
        uint256 feeAmount = 0;
        if (executionFeeBps > 0) {
            feeAmount = (offer.amountIn * executionFeeBps) / FEE_DENOMINATOR;
            offer.amountIn -= feeAmount;
        }
        
        // Transfer fee dacă există
        if (feeAmount > 0) {
            if (offer.isNativeIn) {
                (bool success, ) = payable(feeRecipient).call{value: feeAmount}("");
                require(success, "SmartOffersManager: Fee transfer failed");
            } else {
                IERC20(offer.tokenIn).safeTransfer(feeRecipient, feeAmount);
            }
        }
        
        // Execute swap through wrapper (folosind executor functions)
        uint256[] memory amounts;
        
        if (offer.isNativeIn) {
            revert("SmartOffersManager: BNB input not yet supported in executor mode");
        } else if (offer.isNativeOut) {
            // Swap tokens for BNB
            amounts = wrapper.swapTokensForETHForExecutor(
                offer.tokenIn,
                offer.amountIn,
                offer.amountOutMin,
                offer.deadline,
                offer.user // Recipient primește BNB direct
            );
        } else {
            // Swap tokens for tokens
            amounts = wrapper.swapTokensForTokensForExecutor(
                offer.tokenIn,
                offer.tokenOut,
                offer.amountIn,
                offer.amountOutMin,
                offer.deadline,
                offer.user // Recipient primește tokens direct
            );
        }
        
        amountOut = amounts[amounts.length - 1];
        
        // Generate tx hash (off-chain tracking - will be set by backend)
        txHash = ""; // Will be set by backend after actual transaction
        
        return (amountOut, txHash);
    }
    
    /**
     * @notice Validate offer condition
     * @param _offerType Offer type
     * @param _conditionPrice Condition price
     * @return bool True dacă condition e valid
     */
    function _validateOfferCondition(OfferType _offerType, uint256 _conditionPrice) internal pure returns (bool) {
        if (_conditionPrice == 0) {
            return false;
        }
        
        // Basic validation - în producție ar trebui validări mai complexe
        return true;
    }
    
    /**
     * @notice Remove offer din active offers
     * @param _offerId ID-ul offer-ului
     * @param _tokenIn Token in address
     * @param _tokenOut Token out address
     */
    function _removeFromActiveOffers(
        uint256 _offerId,
        address _tokenIn,
        address _tokenOut
    ) internal {
        uint256[] storage activeOffers = activeOffersByPair[_tokenIn][_tokenOut];
        
        for (uint256 i = 0; i < activeOffers.length; i++) {
            if (activeOffers[i] == _offerId) {
                activeOffers[i] = activeOffers[activeOffers.length - 1];
                activeOffers.pop();
                break;
            }
        }
    }
    
    // ============ OWNER FUNCTIONS ============
    
    /**
     * @notice Set oracle address
     * @param _oracle Address-ul oracle contract
     */
    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "SmartOffersManager: Invalid oracle address");
        oracle = OraclePriceFeed(_oracle);
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
     * @notice Set execution fee
     * @param _feeBps Fee in basis points (100 = 1%)
     */
    function setExecutionFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 100, "SmartOffersManager: Fee cannot exceed 1%");
        executionFeeBps = _feeBps;
    }
    
    /**
     * @notice Set fee recipient
     * @param _feeRecipient Address-ul fee recipient
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "SmartOffersManager: Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @notice Set max offers per user
     * @param _maxOffers New max offers (0 = unlimited)
     */
    function setMaxOffersPerUser(uint256 _maxOffers) external onlyOwner {
        maxOffersPerUser = _maxOffers;
    }
    
    /**
     * @notice Set execution gas limit
     * @param _gasLimit New gas limit
     */
    function setExecutionGasLimit(uint256 _gasLimit) external onlyOwner {
        require(_gasLimit > 0, "SmartOffersManager: Invalid gas limit");
        executionGasLimit = _gasLimit;
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
            require(success, "SmartOffersManager: BNB transfer failed");
        } else {
            IERC20(_token).safeTransfer(owner(), _amount);
        }
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Returnează un offer
     * @param _offerId ID-ul offer-ului
     * @return SmartOffer Offer struct
     */
    function getOffer(uint256 _offerId) external view returns (SmartOffer memory) {
        return offers[_offerId];
    }
    
    /**
     * @notice Returnează toate offer-urile unui user
     * @param _user Address-ul user-ului
     * @return uint256[] Lista de offer IDs
     */
    function getUserOffers(address _user) external view returns (uint256[] memory) {
        return userOffers[_user];
    }
    
    /**
     * @notice Returnează offer-urile active pentru un pair
     * @param _tokenIn Address-ul token-ului de input
     * @param _tokenOut Address-ul token-ului de output
     * @return uint256[] Lista de offer IDs
     */
    function getActiveOffersByPair(
        address _tokenIn,
        address _tokenOut
    ) external view returns (uint256[] memory) {
        return activeOffersByPair[_tokenIn][_tokenOut];
    }
    
    /**
     * @notice Returnează offer-urile executable (pentru keeper)
     * @param _maxOffers Max number of offers to return
     * @return uint256[] Lista de offer IDs executable
     */
    function getExecutableOffers(uint256 _maxOffers) external view returns (uint256[] memory) {
        uint256[] memory executableOffers = new uint256[](_maxOffers);
        uint256 count = 0;
        
        // Simplified - în producție ar trebui să iterăm prin toate offers
        // Pentru acum, returnăm empty array (keeper va folosi getActiveOffersByPair)
        
        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = executableOffers[i];
        }
        
        return result;
    }
    
    /**
     * @notice Check dacă un offer este executable
     * @param _offerId ID-ul offer-ului
     * @return bool True dacă offer-ul este executable
     */
    function isExecutable(uint256 _offerId) external view returns (bool) {
        SmartOffer memory offer = offers[_offerId];
        
        if (offer.status != OfferStatus.ACTIVE) {
            return false;
        }
        
        if (offer.expiry > 0 && block.timestamp > offer.expiry) {
            return false;
        }
        
        return _checkOfferConditions(_offerId);
    }
    
    /**
     * @notice Returnează numărul total de offers
     * @return uint256 Numărul total
     */
    function getTotalOffers() external view returns (uint256) {
        return offerCounter - 1;
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
     * @notice Returnează toate offer-urile cu Bitcoin pairs pentru un user
     * @param _user Address-ul user-ului
     * @return uint256[] Lista de offer IDs cu Bitcoin pairs
     */
    function getUserBitcoinOffers(address _user) external view returns (uint256[] memory) {
        uint256[] memory allOffers = userOffers[_user];
        uint256[] memory bitcoinOffers = new uint256[](allOffers.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < allOffers.length; i++) {
            SmartOffer memory offer = offers[allOffers[i]];
            if (BitcoinTokens.isBitcoinToken(offer.tokenIn) || BitcoinTokens.isBitcoinToken(offer.tokenOut)) {
                bitcoinOffers[count] = allOffers[i];
                count++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = bitcoinOffers[i];
        }
        
        return result;
    }
    
    /**
     * @notice Returnează offer-urile active cu Bitcoin pairs
     * @return uint256[] Lista de offer IDs cu Bitcoin pairs
     */
    function getActiveBitcoinOffers() external view returns (uint256[] memory) {
        // Get active offers pentru WBTC și BTCB pairs
        uint256[] memory wbtcOffers = activeOffersByPair[BitcoinTokens.WBTC_BSC][address(0)];
        uint256[] memory btcbOffers = activeOffersByPair[BitcoinTokens.BTCB_BSC][address(0)];
        
        // Combine arrays (simplified - în producție ar trebui să iterăm prin toate pairs)
        uint256 totalCount = wbtcOffers.length + btcbOffers.length;
        uint256[] memory result = new uint256[](totalCount);
        
        uint256 index = 0;
        for (uint256 i = 0; i < wbtcOffers.length; i++) {
            result[index] = wbtcOffers[i];
            index++;
        }
        for (uint256 i = 0; i < btcbOffers.length; i++) {
            result[index] = btcbOffers[i];
            index++;
        }
        
        return result;
    }
    
    // ============ RECEIVE ============
    
    /**
     * @dev Receive BNB (pentru offers cu BNB input)
     */
    receive() external payable {
        // Contractul poate primi BNB pentru offers cu BNB input
    }
}

