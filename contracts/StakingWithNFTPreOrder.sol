// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title StakingWithNFTPreOrder
 * @dev Extended staking contract that allows users to pre-authorize NFT purchases
 * Users can approve both staking AND future NFT purchases in a single transaction
 */
contract StakingWithNFTPreOrder is Ownable, ReentrancyGuard {
    
    IERC20 public bitsToken;
    IERC721 public mindNFTContract;
    
    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 lockPeriod;
        bool withdrawn;
        uint256 apr;
    }
    
    struct NFTPreOrder {
        uint256 nftTokenId;
        uint256 price;
        uint256 executionDate;
        bool executed;
        bool cancelled;
        address seller;
    }
    
    // User staking data
    mapping(address => StakeInfo[]) public userStakes;
    
    // User NFT pre-orders
    mapping(address => NFTPreOrder[]) public userNFTPreOrders;
    
    // Global NFT pre-order counter
    uint256 public nextPreOrderId;
    mapping(uint256 => NFTPreOrder) public preOrders;
    mapping(uint256 => address) public preOrderBuyer;
    
    // Events
    event StakeCreated(address indexed user, uint256 amount, uint256 lockPeriod);
    event NFTPreOrderCreated(
        address indexed buyer, 
        uint256 indexed preOrderId,
        uint256 nftTokenId,
        uint256 price,
        uint256 executionDate
    );
    event NFTPreOrderExecuted(
        address indexed buyer,
        uint256 indexed preOrderId,
        uint256 nftTokenId,
        uint256 price
    );
    event NFTPreOrderCancelled(address indexed buyer, uint256 indexed preOrderId);
    
    constructor(address _bitsToken, address _mindNFTContract) {
        bitsToken = IERC20(_bitsToken);
        mindNFTContract = IERC721(_mindNFTContract);
    }
    
    /**
     * @dev Stake tokens AND create NFT pre-order in single transaction
     * @param stakeAmount Amount of BITS to stake
     * @param lockPeriod Lock period for staking
     * @param nftTokenId NFT token ID to pre-order
     * @param nftPrice Price to pay for NFT (in BITS)
     * @param executionDate When to execute NFT purchase (unix timestamp)
     */
    function stakeAndPreOrderNFT(
        uint256 stakeAmount,
        uint256 lockPeriod,
        uint256 nftTokenId,
        uint256 nftPrice,
        uint256 executionDate,
        address nftSeller
    ) external nonReentrant {
        require(stakeAmount > 0, "Invalid stake amount");
        require(executionDate > block.timestamp, "Execution date must be in future");
        require(executionDate <= block.timestamp + 365 days, "Max 1 year in future");
        require(nftSeller != address(0), "Invalid seller address");
        
        // Execute staking
        require(bitsToken.transferFrom(msg.sender, address(this), stakeAmount), "Staking transfer failed");
        
        // Create stake record
        userStakes[msg.sender].push(StakeInfo({
            amount: stakeAmount,
            startTime: block.timestamp,
            lockPeriod: lockPeriod,
            withdrawn: false,
            apr: 2000 // 20% APR (same as existing staking)
        }));
        
        // Create NFT pre-order
        uint256 preOrderId = nextPreOrderId++;
        
        preOrders[preOrderId] = NFTPreOrder({
            nftTokenId: nftTokenId,
            price: nftPrice,
            executionDate: executionDate,
            executed: false,
            cancelled: false,
            seller: nftSeller
        });
        
        preOrderBuyer[preOrderId] = msg.sender;
        userNFTPreOrders[msg.sender].push(preOrders[preOrderId]);
        
        emit StakeCreated(msg.sender, stakeAmount, lockPeriod);
        emit NFTPreOrderCreated(msg.sender, preOrderId, nftTokenId, nftPrice, executionDate);
    }
    
    /**
     * @dev Execute NFT pre-order (can be called by anyone after execution date)
     * @param preOrderId Pre-order ID to execute
     */
    function executeNFTPreOrder(uint256 preOrderId) external nonReentrant {
        NFTPreOrder storage preOrder = preOrders[preOrderId];
        address buyer = preOrderBuyer[preOrderId];
        
        require(!preOrder.executed, "Pre-order already executed");
        require(!preOrder.cancelled, "Pre-order cancelled");
        require(block.timestamp >= preOrder.executionDate, "Execution date not reached");
        
        // Check if buyer has enough BITS
        uint256 buyerBalance = bitsToken.balanceOf(buyer);
        require(buyerBalance >= preOrder.price, "Insufficient BITS balance");
        
        // Check if seller still owns the NFT
        require(mindNFTContract.ownerOf(preOrder.nftTokenId) == preOrder.seller, "Seller no longer owns NFT");
        
        // Execute payment: buyer -> seller
        require(bitsToken.transferFrom(buyer, preOrder.seller, preOrder.price), "Payment failed");
        
        // Transfer NFT: seller -> buyer  
        mindNFTContract.safeTransferFrom(preOrder.seller, buyer, preOrder.nftTokenId);
        
        // Mark as executed
        preOrder.executed = true;
        
        emit NFTPreOrderExecuted(buyer, preOrderId, preOrder.nftTokenId, preOrder.price);
    }
    
    /**
     * @dev Cancel NFT pre-order (only buyer can cancel)
     * @param preOrderId Pre-order ID to cancel
     */
    function cancelNFTPreOrder(uint256 preOrderId) external {
        require(preOrderBuyer[preOrderId] == msg.sender, "Only buyer can cancel");
        
        NFTPreOrder storage preOrder = preOrders[preOrderId];
        require(!preOrder.executed, "Cannot cancel executed order");
        require(!preOrder.cancelled, "Already cancelled");
        
        preOrder.cancelled = true;
        
        emit NFTPreOrderCancelled(msg.sender, preOrderId);
    }
    
    /**
     * @dev Get user's NFT pre-orders
     * @param user User address
     */
    function getUserNFTPreOrders(address user) external view returns (NFTPreOrder[] memory) {
        return userNFTPreOrders[user];
    }
    
    /**
     * @dev Check if pre-order can be executed
     * @param preOrderId Pre-order ID
     */
    function canExecutePreOrder(uint256 preOrderId) external view returns (bool, string memory) {
        NFTPreOrder storage preOrder = preOrders[preOrderId];
        address buyer = preOrderBuyer[preOrderId];
        
        if (preOrder.executed) return (false, "Already executed");
        if (preOrder.cancelled) return (false, "Cancelled");
        if (block.timestamp < preOrder.executionDate) return (false, "Execution date not reached");
        
        uint256 buyerBalance = bitsToken.balanceOf(buyer);
        if (buyerBalance < preOrder.price) return (false, "Insufficient buyer balance");
        
        if (mindNFTContract.ownerOf(preOrder.nftTokenId) != preOrder.seller) {
            return (false, "Seller no longer owns NFT");
        }
        
        return (true, "Ready for execution");
    }
    
    /**
     * @dev Get all executable pre-orders (for automation)
     */
    function getExecutablePreOrders() external view returns (uint256[] memory) {
        uint256[] memory executableIds = new uint256[](nextPreOrderId);
        uint256 count = 0;
        
        for (uint256 i = 0; i < nextPreOrderId; i++) {
            (bool canExecute,) = this.canExecutePreOrder(i);
            if (canExecute) {
                executableIds[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = executableIds[i];
        }
        
        return result;
    }
    
    // Standard staking functions (same as existing contract)
    function getUserStakes(address user) external view returns (StakeInfo[] memory) {
        return userStakes[user];
    }
    
    function withdraw(uint256 stakeIndex) external nonReentrant {
        StakeInfo storage stake = userStakes[msg.sender][stakeIndex];
        require(!stake.withdrawn, "Already withdrawn");
        require(block.timestamp >= stake.startTime + stake.lockPeriod, "Still locked");
        
        // Calculate rewards (simplified)
        uint256 reward = (stake.amount * stake.apr * stake.lockPeriod) / (365 days * 10000);
        uint256 totalAmount = stake.amount + reward;
        
        stake.withdrawn = true;
        
        require(bitsToken.transfer(msg.sender, totalAmount), "Transfer failed");
    }
}

