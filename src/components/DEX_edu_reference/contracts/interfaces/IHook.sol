// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IHook
 * @dev Interface pentru custom hooks (inspirat de Oxium)
 * @notice Permite dezvoltatorilor să creeze hooks personalizate pentru Smart Offers și Liquidity Management
 * @author BitSwapDEX Team
 * @custom:security-contact security@bitswapdex.com
 */

/**
 * @notice Offer parameters struct
 */
struct OfferParams {
    address user;               // User care creează offer-ul
    address tokenIn;            // Token de input
    address tokenOut;           // Token de output
    uint256 amountIn;          // Amount de input
    uint256 amountOutMin;      // Minimum output
    uint256 conditionPrice;    // Condition price
    uint256 expiry;            // Expiry timestamp
    bytes data;                // Custom hook data
}

/**
 * @notice Hook type enum
 */
enum HookType {
    OFFER,          // Hook pentru Smart Offers
    LIQUIDITY,      // Hook pentru Liquidity Management
    STAKING,        // Hook pentru Re-Staking Strategies
    AI_TRADING      // Hook pentru AI Trading
}

/**
 * @notice Hook result struct
 */
struct HookResult {
    bool allowed;               // Dacă operația este permisă
    string reason;              // Reason dacă nu e permisă
    bytes data;                 // Custom data pentru execution
}

/**
 * @title IHook
 * @dev Standard interface pentru custom hooks
 */
interface IHook {
    
    /**
     * @notice Verifică dacă offer-ul este valid (înainte de creation)
     * @param params Offer parameters
     * @return HookResult Hook result (allowed, reason, data)
     */
    function validateOffer(OfferParams calldata params) external view returns (HookResult memory);
    
    /**
     * @notice Execută logica înainte de execution
     * @param params Offer parameters
     * @return HookResult Hook result (allowed, reason, data)
     */
    function beforeExecution(OfferParams calldata params) external returns (HookResult memory);
    
    /**
     * @notice Execută logica după execution
     * @param params Offer parameters
     * @param executionResult Execution result (success, amountOut, etc.)
     * @return HookResult Hook result (allowed, reason, data)
     */
    function afterExecution(OfferParams calldata params, bool executionResult, uint256 amountOut) external returns (HookResult memory);
    
    /**
     * @notice Execută logica la cancellation
     * @param params Offer parameters
     */
    function onCancellation(OfferParams calldata params) external;
    
    /**
     * @notice Get hook type
     * @return HookType Type-ul hook-ului
     */
    function getHookType() external pure returns (HookType);
    
    /**
     * @notice Get hook name
     * @return string Numele hook-ului
     */
    function getHookName() external pure returns (string memory);
    
    /**
     * @notice Check dacă hook-ul este activ
     * @return bool True dacă hook-ul este activ
     */
    function isActive() external view returns (bool);
}

