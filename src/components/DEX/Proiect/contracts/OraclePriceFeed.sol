// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OraclePriceFeed
 * @dev Smart Contract Oracle pentru price feeds on-chain
 * @notice Permite verificarea prețurilor on-chain pentru stop loss și take profit execution
 * @author BitSwapDEX Team
 * @custom:security-contact security@bitswapdex.com
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./constants/BitcoinTokens.sol";
import "./interfaces/IChainlinkPriceFeed.sol";

contract OraclePriceFeed is Ownable, ReentrancyGuard, Pausable {
    
    // ============ STRUCTS & ENUMS ============
    
    /**
     * @notice Price data struct
     */
    struct PriceData {
        uint256 price;              // Price (in USD or base currency, scaled by 1e18)
        uint256 timestamp;          // Block timestamp când price a fost updated
        uint256 confidence;         // Confidence level (0-10000, where 10000 = 100%)
        uint256 sourceCount;        // Number of sources pentru acest price
    }
    
    /**
     * @notice Price source struct
     */
    struct PriceSource {
        address source;             // Address-ul source (Chainlink, Band, custom, etc.)
        bool isActive;              // Dacă source-ul este activ
        uint256 weight;             // Weight pentru aggregation (0-10000, where 10000 = 100%)
        uint256 lastUpdate;         // Last update timestamp
    }
    
    /**
     * @notice Oracle role enum
     */
    enum OracleRole {
        READ_ONLY,  // Poate doar să citească prices
        ORACLE,     // Poate să update prices
        ADMIN       // Full access
    }
    
    // ============ STATE VARIABLES ============
    
    /// @notice Mapping: token address => PriceData
    mapping(address => PriceData) public prices;
    
    /// @notice Mapping: token address => PriceSource[]
    mapping(address => PriceSource[]) public priceSources;
    
    /// @notice Mapping: source address => bool (pentru quick lookup)
    mapping(address => bool) public isPriceSource;
    
    /// @notice Mapping: oracle address => OracleRole
    mapping(address => OracleRole) public oracleRoles;
    
    /// @notice Lista tuturor oracles autorizate
    address[] public authorizedOracles;
    
    /// @notice Minimum confidence level pentru valid price (in basis points)
    uint256 public minConfidenceBps;
    
    /// @notice Maximum price age pentru valid price (in seconds)
    uint256 public maxPriceAge;
    
    /// @notice Minimum number of sources pentru aggregation
    uint256 public minSources;
    
    /// @notice Price deviation threshold pentru updates (in basis points, 100 = 1%)
    uint256 public maxPriceDeviationBps;
    
    /// @notice Chainlink price feed (opțional - pentru mainnet integration)
    address public chainlinkPriceFeed;
    
    /// @notice Chainlink BTC/USD price feed (pentru Bitcoin price)
    address public chainlinkBTCPriceFeed;
    
    /// @notice Band Protocol price feed (opțional - pentru BSC integration)
    address public bandPriceFeed;
    
    /// @notice Base currency address (pentru USD pairs, de obicei USDT/USDC)
    address public baseCurrency;
    
    /// @notice Mapping: token => Chainlink price feed address
    mapping(address => address) public chainlinkPriceFeeds;
    
    // ============ CONSTANTS ============
    
    /// @notice Fee denominator (for precision)
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    /// @notice Maximum number of sources per token
    uint256 public constant MAX_SOURCES = 10;
    
    // ============ EVENTS ============
    
    event PriceUpdated(
        address indexed token,
        uint256 price,
        uint256 timestamp,
        uint256 confidence,
        address indexed source
    );
    
    event PriceSourceAdded(
        address indexed token,
        address indexed source,
        uint256 weight
    );
    
    event PriceSourceRemoved(
        address indexed token,
        address indexed source
    );
    
    event PriceSourceUpdated(
        address indexed token,
        address indexed source,
        bool isActive,
        uint256 weight
    );
    
    event OracleAuthorized(
        address indexed oracle,
        OracleRole role
    );
    
    event OracleRevoked(address indexed oracle);
    
    event MinConfidenceUpdated(uint256 oldConfidence, uint256 newConfidence);
    event MaxPriceAgeUpdated(uint256 oldAge, uint256 newAge);
    event MinSourcesUpdated(uint256 oldMin, uint256 newMin);
    event MaxPriceDeviationUpdated(uint256 oldDeviation, uint256 newDeviation);
    
    event StopLossTriggered(
        address indexed token,
        uint256 stopLossPrice,
        uint256 currentPrice,
        uint256 timestamp
    );
    
    event TakeProfitTriggered(
        address indexed token,
        uint256 takeProfitPrice,
        uint256 currentPrice,
        uint256 timestamp
    );
    
    // ============ MODIFIERS ============
    
    /**
     * @notice Verifică dacă msg.sender este un oracle autorizat
     */
    modifier onlyOracle() {
        require(
            oracleRoles[msg.sender] >= OracleRole.ORACLE,
            "OraclePriceFeed: Not authorized oracle"
        );
        _;
    }
    
    /**
     * @notice Verifică dacă msg.sender este un oracle autorizat sau price source
     */
    modifier onlyOracleOrSource() {
        require(
            oracleRoles[msg.sender] >= OracleRole.ORACLE || isPriceSource[msg.sender],
            "OraclePriceFeed: Not authorized oracle or source"
        );
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Constructor
     * @param _baseCurrency Address-ul base currency (USDT/USDC pentru USD pairs)
     * @param _minConfidenceBps Minimum confidence level (in basis points, 100 = 1%)
     * @param _maxPriceAge Maximum price age (in seconds, e.g., 1 hour = 3600)
     * @param _minSources Minimum number of sources pentru aggregation
     */
    constructor(
        address _baseCurrency,
        uint256 _minConfidenceBps,
        uint256 _maxPriceAge,
        uint256 _minSources
    ) {
        require(_baseCurrency != address(0), "OraclePriceFeed: Invalid base currency");
        require(_minConfidenceBps <= FEE_DENOMINATOR, "OraclePriceFeed: Invalid min confidence");
        require(_maxPriceAge > 0, "OraclePriceFeed: Invalid max price age");
        require(_minSources > 0 && _minSources <= MAX_SOURCES, "OraclePriceFeed: Invalid min sources");
        
        baseCurrency = _baseCurrency;
        minConfidenceBps = _minConfidenceBps;
        maxPriceAge = _maxPriceAge;
        minSources = _minSources;
        maxPriceDeviationBps = 1000; // Default: 10% deviation
        
        // Set owner as ADMIN
        oracleRoles[msg.sender] = OracleRole.ADMIN;
        authorizedOracles.push(msg.sender);
    }
    
    // ============ ORACLE FUNCTIONS ============
    
    /**
     * @notice Update price pentru un token (pentru authorized oracles)
     * @param _token Address-ul token-ului
     * @param _price New price (scaled by 1e18)
     * @param _confidence Confidence level (0-10000, where 10000 = 100%)
     */
    function updatePrice(
        address _token,
        uint256 _price,
        uint256 _confidence
    ) external onlyOracle whenNotPaused nonReentrant {
        require(_token != address(0), "OraclePriceFeed: Invalid token address");
        require(_price > 0, "OraclePriceFeed: Invalid price");
        require(_confidence <= FEE_DENOMINATOR, "OraclePriceFeed: Invalid confidence");
        require(_confidence >= minConfidenceBps, "OraclePriceFeed: Confidence below minimum");
        
        PriceData storage priceData = prices[_token];
        
        // Check price deviation dacă există un price existent
        if (priceData.price > 0 && maxPriceDeviationBps > 0) {
            uint256 deviation = _calculateDeviation(priceData.price, _price);
            require(
                deviation <= maxPriceDeviationBps,
                "OraclePriceFeed: Price deviation too high"
            );
        }
        
        // Update price
        priceData.price = _price;
        priceData.timestamp = block.timestamp;
        priceData.confidence = _confidence;
        priceData.sourceCount = 1; // Single source update
        
        emit PriceUpdated(_token, _price, block.timestamp, _confidence, msg.sender);
    }
    
    /**
     * @notice Update multiple prices (batch update)
     * @param _tokens Array de token addresses
     * @param _prices Array de prices (scaled by 1e18)
     * @param _confidences Array de confidence levels
     */
    function updatePrices(
        address[] memory _tokens,
        uint256[] memory _prices,
        uint256[] memory _confidences
    ) external onlyOracle whenNotPaused nonReentrant {
        require(
            _tokens.length == _prices.length && _prices.length == _confidences.length,
            "OraclePriceFeed: Array length mismatch"
        );
        require(_tokens.length > 0, "OraclePriceFeed: Empty arrays");
        require(_tokens.length <= 50, "OraclePriceFeed: Too many updates"); // Gas limit protection
        
        for (uint256 i = 0; i < _tokens.length; i++) {
            require(_tokens[i] != address(0), "OraclePriceFeed: Invalid token address");
            require(_prices[i] > 0, "OraclePriceFeed: Invalid price");
            require(_confidences[i] <= FEE_DENOMINATOR, "OraclePriceFeed: Invalid confidence");
            require(_confidences[i] >= minConfidenceBps, "OraclePriceFeed: Confidence below minimum");
            
            PriceData storage priceData = prices[_tokens[i]];
            
            // Check price deviation dacă există un price existent
            if (priceData.price > 0 && maxPriceDeviationBps > 0) {
                uint256 deviation = _calculateDeviation(priceData.price, _prices[i]);
                require(
                    deviation <= maxPriceDeviationBps,
                    "OraclePriceFeed: Price deviation too high"
                );
            }
            
            // Update price
            priceData.price = _prices[i];
            priceData.timestamp = block.timestamp;
            priceData.confidence = _confidences[i];
            priceData.sourceCount = 1;
            
            emit PriceUpdated(_tokens[i], _prices[i], block.timestamp, _confidences[i], msg.sender);
        }
    }
    
    /**
     * @notice Aggregate prices din multiple sources
     * @param _token Address-ul token-ului
     * @param _sourcePrices Array de prices din diferite sources
     * @param _sourceWeights Array de weights pentru fiecare source
     */
    function aggregatePrices(
        address _token,
        uint256[] memory _sourcePrices,
        uint256[] memory _sourceWeights
    ) external onlyOracle whenNotPaused nonReentrant {
        require(_token != address(0), "OraclePriceFeed: Invalid token address");
        require(
            _sourcePrices.length == _sourceWeights.length,
            "OraclePriceFeed: Array length mismatch"
        );
        require(_sourcePrices.length >= minSources, "OraclePriceFeed: Insufficient sources");
        require(_sourcePrices.length <= MAX_SOURCES, "OraclePriceFeed: Too many sources");
        
        // Validate weights sum to 100%
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < _sourceWeights.length; i++) {
            totalWeight += _sourceWeights[i];
        }
        require(totalWeight == FEE_DENOMINATOR, "OraclePriceFeed: Invalid weights sum");
        
        // Calculate weighted average price
        uint256 weightedPrice = 0;
        uint256 totalConfidence = 0;
        
        for (uint256 i = 0; i < _sourcePrices.length; i++) {
            require(_sourcePrices[i] > 0, "OraclePriceFeed: Invalid source price");
            require(_sourceWeights[i] > 0, "OraclePriceFeed: Invalid source weight");
            
            weightedPrice += (_sourcePrices[i] * _sourceWeights[i]) / FEE_DENOMINATOR;
            totalConfidence += (_sourceWeights[i] * FEE_DENOMINATOR) / _sourcePrices.length; // Simplified confidence
        }
        
        // Calculate average confidence
        uint256 avgConfidence = totalConfidence / _sourcePrices.length;
        
        // Update aggregated price
        PriceData storage priceData = prices[_token];
        priceData.price = weightedPrice;
        priceData.timestamp = block.timestamp;
        priceData.confidence = avgConfidence;
        priceData.sourceCount = _sourcePrices.length;
        
        emit PriceUpdated(_token, weightedPrice, block.timestamp, avgConfidence, msg.sender);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Get price pentru un token
     * @param _token Address-ul token-ului
     * @return price Price (scaled by 1e18)
     * @return timestamp Timestamp când price a fost updated
     * @return confidence Confidence level (0-10000)
     * @return isValid True dacă price-ul este valid (age < maxPriceAge și confidence >= minConfidence)
     */
    function getPrice(address _token) external view returns (
        uint256 price,
        uint256 timestamp,
        uint256 confidence,
        bool isValid
    ) {
        PriceData memory priceData = prices[_token];
        
        price = priceData.price;
        timestamp = priceData.timestamp;
        confidence = priceData.confidence;
        
        // Check dacă price-ul este valid
        isValid = _isValidPrice(priceData);
        
        return (price, timestamp, confidence, isValid);
    }
    
    /**
     * @notice Get price în USD (folosind base currency)
     * @param _token Address-ul token-ului
     * @return priceUSD Price în USD (scaled by 1e18)
     */
    function getPriceUSD(address _token) external view returns (uint256 priceUSD) {
        // Check dacă este Bitcoin token - folosim BTC price pentru ambele WBTC și BTCB
        if (BitcoinTokens.isBitcoinToken(_token)) {
            return getBitcoinPriceUSD();
        }
        
        PriceData memory priceData = prices[_token];
        require(priceData.price > 0, "OraclePriceFeed: Price not available");
        require(_isValidPrice(priceData), "OraclePriceFeed: Price not valid");
        
        // Dacă token-ul este base currency, return 1 USD (1e18)
        if (_token == baseCurrency) {
            return 1e18;
        }
        
        // În producție, ar trebui să folosim o conversie reală
        // Pentru acum, returnăm price-ul direct (assume că este deja în USD)
        return priceData.price;
    }
    
    /**
     * @notice Get Bitcoin price în USD (pentru WBTC și BTCB)
     * @return priceUSD Bitcoin price în USD (scaled by 1e18)
     */
    function getBitcoinPriceUSD() public view returns (uint256 priceUSD) {
        // Try Chainlink price feed first (dacă e configurat)
        if (chainlinkBTCPriceFeed != address(0)) {
            try this._getChainlinkPrice(chainlinkBTCPriceFeed) returns (uint256 chainlinkPrice) {
                if (chainlinkPrice > 0) {
                    return chainlinkPrice;
                }
            } catch {
                // Chainlink call failed, continue to fallback
            }
        }
        
        // Try to get price from WBTC first (preferred)
        PriceData memory wbtcPrice = prices[BitcoinTokens.WBTC_BSC];
        
        // If WBTC price is valid, use it
        if (wbtcPrice.price > 0 && _isValidPrice(wbtcPrice)) {
            return wbtcPrice.price;
        }
        
        // Fallback to BTCB price
        PriceData memory btcbPrice = prices[BitcoinTokens.BTCB_BSC];
        if (btcbPrice.price > 0 && _isValidPrice(btcbPrice)) {
            return btcbPrice.price;
        }
        
        // If neither is available, revert
        revert("OraclePriceFeed: Bitcoin price not available");
    }
    
    /**
     * @notice Get price from Chainlink price feed (internal)
     * @param _priceFeed Address-ul Chainlink price feed
     * @return price Price în USD (scaled by 1e18)
     */
    function _getChainlinkPrice(address _priceFeed) external view returns (uint256 price) {
        require(msg.sender == address(this), "OraclePriceFeed: Internal function only");
        require(_priceFeed != address(0), "OraclePriceFeed: Invalid price feed address");
        
        IChainlinkPriceFeed priceFeed = IChainlinkPriceFeed(_priceFeed);
        
        // Get latest round data
        (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        
        // Validate round data
        require(answer > 0, "OraclePriceFeed: Invalid Chainlink answer");
        require(updatedAt > 0, "OraclePriceFeed: Invalid Chainlink timestamp");
        require(roundId > 0, "OraclePriceFeed: Invalid Chainlink round");
        
        // Check dacă data e fresh (within maxPriceAge)
        require(
            block.timestamp <= updatedAt + maxPriceAge,
            "OraclePriceFeed: Chainlink price too stale"
        );
        
        // Get decimals
        uint8 decimals = priceFeed.decimals();
        
        // Convert to 18 decimals (standard pentru contract)
        if (decimals == 18) {
            price = uint256(answer);
        } else if (decimals < 18) {
            price = uint256(answer) * (10 ** (18 - decimals));
        } else {
            price = uint256(answer) / (10 ** (decimals - 18));
        }
        
        return price;
    }
    
    /**
     * @notice Update Bitcoin price din Chainlink (pentru keeper sau oracle)
     * @return success True dacă update-ul a fost successful
     */
    function updateBitcoinPriceFromChainlink() external onlyOracle whenNotPaused nonReentrant returns (bool success) {
        require(chainlinkBTCPriceFeed != address(0), "OraclePriceFeed: Chainlink BTC price feed not set");
        
        try this._getChainlinkPrice(chainlinkBTCPriceFeed) returns (uint256 chainlinkPrice) {
            require(chainlinkPrice > 0, "OraclePriceFeed: Invalid Chainlink price");
            
            // Get confidence level (high confidence pentru Chainlink - 95%)
            uint256 confidence = 9500; // 95%
            
            // Update ambele WBTC și BTCB cu același price
            prices[BitcoinTokens.WBTC_BSC].price = chainlinkPrice;
            prices[BitcoinTokens.WBTC_BSC].timestamp = block.timestamp;
            prices[BitcoinTokens.WBTC_BSC].confidence = confidence;
            prices[BitcoinTokens.WBTC_BSC].sourceCount = 1;
            
            prices[BitcoinTokens.BTCB_BSC].price = chainlinkPrice;
            prices[BitcoinTokens.BTCB_BSC].timestamp = block.timestamp;
            prices[BitcoinTokens.BTCB_BSC].confidence = confidence;
            prices[BitcoinTokens.BTCB_BSC].sourceCount = 1;
            
            emit PriceUpdated(BitcoinTokens.WBTC_BSC, chainlinkPrice, block.timestamp, confidence, msg.sender);
            emit PriceUpdated(BitcoinTokens.BTCB_BSC, chainlinkPrice, block.timestamp, confidence, msg.sender);
            
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * @notice Get token pair price (tokenIn/tokenOut)
     * @param _tokenIn Address-ul token-ului de input
     * @param _tokenOut Address-ul token-ului de output
     * @return pairPrice Price ratio (tokenIn/tokenOut, scaled by 1e18)
     */
    function getTokenPairPrice(
        address _tokenIn,
        address _tokenOut
    ) external view returns (uint256 pairPrice) {
        // Get prices (with Bitcoin token support)
        uint256 priceIn = _getTokenPrice(_tokenIn);
        uint256 priceOut = _getTokenPrice(_tokenOut);
        
        require(priceIn > 0, "OraclePriceFeed: TokenIn price not available");
        require(priceOut > 0, "OraclePriceFeed: TokenOut price not available");
        
        // Calculate pair price: tokenIn / tokenOut
        pairPrice = (priceIn * 1e18) / priceOut;
        
        return pairPrice;
    }
    
    /**
     * @notice Get token price (internal helper cu Bitcoin support)
     * @param _token Address-ul token-ului
     * @return price Token price (scaled by 1e18)
     */
    function _getTokenPrice(address _token) internal view returns (uint256 price) {
        // Check dacă este Bitcoin token
        if (BitcoinTokens.isBitcoinToken(_token)) {
            return getBitcoinPriceUSD();
        }
        
        // Get price from storage
        PriceData memory priceData = prices[_token];
        require(priceData.price > 0, "OraclePriceFeed: Price not available");
        require(_isValidPrice(priceData), "OraclePriceFeed: Price not valid");
        
        return priceData.price;
    }
    
    /**
     * @notice Check dacă stop loss a fost triggered
     * @param _token Address-ul token-ului
     * @param _entryPrice Entry price al trade-ului
     * @param _stopLoss Stop loss price
     * @return bool True dacă stop loss a fost triggered
     */
    function checkStopLoss(
        address _token,
        uint256 _entryPrice,
        uint256 _stopLoss
    ) external view returns (bool) {
        require(_token != address(0), "OraclePriceFeed: Invalid token address");
        require(_entryPrice > 0, "OraclePriceFeed: Invalid entry price");
        require(_stopLoss > 0, "OraclePriceFeed: Invalid stop loss");
        require(_stopLoss < _entryPrice, "OraclePriceFeed: Stop loss must be below entry price");
        
        PriceData memory priceData = prices[_token];
        require(priceData.price > 0, "OraclePriceFeed: Price not available");
        require(_isValidPrice(priceData), "OraclePriceFeed: Price not valid");
        
        // Check dacă current price <= stop loss
        return priceData.price <= _stopLoss;
    }
    
    /**
     * @notice Check dacă take profit a fost triggered
     * @param _token Address-ul token-ului
     * @param _entryPrice Entry price al trade-ului
     * @param _takeProfit Take profit price
     * @return bool True dacă take profit a fost triggered
     */
    function checkTakeProfit(
        address _token,
        uint256 _entryPrice,
        uint256 _takeProfit
    ) external view returns (bool) {
        require(_token != address(0), "OraclePriceFeed: Invalid token address");
        require(_entryPrice > 0, "OraclePriceFeed: Invalid entry price");
        require(_takeProfit > 0, "OraclePriceFeed: Invalid take profit");
        require(_takeProfit > _entryPrice, "OraclePriceFeed: Take profit must be above entry price");
        
        PriceData memory priceData = prices[_token];
        require(priceData.price > 0, "OraclePriceFeed: Price not available");
        require(_isValidPrice(priceData), "OraclePriceFeed: Price not valid");
        
        // Check dacă current price >= take profit
        return priceData.price >= _takeProfit;
    }
    
    /**
     * @notice Check dacă price-ul este valid
     * @param _priceData PriceData struct
     * @return bool True dacă price-ul este valid
     */
    function _isValidPrice(PriceData memory _priceData) internal view returns (bool) {
        if (_priceData.price == 0) {
            return false;
        }
        
        if (_priceData.confidence < minConfidenceBps) {
            return false;
        }
        
        if (block.timestamp > _priceData.timestamp + maxPriceAge) {
            return false;
        }
        
        return true;
    }
    
    /**
     * @notice Calculate price deviation (in basis points)
     * @param _oldPrice Old price
     * @param _newPrice New price
     * @return deviation Deviation (in basis points)
     */
    function _calculateDeviation(uint256 _oldPrice, uint256 _newPrice) internal pure returns (uint256 deviation) {
        if (_oldPrice == 0) {
            return 0;
        }
        
        uint256 diff = _oldPrice > _newPrice ? _oldPrice - _newPrice : _newPrice - _oldPrice;
        deviation = (diff * FEE_DENOMINATOR) / _oldPrice;
        
        return deviation;
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @notice Authorize un oracle
     * @param _oracle Address-ul oracle-ului
     * @param _role Oracle role (READ_ONLY, ORACLE, ADMIN)
     */
    function authorizeOracle(address _oracle, OracleRole _role) external onlyOwner {
        require(_oracle != address(0), "OraclePriceFeed: Invalid oracle address");
        require(uint8(_role) <= uint8(OracleRole.ADMIN), "OraclePriceFeed: Invalid role");
        
        if (oracleRoles[_oracle] == OracleRole.READ_ONLY && _role > OracleRole.READ_ONLY) {
            authorizedOracles.push(_oracle);
        }
        
        oracleRoles[_oracle] = _role;
        
        emit OracleAuthorized(_oracle, _role);
    }
    
    /**
     * @notice Revoke oracle authorization
     * @param _oracle Address-ul oracle-ului
     */
    function revokeOracle(address _oracle) external onlyOwner {
        require(oracleRoles[_oracle] != OracleRole.READ_ONLY, "OraclePriceFeed: Oracle not authorized");
        
        oracleRoles[_oracle] = OracleRole.READ_ONLY;
        
        // Remove from authorizedOracles array
        address[] storage oracles = authorizedOracles;
        for (uint256 i = 0; i < oracles.length; i++) {
            if (oracles[i] == _oracle) {
                oracles[i] = oracles[oracles.length - 1];
                oracles.pop();
                break;
            }
        }
        
        emit OracleRevoked(_oracle);
    }
    
    /**
     * @notice Add price source pentru un token
     * @param _token Address-ul token-ului
     * @param _source Address-ul source-ului (Chainlink, Band, custom, etc.)
     * @param _weight Weight pentru aggregation (0-10000, where 10000 = 100%)
     */
    function addPriceSource(
        address _token,
        address _source,
        uint256 _weight
    ) external onlyOwner {
        require(_token != address(0), "OraclePriceFeed: Invalid token address");
        require(_source != address(0), "OraclePriceFeed: Invalid source address");
        require(_weight > 0 && _weight <= FEE_DENOMINATOR, "OraclePriceFeed: Invalid weight");
        require(!isPriceSource[_source], "OraclePriceFeed: Source already exists");
        
        PriceSource[] storage sources = priceSources[_token];
        require(sources.length < MAX_SOURCES, "OraclePriceFeed: Too many sources");
        
        sources.push(PriceSource({
            source: _source,
            isActive: true,
            weight: _weight,
            lastUpdate: 0
        }));
        
        isPriceSource[_source] = true;
        
        emit PriceSourceAdded(_token, _source, _weight);
    }
    
    /**
     * @notice Remove price source
     * @param _token Address-ul token-ului
     * @param _source Address-ul source-ului
     */
    function removePriceSource(address _token, address _source) external onlyOwner {
        PriceSource[] storage sources = priceSources[_token];
        
        for (uint256 i = 0; i < sources.length; i++) {
            if (sources[i].source == _source) {
                sources[i] = sources[sources.length - 1];
                sources.pop();
                isPriceSource[_source] = false;
                emit PriceSourceRemoved(_token, _source);
                break;
            }
        }
    }
    
    /**
     * @notice Update price source
     * @param _token Address-ul token-ului
     * @param _source Address-ul source-ului
     * @param _isActive New active status
     * @param _weight New weight
     */
    function updatePriceSource(
        address _token,
        address _source,
        bool _isActive,
        uint256 _weight
    ) external onlyOwner {
        PriceSource[] storage sources = priceSources[_token];
        
        for (uint256 i = 0; i < sources.length; i++) {
            if (sources[i].source == _source) {
                sources[i].isActive = _isActive;
                sources[i].weight = _weight;
                emit PriceSourceUpdated(_token, _source, _isActive, _weight);
                break;
            }
        }
    }
    
    /**
     * @notice Update min confidence
     * @param _minConfidenceBps New min confidence (in basis points)
     */
    function setMinConfidence(uint256 _minConfidenceBps) external onlyOwner {
        require(_minConfidenceBps <= FEE_DENOMINATOR, "OraclePriceFeed: Invalid confidence");
        uint256 oldConfidence = minConfidenceBps;
        minConfidenceBps = _minConfidenceBps;
        emit MinConfidenceUpdated(oldConfidence, _minConfidenceBps);
    }
    
    /**
     * @notice Update max price age
     * @param _maxAge New max age (in seconds)
     */
    function setMaxPriceAge(uint256 _maxAge) external onlyOwner {
        require(_maxAge > 0, "OraclePriceFeed: Invalid age");
        uint256 oldAge = maxPriceAge;
        maxPriceAge = _maxAge;
        emit MaxPriceAgeUpdated(oldAge, _maxAge);
    }
    
    /**
     * @notice Update min sources
     * @param _minSources New min sources
     */
    function setMinSources(uint256 _minSources) external onlyOwner {
        require(_minSources > 0 && _minSources <= MAX_SOURCES, "OraclePriceFeed: Invalid min sources");
        uint256 oldMin = minSources;
        minSources = _minSources;
        emit MinSourcesUpdated(oldMin, _minSources);
    }
    
    /**
     * @notice Update max price deviation
     * @param _maxDeviationBps New max deviation (in basis points)
     */
    function setMaxPriceDeviation(uint256 _maxDeviationBps) external onlyOwner {
        require(_maxDeviationBps <= 5000, "OraclePriceFeed: Deviation too high"); // Max 50%
        uint256 oldDeviation = maxPriceDeviationBps;
        maxPriceDeviationBps = _maxDeviationBps;
        emit MaxPriceDeviationUpdated(oldDeviation, _maxDeviationBps);
    }
    
    /**
     * @notice Set Chainlink price feed address
     * @param _chainlinkPriceFeed Address-ul Chainlink price feed
     */
    function setChainlinkPriceFeed(address _chainlinkPriceFeed) external onlyOwner {
        chainlinkPriceFeed = _chainlinkPriceFeed;
    }
    
    /**
     * @notice Set Chainlink price feed pentru un token specific
     * @param _token Address-ul token-ului
     * @param _priceFeed Address-ul Chainlink price feed pentru acel token
     */
    function setChainlinkPriceFeedForToken(address _token, address _priceFeed) external onlyOwner {
        require(_token != address(0), "OraclePriceFeed: Invalid token address");
        require(_priceFeed != address(0), "OraclePriceFeed: Invalid price feed address");
        chainlinkPriceFeeds[_token] = _priceFeed;
    }
    
    /**
     * @notice Set Chainlink BTC/USD price feed (pentru Bitcoin)
     * @param _chainlinkBTCPriceFeed Address-ul Chainlink BTC/USD price feed
     * @dev Pe BSC Mainnet: 0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf (BTC/USD)
     * @dev Pe BSC Testnet: 0x5741306c21795FdCBb9b265Ea0255F499DFe515C (BTC/USD)
     */
    function setChainlinkBTCPriceFeed(address _chainlinkBTCPriceFeed) external onlyOwner {
        require(_chainlinkBTCPriceFeed != address(0), "OraclePriceFeed: Invalid price feed address");
        chainlinkBTCPriceFeed = _chainlinkBTCPriceFeed;
        
        // Setup pentru ambele WBTC și BTCB (folosesc același BTC/USD feed)
        chainlinkPriceFeeds[BitcoinTokens.WBTC_BSC] = _chainlinkBTCPriceFeed;
        chainlinkPriceFeeds[BitcoinTokens.BTCB_BSC] = _chainlinkBTCPriceFeed;
    }
    
    /**
     * @notice Set Band Protocol price feed address
     * @param _bandPriceFeed Address-ul Band Protocol price feed
     */
    function setBandPriceFeed(address _bandPriceFeed) external onlyOwner {
        bandPriceFeed = _bandPriceFeed;
    }
    
    /**
     * @notice Set base currency address
     * @param _baseCurrency Address-ul base currency
     */
    function setBaseCurrency(address _baseCurrency) external onlyOwner {
        require(_baseCurrency != address(0), "OraclePriceFeed: Invalid base currency");
        baseCurrency = _baseCurrency;
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
    
    // ============ VIEW FUNCTIONS (Additional) ============
    
    /**
     * @notice Get price sources pentru un token
     * @param _token Address-ul token-ului
     * @return PriceSource[] Lista de price sources
     */
    function getPriceSources(address _token) external view returns (PriceSource[] memory) {
        return priceSources[_token];
    }
    
    /**
     * @notice Get authorized oracles
     * @return address[] Lista de authorized oracles
     */
    function getAuthorizedOracles() external view returns (address[] memory) {
        return authorizedOracles;
    }
    
    /**
     * @notice Check dacă un address este un oracle autorizat
     * @param _oracle Address-ul oracle-ului
     * @return bool True dacă este autorizat
     */
    function isAuthorizedOracle(address _oracle) external view returns (bool) {
        return oracleRoles[_oracle] >= OracleRole.ORACLE;
    }
    
    /**
     * @notice Get oracle role pentru un address
     * @param _oracle Address-ul oracle-ului
     * @return OracleRole Role-ul oracle-ului
     */
    function getOracleRole(address _oracle) external view returns (OracleRole) {
        return oracleRoles[_oracle];
    }
    
    // ============ BITCOIN HELPER FUNCTIONS ============
    
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
     * @notice Setup Bitcoin price feeds (pentru WBTC și BTCB)
     * @param _wbtcPrice WBTC price în USD (scaled by 1e18)
     * @param _btcbPrice BTCB price în USD (scaled by 1e18)
     * @param _confidence Confidence level (0-10000, where 10000 = 100%)
     */
    function setupBitcoinPriceFeeds(
        uint256 _wbtcPrice,
        uint256 _btcbPrice,
        uint256 _confidence
    ) external onlyOracle whenNotPaused nonReentrant {
        require(_wbtcPrice > 0, "OraclePriceFeed: Invalid WBTC price");
        require(_btcbPrice > 0, "OraclePriceFeed: Invalid BTCB price");
        require(_confidence <= FEE_DENOMINATOR, "OraclePriceFeed: Invalid confidence");
        require(_confidence >= minConfidenceBps, "OraclePriceFeed: Confidence below minimum");
        
        // Update WBTC price
        prices[BitcoinTokens.WBTC_BSC] = PriceData({
            price: _wbtcPrice,
            timestamp: block.timestamp,
            confidence: _confidence,
            sourceCount: 1
        });
        
        // Update BTCB price
        prices[BitcoinTokens.BTCB_BSC] = PriceData({
            price: _btcbPrice,
            timestamp: block.timestamp,
            confidence: _confidence,
            sourceCount: 1
        });
        
        emit PriceUpdated(BitcoinTokens.WBTC_BSC, _wbtcPrice, block.timestamp, _confidence, msg.sender);
        emit PriceUpdated(BitcoinTokens.BTCB_BSC, _btcbPrice, block.timestamp, _confidence, msg.sender);
    }
    
    /**
     * @notice Update Bitcoin price (pentru ambele WBTC și BTCB - folosind același BTC price)
     * @param _btcPrice Bitcoin price în USD (scaled by 1e18)
     * @param _confidence Confidence level (0-10000, where 10000 = 100%)
     */
    function updateBitcoinPrice(
        uint256 _btcPrice,
        uint256 _confidence
    ) external onlyOracle whenNotPaused nonReentrant {
        require(_btcPrice > 0, "OraclePriceFeed: Invalid BTC price");
        require(_confidence <= FEE_DENOMINATOR, "OraclePriceFeed: Invalid confidence");
        require(_confidence >= minConfidenceBps, "OraclePriceFeed: Confidence below minimum");
        
        // Update ambele WBTC și BTCB cu același price (BTC price)
        prices[BitcoinTokens.WBTC_BSC].price = _btcPrice;
        prices[BitcoinTokens.WBTC_BSC].timestamp = block.timestamp;
        prices[BitcoinTokens.WBTC_BSC].confidence = _confidence;
        
        prices[BitcoinTokens.BTCB_BSC].price = _btcPrice;
        prices[BitcoinTokens.BTCB_BSC].timestamp = block.timestamp;
        prices[BitcoinTokens.BTCB_BSC].confidence = _confidence;
        
        emit PriceUpdated(BitcoinTokens.WBTC_BSC, _btcPrice, block.timestamp, _confidence, msg.sender);
        emit PriceUpdated(BitcoinTokens.BTCB_BSC, _btcPrice, block.timestamp, _confidence, msg.sender);
    }
    
    /**
     * @notice Check dacă un pair este un Bitcoin pair
     * @param _tokenIn Address-ul token-ului de input
     * @param _tokenOut Address-ul token-ului de output
     * @return bool True dacă cel puțin un token este Bitcoin token
     */
    function isBitcoinPair(address _tokenIn, address _tokenOut) external pure returns (bool) {
        return BitcoinTokens.isBitcoinToken(_tokenIn) || BitcoinTokens.isBitcoinToken(_tokenOut);
    }
}

