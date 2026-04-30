// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPancakeRouter
 * @dev Interface pentru PancakeSwap Router V2
 * @notice Folosit de BitSwapDEXWrapper pentru executarea swap-urilor
 */
interface IPancakeRouter {
    /**
     * @dev Swap exact tokens for tokens
     * @param amountIn Cantitatea exactă de input tokens
     * @param amountOutMin Minimum output tokens (slippage protection)
     * @param path Array cu token addresses (de la input la output)
     * @param to Address-ul care primește output tokens
     * @param deadline Deadline pentru swap (unix timestamp)
     * @return amounts Array cu input amount și output amount
     */
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    /**
     * @dev Swap exact ETH for tokens
     * @param amountOutMin Minimum output tokens (slippage protection)
     * @param path Array cu token addresses (de la WETH la output token)
     * @param to Address-ul care primește output tokens
     * @param deadline Deadline pentru swap (unix timestamp)
     * @return amounts Array cu input amount (ETH) și output amount (tokens)
     */
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);
    
    /**
     * @dev Swap exact tokens for ETH
     * @param amountIn Cantitatea exactă de input tokens
     * @param amountOutMin Minimum output ETH (slippage protection)
     * @param path Array cu token addresses (de la input token la WETH)
     * @param to Address-ul care primește output ETH
     * @param deadline Deadline pentru swap (unix timestamp)
     * @return amounts Array cu input amount (tokens) și output amount (ETH)
     */
    function swapExactTokensForETH(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    /**
     * @dev Returnează adresa WETH (Wrapped ETH pe BSC)
     * @return WETH address
     */
    function WETH() external pure returns (address);
    
    /**
     * @dev Calculează amount-ul output pentru un input dat (fără slippage)
     * @param amountIn Cantitatea de input tokens
     * @param path Array cu token addresses
     * @return amounts Array cu amounts pentru fiecare pair din path
     */
    function getAmountsOut(
        uint amountIn,
        address[] calldata path
    ) external view returns (uint[] memory amounts);
    
    /**
     * @dev Calculează amount-ul input necesar pentru un output dat
     * @param amountOut Cantitatea dorită de output tokens
     * @param path Array cu token addresses
     * @return amounts Array cu amounts pentru fiecare pair din path
     */
    function getAmountsIn(
        uint amountOut,
        address[] calldata path
    ) external view returns (uint[] memory amounts);
}

