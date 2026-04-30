// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IChainlinkPriceFeed
 * @dev Interface pentru Chainlink Price Feed (AggregatorV3Interface)
 * @notice Standard Chainlink price feed interface pentru integrare cu OraclePriceFeed
 */

interface IChainlinkPriceFeed {
    /**
     * @notice Get latest round data
     * @return roundId Round ID
     * @return answer Price answer
     * @return startedAt Timestamp când round-ul a început
     * @return updatedAt Timestamp când round-ul a fost updated
     * @return answeredInRound Round ID în care a fost răspunsul
     */
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
    
    /**
     * @notice Get decimals pentru price feed
     * @return uint8 Number of decimals
     */
    function decimals() external view returns (uint8);
    
    /**
     * @notice Get description pentru price feed
     * @return string Description
     */
    function description() external view returns (string memory);
}

