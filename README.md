# TipPost - Pay-to-Like Social Platform

A decentralized social platform where users can post images with captions and receive ETH tips from supporters who like their posts.

## Smart Contract (Sepolia Testnet)

- **Contract Address**: `0x03E28a7d79Ee43868Ac22112359998aD0f747Ab8`
- **Network**: Sepolia Testnet (Chain ID: 11155111)
- **Etherscan**: `https://sepolia.infura.io/v3/a540faf28bf9416b98dbac1fd2421af3`

## Frontend

- **Live URL**: `https://midterms-cryptography.vercel.app/`

## Tech Stack

- **Smart Contract**: Solidity 0.8.20, Hardhat
- **Frontend**: React 18, Vite, TypeScript, ethers.js v6
- **Wallet**: MetaMask

## Running Locally

### Smart Contract

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Sepolia (requires .env setup)
npx hardhat run scripts/deploy.ts --network sepolia
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_CONTRACT_ADDRESS=your_contract_address" > .env

# Run development server
npm run dev

# Build for production
npm run build
```

## Getting Sepolia ETH (Faucets)

- https://cloud.google.com/application/web3/faucet/ethereum/sepolia
- https://sepoliafaucet.com
- https://www.infura.io/faucet/sepolia

## Features

- Connect MetaMask wallet
- Network guard (automatically prompts to switch to Sepolia)
- Create posts with image URL and caption
- View post feed with all posts
- Like posts with 0.0001 ETH tip
- Real-time updates via contract events
- View total earnings from tips

## Contract Functions

- `createPost(string imageUrl, string caption)` - Create a new post
- `likePost(uint256 postId)` - Like a post (payable: 0.0001 ETH)
- `getAllPosts()` - Get all posts as array
- `checkLiked(uint256 postId, address user)` - Check if user has liked
- `totalEarnedByUser(address user)` - Get user's total earnings

## Security Notes

- Never commit private keys or secrets to version control
- Always use .env files and add them to .gitignore
- Use separate wallet for development with testnet funds only
- Like cost is only 0.0001 ETH (~$0.03 on Sepolia)

## Cost Breakdown (Sepolia Testnet)

- Deploy contract: ~0.003 ETH gas (one-time)
- Create a post: ~0.001 ETH gas
- Like a post: 0.0001 ETH tip + ~0.0005 ETH gas
