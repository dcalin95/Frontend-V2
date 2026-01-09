// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AITradingAccessControl
 * @dev Access Control Contract pentru BitSwapDEX AI Trading
 * @notice Gestionează autorizarea bot-urilor AI și a permisiunilor
 * @author BitSwapDEX Team
 * @custom:security-contact security@bitswapdex.com
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract AITradingAccessControl is Ownable, ReentrancyGuard, Pausable {
    
    // ============ STRUCTS & ENUMS ============
    
    /**
     * @notice Permission levels pentru bot-uri
     */
    enum PermissionLevel {
        READ_ONLY,  // Poate doar să citească date
        EXECUTE,    // Poate executa trade-uri
        ADMIN       // Acces complet (pentru upgrade contracts, etc.)
    }
    
    /**
     * @notice Bot permissions struct
     */
    struct BotPermissions {
        address botAddress;
        bool isAuthorized;
        PermissionLevel level;
        uint256 maxTradesPerHour;
        uint256 tradesThisHour;
        uint256 lastResetTime;
        uint256 maxTradeAmount;        // Max amount per trade (in wei/USD equivalent)
        uint256 totalTradesExecuted;
        uint256 createdAt;
        bool isActive;
    }
    
    // ============ STATE VARIABLES ============
    
    /// @notice Mapping: bot address => BotPermissions
    mapping(address => BotPermissions) public botPermissions;
    
    /// @notice Lista tuturor bot-urilor autorizate
    address[] public authorizedBots;
    
    /// @notice Mapping: bot address => index in authorizedBots array (pentru delete efficiency)
    mapping(address => uint256) private botIndex;
    
    /// @notice Multi-sig address pentru admin operations (opțional)
    address public multisigAdmin;
    
    /// @notice Require multi-sig pentru sensitive operations
    bool public requireMultisig;
    
    /// @notice Total number of authorized bots
    uint256 public totalAuthorizedBots;
    
    // ============ CONSTANTS ============
    
    /// @notice Default max trades per hour (poate fi overridden per bot)
    uint256 public constant DEFAULT_MAX_TRADES_PER_HOUR = 100;
    
    /// @notice Hour duration in seconds
    uint256 public constant HOUR = 3600;
    
    // ============ EVENTS ============
    
    event BotAuthorized(
        address indexed botAddress,
        PermissionLevel level,
        uint256 maxTradesPerHour,
        uint256 maxTradeAmount
    );
    
    event BotRevoked(address indexed botAddress);
    
    event BotPermissionsUpdated(
        address indexed botAddress,
        PermissionLevel level,
        uint256 maxTradesPerHour,
        uint256 maxTradeAmount
    );
    
    event RateLimitUpdated(
        address indexed botAddress,
        uint256 maxTradesPerHour
    );
    
    event RateLimitReset(address indexed botAddress);
    
    event MultisigAdminUpdated(address indexed oldMultisig, address indexed newMultisig);
    
    event TradeExecuted(
        address indexed botAddress,
        address indexed user,
        uint256 tradeId
    );
    
    // ============ MODIFIERS ============
    
    /**
     * @notice Verifică dacă bot-ul este autorizat
     */
    modifier onlyAuthorizedBot() {
        require(
            botPermissions[msg.sender].isAuthorized && botPermissions[msg.sender].isActive,
            "AITradingAccessControl: Bot not authorized"
        );
        require(
            botPermissions[msg.sender].level >= PermissionLevel.EXECUTE,
            "AITradingAccessControl: Bot lacks execute permission"
        );
        _;
    }
    
    /**
     * @notice Verifică dacă bot-ul are permisiunea de ADMIN
     */
    modifier onlyAdminBot() {
        require(
            botPermissions[msg.sender].isAuthorized && botPermissions[msg.sender].isActive,
            "AITradingAccessControl: Bot not authorized"
        );
        require(
            botPermissions[msg.sender].level == PermissionLevel.ADMIN,
            "AITradingAccessControl: Bot lacks admin permission"
        );
        _;
    }
    
    /**
     * @notice Verifică dacă operația necesită multi-sig
     */
    modifier requiresMultisig() {
        if (requireMultisig) {
            require(
                msg.sender == multisigAdmin || msg.sender == owner(),
                "AITradingAccessControl: Requires multisig or owner"
            );
        }
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Constructor
     * @param _multisigAdmin Address-ul multi-sig admin (poate fi address(0) dacă nu e necesar)
     */
    constructor(address _multisigAdmin) {
        require(_multisigAdmin != address(0) || msg.sender != address(0), "Invalid multisig address");
        multisigAdmin = _multisigAdmin;
        requireMultisig = _multisigAdmin != address(0);
        
        // Initialize authorizedBots array cu index 0 ca placeholder (pentru delete efficiency)
        authorizedBots.push(address(0));
    }
    
    // ============ OWNER FUNCTIONS ============
    
    /**
     * @notice Autorizează un bot nou
     * @param _botAddress Address-ul bot-ului
     * @param _level Permission level (READ_ONLY, EXECUTE, ADMIN)
     * @param _maxTradesPerHour Max trades per hour (0 = default)
     * @param _maxTradeAmount Max amount per trade (in wei/USD equivalent, 0 = unlimited)
     */
    function authorizeBot(
        address _botAddress,
        PermissionLevel _level,
        uint256 _maxTradesPerHour,
        uint256 _maxTradeAmount
    ) external onlyOwner requiresMultisig {
        require(_botAddress != address(0), "AITradingAccessControl: Invalid bot address");
        require(!botPermissions[_botAddress].isAuthorized, "AITradingAccessControl: Bot already authorized");
        require(uint8(_level) <= uint8(PermissionLevel.ADMIN), "AITradingAccessControl: Invalid permission level");
        
        // Set max trades per hour (0 = use default)
        uint256 maxTrades = _maxTradesPerHour == 0 ? DEFAULT_MAX_TRADES_PER_HOUR : _maxTradesPerHour;
        
        // Initialize bot permissions
        botPermissions[_botAddress] = BotPermissions({
            botAddress: _botAddress,
            isAuthorized: true,
            level: _level,
            maxTradesPerHour: maxTrades,
            tradesThisHour: 0,
            lastResetTime: block.timestamp,
            maxTradeAmount: _maxTradeAmount,
            totalTradesExecuted: 0,
            createdAt: block.timestamp,
            isActive: true
        });
        
        // Add to authorizedBots array
        botIndex[_botAddress] = authorizedBots.length;
        authorizedBots.push(_botAddress);
        totalAuthorizedBots++;
        
        emit BotAuthorized(_botAddress, _level, maxTrades, _maxTradeAmount);
    }
    
    /**
     * @notice Revocă autorizarea unui bot
     * @param _botAddress Address-ul bot-ului
     */
    function revokeBot(address _botAddress) external onlyOwner requiresMultisig {
        require(botPermissions[_botAddress].isAuthorized, "AITradingAccessControl: Bot not authorized");
        
        // Mark as unauthorized and inactive
        botPermissions[_botAddress].isAuthorized = false;
        botPermissions[_botAddress].isActive = false;
        
        // Remove from authorizedBots array (swap with last element for efficiency)
        uint256 index = botIndex[_botAddress];
        uint256 lastIndex = authorizedBots.length - 1;
        address lastBot = authorizedBots[lastIndex];
        
        if (index != lastIndex) {
            authorizedBots[index] = lastBot;
            botIndex[lastBot] = index;
        }
        
        authorizedBots.pop();
        botIndex[_botAddress] = 0;
        totalAuthorizedBots--;
        
        emit BotRevoked(_botAddress);
    }
    
    /**
     * @notice Actualizează permisiunile unui bot
     * @param _botAddress Address-ul bot-ului
     * @param _level New permission level
     * @param _maxTradesPerHour New max trades per hour (0 = keep current)
     * @param _maxTradeAmount New max trade amount (0 = keep current)
     */
    function updateBotPermissions(
        address _botAddress,
        PermissionLevel _level,
        uint256 _maxTradesPerHour,
        uint256 _maxTradeAmount
    ) external onlyOwner requiresMultisig {
        require(botPermissions[_botAddress].isAuthorized, "AITradingAccessControl: Bot not authorized");
        require(uint8(_level) <= uint8(PermissionLevel.ADMIN), "AITradingAccessControl: Invalid permission level");
        
        BotPermissions storage bot = botPermissions[_botAddress];
        bot.level = _level;
        
        if (_maxTradesPerHour > 0) {
            bot.maxTradesPerHour = _maxTradesPerHour;
        }
        
        if (_maxTradeAmount > 0) {
            bot.maxTradeAmount = _maxTradeAmount;
        }
        
        emit BotPermissionsUpdated(_botAddress, _level, bot.maxTradesPerHour, bot.maxTradeAmount);
    }
    
    /**
     * @notice Actualizează rate limit-ul pentru un bot
     * @param _botAddress Address-ul bot-ului
     * @param _maxTradesPerHour New max trades per hour
     */
    function updateRateLimit(
        address _botAddress,
        uint256 _maxTradesPerHour
    ) external onlyOwner {
        require(botPermissions[_botAddress].isAuthorized, "AITradingAccessControl: Bot not authorized");
        require(_maxTradesPerHour > 0, "AITradingAccessControl: Invalid max trades");
        
        botPermissions[_botAddress].maxTradesPerHour = _maxTradesPerHour;
        
        emit RateLimitUpdated(_botAddress, _maxTradesPerHour);
    }
    
    /**
     * @notice Reset rate limit pentru un bot (manual reset)
     * @param _botAddress Address-ul bot-ului
     */
    function resetRateLimit(address _botAddress) external onlyOwner {
        require(botPermissions[_botAddress].isAuthorized, "AITradingAccessControl: Bot not authorized");
        
        botPermissions[_botAddress].tradesThisHour = 0;
        botPermissions[_botAddress].lastResetTime = block.timestamp;
        
        emit RateLimitReset(_botAddress);
    }
    
    /**
     * @notice Set/update multi-sig admin address
     * @param _newMultisig Address-ul noului multi-sig admin
     */
    function setMultisigAdmin(address _newMultisig) external onlyOwner {
        require(_newMultisig != address(0), "AITradingAccessControl: Invalid multisig address");
        address oldMultisig = multisigAdmin;
        multisigAdmin = _newMultisig;
        requireMultisig = true;
        
        emit MultisigAdminUpdated(oldMultisig, _newMultisig);
    }
    
    /**
     * @notice Disable multi-sig requirement (emergency only)
     */
    function disableMultisig() external onlyOwner {
        requireMultisig = false;
    }
    
    /**
     * @notice Enable multi-sig requirement
     */
    function enableMultisig() external onlyOwner {
        require(multisigAdmin != address(0), "AITradingAccessControl: Multisig address not set");
        requireMultisig = true;
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
    
    // ============ BOT FUNCTIONS ============
    
    /**
     * @notice Verifică dacă bot-ul poate executa un trade (internal call din AITradingExecutor)
     * @param _user Address-ul user-ului pentru care se execută trade-ul
     * @param _tradeAmount Amount-ul trade-ului (pentru verificare maxTradeAmount)
     * @return bool True dacă poate executa
     */
    function canExecuteTrade(
        address _user,
        uint256 _tradeAmount
    ) external onlyAuthorizedBot whenNotPaused nonReentrant returns (bool) {
        BotPermissions storage bot = botPermissions[msg.sender];
        
        // Check dacă bot-ul e activ
        require(bot.isActive, "AITradingAccessControl: Bot is inactive");
        
        // Reset rate limit dacă a trecut o oră
        if (block.timestamp >= bot.lastResetTime + HOUR) {
            bot.tradesThisHour = 0;
            bot.lastResetTime = block.timestamp;
        }
        
        // Check rate limit
        require(
            bot.tradesThisHour < bot.maxTradesPerHour,
            "AITradingAccessControl: Rate limit exceeded"
        );
        
        // Check max trade amount
        if (bot.maxTradeAmount > 0) {
            require(
                _tradeAmount <= bot.maxTradeAmount,
                "AITradingAccessControl: Trade amount exceeds maximum"
            );
        }
        
        // Increment trades counter
        bot.tradesThisHour++;
        bot.totalTradesExecuted++;
        
        // Emit event pentru tracking
        emit TradeExecuted(msg.sender, _user, bot.totalTradesExecuted);
        
        return true;
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Verifică dacă un bot este autorizat
     * @param _botAddress Address-ul bot-ului
     * @return bool True dacă este autorizat și activ
     */
    function isAuthorizedBot(address _botAddress) external view returns (bool) {
        return botPermissions[_botAddress].isAuthorized && botPermissions[_botAddress].isActive;
    }
    
    /**
     * @notice Verifică dacă un bot poate executa trade-uri
     * @param _botAddress Address-ul bot-ului
     * @param _tradeAmount Amount-ul trade-ului
     * @return bool True dacă poate executa
     * @return string Reason dacă nu poate executa
     */
    function canExecuteTradeView(
        address _botAddress,
        uint256 _tradeAmount
    ) external view returns (bool, string memory) {
        BotPermissions memory bot = botPermissions[_botAddress];
        
        if (!bot.isAuthorized) {
            return (false, "Bot not authorized");
        }
        
        if (!bot.isActive) {
            return (false, "Bot is inactive");
        }
        
        if (bot.level < PermissionLevel.EXECUTE) {
            return (false, "Bot lacks execute permission");
        }
        
        // Check rate limit
        uint256 currentTrades = bot.tradesThisHour;
        uint256 timeSinceReset = block.timestamp - bot.lastResetTime;
        
        if (timeSinceReset >= HOUR) {
            currentTrades = 0; // Reset dacă a trecut o oră
        }
        
        if (currentTrades >= bot.maxTradesPerHour) {
            return (false, "Rate limit exceeded");
        }
        
        // Check max trade amount
        if (bot.maxTradeAmount > 0 && _tradeAmount > bot.maxTradeAmount) {
            return (false, "Trade amount exceeds maximum");
        }
        
        return (true, "");
    }
    
    /**
     * @notice Returnează permisiunile unui bot
     * @param _botAddress Address-ul bot-ului
     * @return BotPermissions Permisiunile bot-ului
     */
    function getBotPermissions(address _botAddress) external view returns (BotPermissions memory) {
        return botPermissions[_botAddress];
    }
    
    /**
     * @notice Returnează lista tuturor bot-urilor autorizate
     * @return address[] Lista de adrese
     */
    function getAuthorizedBots() external view returns (address[] memory) {
        // Exclude placeholder address(0) din index 0
        address[] memory bots = new address[](totalAuthorizedBots);
        uint256 index = 0;
        for (uint256 i = 1; i < authorizedBots.length; i++) {
            if (botPermissions[authorizedBots[i]].isAuthorized && botPermissions[authorizedBots[i]].isActive) {
                bots[index] = authorizedBots[i];
                index++;
            }
        }
        return bots;
    }
    
    /**
     * @notice Returnează numărul total de bot-uri autorizate
     * @return uint256 Numărul de bot-uri
     */
    function getTotalAuthorizedBots() external view returns (uint256) {
        return totalAuthorizedBots;
    }
    
    /**
     * @notice Verifică rate limit status pentru un bot
     * @param _botAddress Address-ul bot-ului
     * @return uint256 Trades în ultima oră
     * @return uint256 Max trades per hour
     * @return uint256 Time until reset (seconds)
     */
    function getRateLimitStatus(address _botAddress) external view returns (
        uint256,
        uint256,
        uint256
    ) {
        BotPermissions memory bot = botPermissions[_botAddress];
        
        uint256 currentTrades = bot.tradesThisHour;
        uint256 timeSinceReset = block.timestamp - bot.lastResetTime;
        
        if (timeSinceReset >= HOUR) {
            currentTrades = 0;
            timeSinceReset = HOUR;
        }
        
        uint256 timeUntilReset = HOUR - timeSinceReset;
        
        return (currentTrades, bot.maxTradesPerHour, timeUntilReset);
    }
}

