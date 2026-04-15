# TipPost - Pay-to-Like Social Platform

A decentralized social platform where users can post images with captions and receive ETH tips from supporters who like their posts.

## Smart Contract (Sepolia Testnet)

- **Contract Address**: `TODO: Add after deployment`
- **Network**: Sepolia Testnet (Chain ID: 11155111)
- **Etherscan**: `TODO: Add after deployment`

## Frontend

- **Live URL**: `TODO: Add after Vercel deployment`

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

## Project Structure

```
/
├── contracts/
│   └── TipPost.sol         # Smart contract
├── test/
│   └── TipPost.ts         # Hardhat tests
├── scripts/
│   └── deploy.ts          # Deployment script
├── hardhat.config.cjs     # Hardhat config
├── frontend/             # React frontend
│   ├── src/
│   │   ├── App.tsx      # Main component
│   │   ├── abi/         # Contract ABI
│   │   └── types.ts     # TypeScript types
│   ├── .env             # Environment vars
│   └── vite.config.ts    # Vite config
└── README.md
```

## Security Notes

- Never commit private keys or secrets to version control
- Always use .env files and add them to .gitignore
- Use separate wallet for development with testnet funds only
- Like cost is only 0.0001 ETH (~$0.03 on Sepolia)

## Submission Checklist

- [ ] GitHub repository link (public)
- [ ] **Live frontend URL**: `TODO: Add Vercel/Netlify URL`
- [ ] **Deployed contract address**: `TODO: Add Sepolia address`
- [ ] Screenshots showing:
  - [ ] Live URL open in browser with MetaMask connected on Sepolia
  - [ ] A post created with an image visible on the feed
  - [ ] A like transaction confirmed in MetaMask (showing 0.0001 ETH)
  - [ ] Like count and earnings updated after the transaction
  - [ ] Double-like attempt blocked (error message)
  - [ ] `npx hardhat test` screenshot (all tests passing)
- [ ] README with local setup instructions and deployed links

## Test Results

```
TipPost
  createPost
    ✔ should create a post and emit PostCreated event
    ✔ should revert with empty image URL
    ✔ should revert with empty caption
  likePost
    ✔ should allow user to like a post and transfer ETH to creator
    ✔ should reject double likes from the same user
    ✔ should reject self-liking
    ✔ should reject likes with insufficient ETH
    ✔ should reject likes on non-existent posts
  getAllPosts
    ✔ should return all posts as an array
  checkLiked
    ✔ should return false for unliked post
    ✔ should return true after liking

  11 passing (1s)
```

## Cost Breakdown (Sepolia Testnet)

- Deploy contract: ~0.003 ETH gas (one-time)
- Create a post: ~0.001 ETH gas
- Like a post: 0.0001 ETH tip + ~0.0005 ETH gas