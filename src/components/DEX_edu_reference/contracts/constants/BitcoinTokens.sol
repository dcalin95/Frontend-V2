// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BitcoinTokens
 * @dev Constants pentru Bitcoin tokens pe BSC (WBTC, BTCB)
 * @notice Token addresses și helper functions pentru Bitcoin integration
 * @author BitSwapDEX Team
 */

/**
 * @notice Bitcoin token addresses pe BSC (Binance Smart Chain)
 */
library BitcoinTokens {
    
    // ============ BITCOIN TOKENS ON BSC ============
    
    /// @notice Wrapped Bitcoin (WBTC) pe BSC
    /// @dev Contract: 0x1CE0c2827e2eF14D5C4f29a091d735A204794041
    /// @dev 1:1 backing cu Bitcoin real (custodied de Wrapped BTC DAO)
    address public constant WBTC_BSC = 0x1CE0c2827e2eF14D5C4f29a091d735A204794041;
    
    /// @notice Binance-Pegged Bitcoin (BTCB) pe BSC
    /// @dev Contract: 0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c
    /// @dev 1:1 backing cu Bitcoin real (custodied de Binance)
    address public constant BTCB_BSC = 0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c;
    
    /// @notice BTCB V2 (mai nou, dacă există)
    /// @dev Contract: Check latest Binance documentation
    address public constant BTCB_V2_BSC = 0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c; // Same as BTCB
    
    // ============ HELPER FUNCTIONS ============
    
    /**
     * @notice Verifică dacă un token este un Bitcoin token (WBTC sau BTCB)
     * @param token Token address de verificat
     * @return bool True dacă token-ul este WBTC sau BTCB
     */
    function isBitcoinToken(address token) internal pure returns (bool) {
        return token == WBTC_BSC || token == BTCB_BSC;
    }
    
    /**
     * @notice Returnează numele token-ului Bitcoin
     * @param token Token address
     * @return string Numele token-ului (WBTC sau BTCB)
     */
    function getBitcoinTokenName(address token) internal pure returns (string memory) {
        if (token == WBTC_BSC) {
            return "WBTC";
        } else if (token == BTCB_BSC) {
            return "BTCB";
        }
        return "UNKNOWN";
    }
    
    /**
     * @notice Returnează symbol-ul token-ului Bitcoin
     * @param token Token address
     * @return string Symbol-ul token-ului (WBTC sau BTCB)
     */
    function getBitcoinTokenSymbol(address token) internal pure returns (string memory) {
        if (token == WBTC_BSC) {
            return "WBTC";
        } else if (token == BTCB_BSC) {
            return "BTCB";
        }
        return "UNKNOWN";
    }
    
    /**
     * @notice Returnează toate Bitcoin tokens pe BSC
     * @return address[] Array cu WBTC și BTCB addresses
     */
    function getAllBitcoinTokens() internal pure returns (address[] memory) {
        address[] memory tokens = new address[](2);
        tokens[0] = WBTC_BSC;
        tokens[1] = BTCB_BSC;
        return tokens;
    }
    
    /**
     * @notice Returnează Bitcoin token preferat (BTCB - cel mai lichid pe BSC)
     * @return address BTCB address
     */
    function getPreferredBitcoinToken() internal pure returns (address) {
        return BTCB_BSC; // BTCB este cel mai lichid pe BSC
    }
    
    // ============ OXIUM-INSPIRED FUNCTIONS ============
    
    /**
     * @notice Check dacă două tokens sunt Bitcoin equivalents (WBTC ↔ BTCB)
     * @dev Inspirat din Oxium - permite tratarea WBTC și BTCB ca equivalents
     * @param token1 First token
     * @param token2 Second token
     * @return bool True dacă ambele sunt Bitcoin tokens
     */
    function areBitcoinEquivalents(address token1, address token2) internal pure returns (bool) {
        return isBitcoinToken(token1) && isBitcoinToken(token2);
    }
    
    /**
     * @notice Get Bitcoin token cu cel mai mare liquidity (pentru routing)
     * @dev Inspirat din Oxium - routing optimization
     * @return address Bitcoin token cu cel mai mare liquidity (BTCB pe BSC)
     */
    function getMostLiquidBitcoinToken() internal pure returns (address) {
        return BTCB_BSC; // BTCB are cel mai mare liquidity pe BSC
    }
    
    /**
     * @notice Check dacă un pair este un Bitcoin arbitrage pair (WBTC/BTCB)
     * @dev Inspirat din Oxium - arbitrage automation
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @return bool True dacă este arbitrage pair
     */
    function isBitcoinArbitragePair(address tokenIn, address tokenOut) internal pure returns (bool) {
        return areBitcoinEquivalents(tokenIn, tokenOut);
    }
    
    /**
     * @notice Get Bitcoin token pentru promise (prefer BTCB pentru liquidity)
     * @dev Inspirat din Oxium - promised liquidity optimization
     * @param preferredToken Preferred token (WBTC sau BTCB)
     * @return address Bitcoin token pentru promise
     */
    function getBitcoinTokenForPromise(address preferredToken) internal pure returns (address) {
        if (isBitcoinToken(preferredToken)) {
            return preferredToken;
        }
        return getMostLiquidBitcoinToken(); // Default: BTCB
    }
    
    /**
     * @notice Get equivalent Bitcoin token (WBTC ↔ BTCB)
     * @dev Useful pentru routing și arbitrage
     * @param token Bitcoin token (WBTC sau BTCB)
     * @return address Equivalent token (BTCB pentru WBTC, WBTC pentru BTCB)
     */
    function getEquivalentBitcoinToken(address token) internal pure returns (address) {
        if (token == WBTC_BSC) {
            return BTCB_BSC;
        }
        if (token == BTCB_BSC) {
            return WBTC_BSC;
        }
        return address(0); // Not a Bitcoin token
    }
    
    /**
     * @notice Check dacă un token este cel mai lichid Bitcoin token
     * @param token Token de verificat
     * @return bool True dacă token-ul este BTCB (cel mai lichid)
     */
    function isMostLiquidBitcoinToken(address token) internal pure returns (bool) {
        return token == BTCB_BSC;
    }
}

