// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UserVault
 * @dev Smart Contract pentru management-ul fondurilor utilizatorilor (Vault Pattern)
 * @notice Permite utilizatorilor să depună fonduri care pot fi folosite pentru AI trading
 * @author BitSwapDEX Team
 * @custom:security-contact security@bitswapdex.com
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AITradingAccessControl.sol";

contract UserVault is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // ============ STRUCTS & ENUMS ============
    
    /**
     * @notice User vault struct
     */
    struct Vault {
        address user;               // User address
        address token;              // Token address (address(0) pentru BNB)
        uint256 balance;            // Current balance
        uint256 totalDeposited;     // Total deposited (historical)
        uint256 totalWithdrawn;     // Total withdrawn (historical)
        uint256 createdAt;          // Timestamp când vault-ul a fost creat
        bool isActive;              // Dacă vault-ul este activ
    }
    
    /**
     * @notice Bot authorization struct
     */
    struct BotAuthorization {
        address botAddress;         // Bot address
        uint256 maxAmount;          // Max amount bot-ul poate folosi (0 = unlimited)
        uint256 usedAmount;         // Amount folosit de bot (current)
        uint256 authorizedAt;       // Timestamp când autorizarea a fost creată
        bool isActive;              // Dacă autorizarea este activă
    }
    
    // ============ STATE VARIABLES ============
    
    /// @notice AITradingAccessControl contract
    AITradingAccessControl public accessControl;
    
    /// @notice Mapping: user => token => Vault
    mapping(address => mapping(address => Vault)) public vaults;
    
    /// @notice Mapping: user => token[] (lista de tokens pentru user)
    mapping(address => address[]) public userTokens;
    
    /// @notice Mapping: user => botAddress => BotAuthorization
    mapping(address => mapping(address => BotAuthorization)) public botAuthorizations;
    
    /// @notice Mapping: user => botAddress[] (lista de bot-uri autorizate pentru user)
    mapping(address => address[]) public userAuthorizedBots;
    
    /// @notice Total vaults created
    uint256 public totalVaults;
    
    /// @notice Total funds deposited (all users, all tokens)
    uint256 public totalDeposited;
    
    /// @notice Total funds withdrawn (all users, all tokens)
    uint256 public totalWithdrawn;
    
    /// @notice Minimum deposit amount per token (0 = no minimum)
    mapping(address => uint256) public minDepositAmounts;
    
    /// @notice Maximum deposit amount per token per user (0 = unlimited)
    mapping(address => uint256) public maxDepositAmounts;
    
    // ============ EVENTS ============
    
    event VaultCreated(
        address indexed user,
        address indexed token,
        uint256 amount
    );
    
    event FundsDeposited(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 newBalance
    );
    
    event FundsWithdrawn(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 newBalance
    );
    
    event BotAuthorized(
        address indexed user,
        address indexed botAddress,
        uint256 maxAmount
    );
    
    event BotAuthorizationRevoked(
        address indexed user,
        address indexed botAddress
    );
    
    event BotAuthorizationUpdated(
        address indexed user,
        address indexed botAddress,
        uint256 newMaxAmount
    );
    
    event FundsUsedByBot(
        address indexed user,
        address indexed botAddress,
        address indexed token,
        uint256 amount
    );
    
    event FundsReturnedByBot(
        address indexed user,
        address indexed botAddress,
        address indexed token,
        uint256 amount
    );
    
    // ============ MODIFIERS ============
    
    /**
     * @notice Verifică dacă bot-ul este autorizat pentru user
     */
    modifier onlyAuthorizedBot(address _user) {
        BotAuthorization memory auth = botAuthorizations[_user][msg.sender];
        require(auth.isActive, "UserVault: Bot not authorized");
        require(
            accessControl.isAuthorizedBot(msg.sender),
            "UserVault: Bot not authorized in access control"
        );
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Constructor
     * @param _accessControl Address-ul AITradingAccessControl contract
     */
    constructor(address _accessControl) {
        require(_accessControl != address(0), "UserVault: Invalid access control address");
        accessControl = AITradingAccessControl(_accessControl);
    }
    
    // ============ USER FUNCTIONS ============
    
    /**
     * @notice Deposit funds în vault
     * @param _token Address-ul token-ului (address(0) pentru BNB)
     * @param _amount Amount de tokens de depus
     */
    function deposit(address _token, uint256 _amount) external payable nonReentrant whenNotPaused {
        require(_amount > 0, "UserVault: Invalid amount");
        
        if (_token == address(0)) {
            // BNB deposit
            require(msg.value >= _amount, "UserVault: Insufficient BNB");
            require(msg.value == _amount, "UserVault: Amount mismatch");
        } else {
            // Token deposit
            require(msg.value == 0, "UserVault: Unexpected BNB");
            
            // Check min deposit
            if (minDepositAmounts[_token] > 0) {
                require(_amount >= minDepositAmounts[_token], "UserVault: Amount below minimum");
            }
            
            // Check max deposit
            if (maxDepositAmounts[_token] > 0) {
                Vault memory vault = vaults[msg.sender][_token];
                require(
                    vault.balance + _amount <= maxDepositAmounts[_token],
                    "UserVault: Exceeds max deposit"
                );
            }
            
            // Transfer tokens de la user la contract
            IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        }
        
        // Update vault
        Vault storage vault = vaults[msg.sender][_token];
        
        if (vault.user == address(0)) {
            // Create new vault
            vault.user = msg.sender;
            vault.token = _token;
            vault.createdAt = block.timestamp;
            vault.isActive = true;
            
            // Add token to user tokens list
            userTokens[msg.sender].push(_token);
            totalVaults++;
            
            emit VaultCreated(msg.sender, _token, _amount);
        }
        
        vault.balance += _amount;
        vault.totalDeposited += _amount;
        totalDeposited += _amount;
        
        emit FundsDeposited(msg.sender, _token, _amount, vault.balance);
    }
    
    /**
     * @notice Withdraw funds din vault
     * @param _token Address-ul token-ului (address(0) pentru BNB)
     * @param _amount Amount de tokens de retras
     */
    function withdraw(address _token, uint256 _amount) external nonReentrant whenNotPaused {
        Vault storage vault = vaults[msg.sender][_token];
        
        require(vault.user == msg.sender, "UserVault: Vault does not exist");
        require(vault.isActive, "UserVault: Vault is not active");
        require(_amount > 0, "UserVault: Invalid amount");
        require(vault.balance >= _amount, "UserVault: Insufficient balance");
        
        // Update vault
        vault.balance -= _amount;
        vault.totalWithdrawn += _amount;
        totalWithdrawn += _amount;
        
        // Transfer tokens back to user
        if (_token == address(0)) {
            // BNB withdrawal
            (bool success, ) = payable(msg.sender).call{value: _amount}("");
            require(success, "UserVault: BNB transfer failed");
        } else {
            // Token withdrawal
            IERC20(_token).safeTransfer(msg.sender, _amount);
        }
        
        emit FundsWithdrawn(msg.sender, _token, _amount, vault.balance);
    }
    
    /**
     * @notice Withdraw all funds din vault
     * @param _token Address-ul token-ului (address(0) pentru BNB)
     */
    function withdrawAll(address _token) external nonReentrant whenNotPaused {
        Vault storage vault = vaults[msg.sender][_token];
        
        require(vault.balance > 0, "UserVault: No funds to withdraw");
        
        uint256 amount = vault.balance;
        withdraw(_token, amount);
    }
    
    /**
     * @notice Authorize un bot să folosească fondurile din vault
     * @param _botAddress Address-ul bot-ului
     * @param _maxAmount Max amount bot-ul poate folosi (0 = unlimited)
     */
    function authorizeBot(address _botAddress, uint256 _maxAmount) external {
        require(_botAddress != address(0), "UserVault: Invalid bot address");
        require(
            accessControl.isAuthorizedBot(_botAddress),
            "UserVault: Bot not authorized in access control"
        );
        
        BotAuthorization storage auth = botAuthorizations[msg.sender][_botAddress];
        
        if (!auth.isActive) {
            // Create new authorization
            auth.botAddress = _botAddress;
            auth.maxAmount = _maxAmount;
            auth.usedAmount = 0;
            auth.authorizedAt = block.timestamp;
            auth.isActive = true;
            
            // Add bot to user's authorized bots list
            userAuthorizedBots[msg.sender].push(_botAddress);
            
            emit BotAuthorized(msg.sender, _botAddress, _maxAmount);
        } else {
            // Update existing authorization
            auth.maxAmount = _maxAmount;
            emit BotAuthorizationUpdated(msg.sender, _botAddress, _maxAmount);
        }
    }
    
    /**
     * @notice Revoke bot authorization
     * @param _botAddress Address-ul bot-ului
     */
    function revokeBotAuthorization(address _botAddress) external {
        BotAuthorization storage auth = botAuthorizations[msg.sender][_botAddress];
        
        require(auth.isActive, "UserVault: Bot not authorized");
        
        // Mark as inactive
        auth.isActive = false;
        auth.usedAmount = 0;
        
        // Remove bot from user's authorized bots list
        address[] storage bots = userAuthorizedBots[msg.sender];
        for (uint256 i = 0; i < bots.length; i++) {
            if (bots[i] == _botAddress) {
                bots[i] = bots[bots.length - 1];
                bots.pop();
                break;
            }
        }
        
        emit BotAuthorizationRevoked(msg.sender, _botAddress);
    }
    
    // ============ BOT FUNCTIONS (Only Authorized Bots) ============
    
    /**
     * @notice Use funds din vault (pentru authorized bots)
     * @param _user Address-ul user-ului
     * @param _token Address-ul token-ului (address(0) pentru BNB)
     * @param _amount Amount de tokens de folosit
     * @return bool True dacă funds au fost folosite cu succes
     */
    function useFunds(
        address _user,
        address _token,
        uint256 _amount
    ) external onlyAuthorizedBot(_user) nonReentrant whenNotPaused returns (bool) {
        require(_user != address(0), "UserVault: Invalid user address");
        require(_amount > 0, "UserVault: Invalid amount");
        
        Vault storage vault = vaults[_user][_token];
        BotAuthorization storage auth = botAuthorizations[_user][msg.sender];
        
        require(vault.user == _user, "UserVault: Vault does not exist");
        require(vault.isActive, "UserVault: Vault is not active");
        require(vault.balance >= _amount, "UserVault: Insufficient balance");
        
        // Check max amount dacă e setat
        if (auth.maxAmount > 0) {
            require(
                auth.usedAmount + _amount <= auth.maxAmount,
                "UserVault: Exceeds max authorized amount"
            );
        }
        
        // Update vault
        vault.balance -= _amount;
        
        // Update authorization
        auth.usedAmount += _amount;
        
        // Transfer tokens to bot (bot-ul va folosi tokens pentru trading)
        if (_token == address(0)) {
            // BNB transfer
            (bool success, ) = payable(msg.sender).call{value: _amount}("");
            require(success, "UserVault: BNB transfer failed");
        } else {
            // Token transfer
            IERC20(_token).safeTransfer(msg.sender, _amount);
        }
        
        emit FundsUsedByBot(_user, msg.sender, _token, _amount);
        
        return true;
    }
    
    /**
     * @notice Return funds în vault (pentru authorized bots - după trade execution)
     * @param _user Address-ul user-ului
     * @param _token Address-ul token-ului (address(0) pentru BNB)
     * @param _amount Amount de tokens de returnat
     * @return bool True dacă funds au fost returnate cu succes
     */
    function returnFunds(
        address _user,
        address _token,
        uint256 _amount
    ) external onlyAuthorizedBot(_user) nonReentrant whenNotPaused returns (bool) {
        require(_user != address(0), "UserVault: Invalid user address");
        require(_amount > 0, "UserVault: Invalid amount");
        
        Vault storage vault = vaults[_user][_token];
        BotAuthorization storage auth = botAuthorizations[_user][msg.sender];
        
        require(vault.user == _user, "UserVault: Vault does not exist");
        
        // Transfer tokens de la bot la contract
        if (_token == address(0)) {
            // BNB transfer
            require(msg.value >= _amount, "UserVault: Insufficient BNB");
            require(msg.value == _amount, "UserVault: Amount mismatch");
        } else {
            // Token transfer
            IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        }
        
        // Update vault
        if (!vault.isActive) {
            vault.isActive = true;
            vault.createdAt = block.timestamp;
        }
        vault.balance += _amount;
        
        // Update authorization (reduce used amount)
        if (auth.usedAmount >= _amount) {
            auth.usedAmount -= _amount;
        } else {
            auth.usedAmount = 0;
        }
        
        emit FundsReturnedByBot(_user, msg.sender, _token, _amount);
        
        return true;
    }
    
    // ============ OWNER FUNCTIONS ============
    
    /**
     * @notice Update access control contract
     * @param _accessControl Address-ul nou al access control contract
     */
    function setAccessControl(address _accessControl) external onlyOwner {
        require(_accessControl != address(0), "UserVault: Invalid access control address");
        accessControl = AITradingAccessControl(_accessControl);
    }
    
    /**
     * @notice Set min deposit amount pentru un token
     * @param _token Address-ul token-ului
     * @param _minAmount Minimum deposit amount (0 = no minimum)
     */
    function setMinDepositAmount(address _token, uint256 _minAmount) external onlyOwner {
        minDepositAmounts[_token] = _minAmount;
    }
    
    /**
     * @notice Set max deposit amount pentru un token per user
     * @param _token Address-ul token-ului
     * @param _maxAmount Maximum deposit amount (0 = unlimited)
     */
    function setMaxDepositAmount(address _token, uint256 _maxAmount) external onlyOwner {
        maxDepositAmounts[_token] = _maxAmount;
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
            require(success, "UserVault: BNB transfer failed");
        } else {
            IERC20(_token).safeTransfer(owner(), _amount);
        }
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Returnează vault-ul unui user pentru un token
     * @param _user Address-ul user-ului
     * @param _token Address-ul token-ului
     * @return Vault Vault struct
     */
    function getVault(address _user, address _token) external view returns (Vault memory) {
        return vaults[_user][_token];
    }
    
    /**
     * @notice Returnează balance-ul unui user pentru un token
     * @param _user Address-ul user-ului
     * @param _token Address-ul token-ului
     * @return uint256 Balance
     */
    function getBalance(address _user, address _token) external view returns (uint256) {
        return vaults[_user][_token].balance;
    }
    
    /**
     * @notice Returnează toate tokens pentru un user
     * @param _user Address-ul user-ului
     * @return address[] Lista de token addresses
     */
    function getUserTokens(address _user) external view returns (address[] memory) {
        return userTokens[_user];
    }
    
    /**
     * @notice Returnează toate balances pentru un user
     * @param _user Address-ul user-ului
     * @return address[] Token addresses
     * @return uint256[] Balances
     */
    function getUserBalances(address _user) external view returns (address[] memory, uint256[] memory) {
        address[] memory tokens = userTokens[_user];
        uint256[] memory balances = new uint256[](tokens.length);
        
        for (uint256 i = 0; i < tokens.length; i++) {
            balances[i] = vaults[_user][tokens[i]].balance;
        }
        
        return (tokens, balances);
    }
    
    /**
     * @notice Returnează bot authorization pentru un user și bot
     * @param _user Address-ul user-ului
     * @param _botAddress Address-ul bot-ului
     * @return BotAuthorization Authorization struct
     */
    function getBotAuthorization(address _user, address _botAddress) external view returns (BotAuthorization memory) {
        return botAuthorizations[_user][_botAddress];
    }
    
    /**
     * @notice Returnează toate bot-urile autorizate pentru un user
     * @param _user Address-ul user-ului
     * @return address[] Lista de bot addresses
     */
    function getUserAuthorizedBots(address _user) external view returns (address[] memory) {
        return userAuthorizedBots[_user];
    }
    
    /**
     * @notice Check dacă bot-ul poate folosi fondurile pentru un amount
     * @param _user Address-ul user-ului
     * @param _botAddress Address-ul bot-ului
     * @param _token Address-ul token-ului
     * @param _amount Amount de verificat
     * @return bool True dacă bot-ul poate folosi funds
     */
    function canBotUseFunds(
        address _user,
        address _botAddress,
        address _token,
        uint256 _amount
    ) external view returns (bool) {
        BotAuthorization memory auth = botAuthorizations[_user][_botAddress];
        Vault memory vault = vaults[_user][_token];
        
        if (!auth.isActive) {
            return false;
        }
        
        if (!accessControl.isAuthorizedBot(_botAddress)) {
            return false;
        }
        
        if (vault.balance < _amount) {
            return false;
        }
        
        if (auth.maxAmount > 0) {
            if (auth.usedAmount + _amount > auth.maxAmount) {
                return false;
            }
        }
        
        return true;
    }
    
    // ============ RECEIVE ============
    
    /**
     * @dev Receive BNB (pentru deposits)
     */
    receive() external payable {
        // BNB deposit ar trebui să folosească deposit(address(0), msg.value)
        // Această funcție permite contractul să primească BNB direct (pentru backwards compatibility)
    }
}

