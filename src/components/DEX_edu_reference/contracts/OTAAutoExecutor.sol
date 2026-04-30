// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OTAAutoExecutor
 * @dev Auto execution contract for OTA Mode 3 (Auto Mode)
 * @notice Executes trades on behalf of users without transferring custody to bots
 * @author BitSwapDEX Team
 * @custom:security-contact security@bitswapdex.com
 *
 * FIX v2: IUserVault.botAuthorizations return order corrected to match
 *         UserVault struct: (address, uint256, uint256, uint256, bool)
 *         Previously had isActive/authorizedAt swapped, causing
 *         ABI decoder revert (strict bool validation in Solidity 0.8+).
 *
 * FIX v3: Support 3-hop path for quote→token when no direct pool (e.g. USDT→ADA).
 *         Path may be 2 (direct or via native) or 3 [tokenIn, WBNB, tokenOut].
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IPancakeRouter.sol";

interface IUserVault {
    function executeSwapForUser(
        address _user,
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _amountOutMin,
        address[] calldata _path,
        uint256 _deadline
    ) external returns (uint256);
    
    function botAuthorizations(address _user, address _botAddress) external view returns (
        address botAddress,
        uint256 maxAmount,
        uint256 usedAmount,
        uint256 authorizedAt,
        bool isActive
    );
    
    function canUserUseOTA(address _user) external view returns (bool);
}

interface IAITradingAccessControl {
    function isAuthorizedBot(address _bot) external view returns (bool);
}

interface IOTAPolicyManager {
    function validateAndConsume(
        address _user,
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _slippageBps
    ) external;
}

contract OTAAutoExecutor is Ownable, ReentrancyGuard, Pausable {
    
    IUserVault public userVault;
    IOTAPolicyManager public policyManager;
    IAITradingAccessControl public accessControl;
    
    IPancakeRouter public constant PANCAKE_ROUTER = IPancakeRouter(0x10ED43C718714eb63d5aA57B78B54704E256024E);
    address public constant WBNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
    
    event TradeRequested(
        address indexed user,
        address indexed bot,
        address indexed tokenIn,
        address tokenOut,
        uint256 amountIn
    );
    
    event TradeExecuted(
        address indexed user,
        address indexed bot,
        address indexed tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    event TradeRejected(
        address indexed user,
        address indexed bot,
        string reason
    );
    
    event UserVaultUpdated(address indexed oldVault, address indexed newVault);
    event PolicyManagerUpdated(address indexed oldManager, address indexed newManager);
    event AccessControlUpdated(address indexed oldControl, address indexed newControl);
    
    constructor(
        address _userVault,
        address _policyManager,
        address _accessControl
    ) Ownable(msg.sender) {
        require(_userVault != address(0), "OTAAutoExecutor: Invalid user vault address");
        require(_policyManager != address(0), "OTAAutoExecutor: Invalid policy manager address");
        require(_accessControl != address(0), "OTAAutoExecutor: Invalid access control address");
        
        userVault = IUserVault(_userVault);
        policyManager = IOTAPolicyManager(_policyManager);
        accessControl = IAITradingAccessControl(_accessControl);
    }
    
    modifier onlyAuthorizedBot(address _bot) {
        require(accessControl.isAuthorizedBot(_bot), "OTAAutoExecutor: Bot not authorized");
        _;
    }
    
    function executeTrade(
        address _user,
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _amountOutMin,
        address[] calldata _path,
        uint256 _deadline
    ) external onlyAuthorizedBot(msg.sender) nonReentrant whenNotPaused returns (uint256 amountOut) {
        require(_user != address(0), "OTAAutoExecutor: Invalid user address");
        require(_amountIn > 0, "OTAAutoExecutor: Invalid amount");
        require(_deadline >= block.timestamp, "OTAAutoExecutor: Deadline has passed");
        require(_path.length >= 2 && _path.length <= 3, "OTAAutoExecutor: Path must be 2 or 3-hop");
        
        emit TradeRequested(_user, msg.sender, _tokenIn, _tokenOut, _amountIn);
        
        require(userVault.canUserUseOTA(_user), "OTAAutoExecutor: User cannot use OTA");
        
        (,,,,bool isActive) = userVault.botAuthorizations(_user, msg.sender);
        require(isActive, "OTAAutoExecutor: Bot not authorized by user");
        
        address[] memory pathUsed = _buildSwapPath(_tokenIn, _tokenOut, _path);
        
        uint256 expectedOut = 0;
        uint256 slippageBps = 0;
        
        try PANCAKE_ROUTER.getAmountsOut(_amountIn, pathUsed) returns (uint[] memory amounts) {
            expectedOut = amounts[amounts.length - 1];
            if (expectedOut > 0 && _amountOutMin < expectedOut) {
                slippageBps = ((expectedOut - _amountOutMin) * 10000) / expectedOut;
            }
        } catch {
            slippageBps = 0;
        }
        
        policyManager.validateAndConsume(_user, _tokenIn, _tokenOut, _amountIn, slippageBps);
        
        amountOut = userVault.executeSwapForUser(
            _user,
            _tokenIn,
            _tokenOut,
            _amountIn,
            _amountOutMin,
            pathUsed,
            _deadline
        );
        
        emit TradeExecuted(_user, msg.sender, _tokenIn, _tokenOut, _amountIn, amountOut);
        
        return amountOut;
    }
    
    function _buildSwapPath(
        address _tokenIn,
        address _tokenOut,
        address[] calldata _providedPath
    ) internal pure returns (address[] memory path) {
        bool tokenInIsNative = _tokenIn == address(0);
        bool tokenOutIsNative = _tokenOut == address(0);
        bool tokenInIsWbnb = _tokenIn == WBNB;
        bool tokenOutIsWbnb = _tokenOut == WBNB;

        if (tokenInIsNative) {
            path = new address[](2);
            path[0] = WBNB;
            path[1] = _tokenOut;
        } else if (tokenOutIsNative) {
            path = new address[](2);
            path[0] = _tokenIn;
            path[1] = WBNB;
        } else if (!tokenInIsWbnb && !tokenOutIsWbnb) {
            path = new address[](3);
            path[0] = _tokenIn;
            path[1] = WBNB;
            path[2] = _tokenOut;
        } else {
            path = new address[](2);
            path[0] = _tokenIn;
            path[1] = _tokenOut;
        }

        require(_providedPath.length == path.length, "OTAAutoExecutor: Invalid path length");
        for (uint256 i = 0; i < path.length; i++) {
            require(_providedPath[i] == path[i], "OTAAutoExecutor: Path mismatch");
        }
    }
    
    function setUserVault(address _userVault) external onlyOwner {
        require(_userVault != address(0), "OTAAutoExecutor: Invalid user vault address");
        address oldVault = address(userVault);
        userVault = IUserVault(_userVault);
        emit UserVaultUpdated(oldVault, _userVault);
    }
    
    function setPolicyManager(address _policyManager) external onlyOwner {
        require(_policyManager != address(0), "OTAAutoExecutor: Invalid policy manager address");
        address oldManager = address(policyManager);
        policyManager = IOTAPolicyManager(_policyManager);
        emit PolicyManagerUpdated(oldManager, _policyManager);
    }
    
    function setAccessControl(address _accessControl) external onlyOwner {
        require(_accessControl != address(0), "OTAAutoExecutor: Invalid access control address");
        address oldControl = address(accessControl);
        accessControl = IAITradingAccessControl(_accessControl);
        emit AccessControlUpdated(oldControl, _accessControl);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
