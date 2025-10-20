# 🔗 Mind Mirror NFT - Deployment Guide

## 📋 Overview

This guide will help you deploy the Mind Mirror NFT system that allows users to:
- Generate unique neuropsychological NFTs with DALL-E
- Mint them as real blockchain NFTs (ERC-721)
- Transfer NFTs to other wallet addresses
- Store metadata permanently on IPFS

## 🚀 Step 1: Deploy NFT Smart Contract

### 1.1 Contract Location
The Solidity contract is located at: `contracts/MindMirrorNFT.sol`

### 1.2 Deploy to BSC Testnet

1. **Using Hardhat:**
```bash
npx hardhat run scripts/deploy-mind-nft.js --network bscTestnet
```

2. **Using Remix IDE:**
   - Open `contracts/MindMirrorNFT.sol` in Remix
   - Compile with Solidity version `^0.8.19`
   - Connect MetaMask to BSC Testnet
   - Deploy with constructor parameters:
     - `name`: "BitSwapDEX Mind Mirror NFT"
     - `symbol`: "MINDNFT"

3. **Using Truffle:**
```bash
truffle migrate --network bscTestnet
```

### 1.3 Update Contract Address

After deployment, update the contract address in:
```javascript
// src/contract/MindMirrorNFT.js
export const MIND_MIRROR_NFT_CONFIG = {
  testnet: {
    address: "YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE", // Replace this
    name: "MindMirrorNFT",
    symbol: "MINDNFT"
  }
};
```

## 📦 Step 2: IPFS Setup (Pinata)

### 2.1 Create Pinata Account
1. Go to [https://pinata.cloud/](https://pinata.cloud/)
2. Create a free account
3. Verify your email

### 2.2 Generate API Keys
1. Go to **API Keys** section in Pinata dashboard
2. Click **New Key**
3. Select permissions:
   - ✅ **pinFileToIPFS**
   - ✅ **pinJSONToIPFS**
4. Copy the **API Key** and **API Secret**

### 2.3 Environment Configuration

Add to your `.env` file:
```bash
# IPFS/Pinata Configuration for NFT Metadata Storage
REACT_APP_PINATA_API_KEY=your_pinata_api_key_here
REACT_APP_PINATA_SECRET_KEY=your_pinata_secret_key_here

# Backend URL (if different from default)
REACT_APP_BACKEND_URL=https://backend-server-f82y.onrender.com
```

## 🔧 Step 3: Testing the System

### 3.1 Connect Wallet
1. Go to `http://localhost:3000/mind-mirror`
2. Connect your MetaMask wallet
3. Switch to BSC Testnet
4. Ensure you have some BNB for gas fees

### 3.2 Generate NFT
1. Complete the neuropsychological analysis
2. Generate the DALL-E NFT image
3. You should see two options:
   - **Download Image** (traditional way)
   - **🔨 Mint as NFT** (new blockchain option)

### 3.3 Test Minting
1. Click **"🔨 Mint as NFT"**
2. Confirm the transaction in MetaMask
3. Wait for confirmation
4. You should see success message with Token ID

### 3.4 Test Transfer
1. After minting, click **"🔄 Transfer NFT"**
2. Enter recipient wallet address
3. Confirm transfer
4. Check transaction on BSCScan

## 🛠️ Troubleshooting

### Contract Not Deployed Error
```
Error: Mind Mirror NFT contract not deployed yet
```
**Solution:** Update `MIND_MIRROR_NFT_CONFIG.testnet.address` with your deployed contract address.

### IPFS Upload Failed
```
Error: Image upload failed: 401
```
**Solution:** Check your Pinata API keys in `.env` file.

### RPC Errors
```
Error: missing trie node
```
**Solution:** The system has robust RPC fallback. Wait a few seconds and try again.

### MetaMask Connection Issues
**Solution:** 
1. Switch to BSC Testnet
2. Import BSC Testnet if not available:
   - Network Name: BSC Testnet
   - RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545/
   - Chain ID: 97
   - Currency Symbol: BNB

## 📊 Monitoring

### View NFT on BSCScan
```
https://testnet.bscscan.com/token/YOUR_CONTRACT_ADDRESS
```

### View Transaction
```
https://testnet.bscscan.com/tx/TRANSACTION_HASH
```

### Check IPFS Metadata
```
https://gateway.pinata.cloud/ipfs/IPFS_HASH
```

## 🔒 Security Considerations

### 1. Environment Variables
- Never commit `.env` file to git
- Use different keys for testnet vs mainnet
- Rotate API keys regularly

### 2. Smart Contract Security
- The contract uses OpenZeppelin libraries (audited)
- Includes standard ERC-721 security features
- Owner-only functions for emergency management

### 3. IPFS Storage
- Pinata provides redundant storage
- Metadata is permanently stored
- Images are stored with content addressing

## 🌐 Mainnet Deployment

### When Ready for Production:

1. **Deploy to BSC Mainnet:**
```bash
npx hardhat run scripts/deploy-mind-nft.js --network bscMainnet
```

2. **Update Config:**
```javascript
export const MIND_MIRROR_NFT_CONFIG = {
  mainnet: {
    address: "MAINNET_CONTRACT_ADDRESS",
    name: "MindMirrorNFT",
    symbol: "MINDNFT"
  }
};
```

3. **Use Production IPFS Keys:**
   - Create separate Pinata account for production
   - Use dedicated API keys
   - Consider paid plan for higher limits

## 📈 Features Implemented

✅ **ERC-721 NFT Contract**
- Standard compliant NFT functionality
- Custom Mind Mirror metadata storage
- Transfer and ownership tracking

✅ **IPFS Integration**
- Permanent metadata storage
- Image hosting on distributed network
- Pinata for reliable pinning

✅ **React UI Components**
- Mint NFT button with confirmation
- Transfer modal with address validation
- Transaction status and BSCScan links

✅ **Error Handling**
- RPC failover system
- User-friendly error messages
- Automatic retry logic

## 🎯 Next Steps

1. **Test thoroughly on testnet**
2. **Deploy to mainnet when ready**
3. **Consider adding NFT marketplace integration**
4. **Add NFT collection features**
5. **Implement batch operations**

---

**🚀 Your Mind Mirror NFTs are now ready for blockchain deployment!**

Users can now:
- Create unique AI-generated neuropsychological NFTs
- Mint them as real blockchain assets
- Transfer them to other wallets
- Trade them on NFT marketplaces

The system combines AI creativity with blockchain permanence! 🎨⛓️

