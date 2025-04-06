# Blockchain-Powered AI Joke Generator

A modern web application that generates jokes using AI while leveraging blockchain technology for a secure and transparent experience. Built with Next.js, React, TypeScript, and Ethereum smart contracts.

## Features

- Generate various types of jokes with AI
- Blockchain integration with smart contracts
- ERC20 token economy (Mippy Tokens)
- Wallet connection with Sepolia testnet
- Token purchase with ETH deposits
- Transaction-based joke generation
- Modern, responsive UI with shadcn components

## Prerequisites

- Node.js (version 18 or higher)
- npm or pnpm package manager
- MetaMask or other Ethereum wallet with Sepolia testnet ETH
- Sepolia testnet configured in your wallet

## Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/joke-generator-blockchain.git
cd joke-generator-blockchain
```

2. Install dependencies
```bash
pnpm install # or npm install
```

3. Add environment file
```bash
# create a .env.local file
touch .env.local
# add these variables to it:
VENICE_API_KEY=your_venice_api_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

## Running the Application

1. Start the development server
```bash
pnpm dev # or npm run dev
```

2. Open your browser and navigate to `http://localhost:3000`

## How It Works

This application integrates blockchain technology with AI to create a token-based joke generation system:

### Blockchain Integration

1. **Connect Your Wallet**: 
   - Connect your Sepolia testnet wallet using the button in the navigation bar
   - This allows you to interact with our smart contracts

2. **Deposit ETH for Mippy Tokens** (Required):
   - Click on the Mippy balance button in the navigation bar
   - Deposit Sepolia ETH to receive Mippy tokens at a fixed rate
   - These tokens are used to pay for joke generation
   - **Important**: You must have Mippy tokens to access the joke generator page

3. **Generate Jokes with Tokens**:
   - Each joke generation costs Mippy tokens
   - The cost varies based on joke complexity (length, format, creativity)
   - If you don't have enough tokens, you'll be redirected to the deposit page

4. **Smart Contract Flow**:
   - First, approve the AIModelQueryTool contract to spend your Mippy tokens
   - Then, the contract deducts tokens for your joke request
   - Only after blockchain transaction confirmation will your joke be generated

### Smart Contracts

This project uses three main smart contracts deployed on the Sepolia testnet:

- **DepositManager** (`0xFF000Ac34DC506E10cb4116Ddaab336150aB96e9`): 
  - Handles deposits of Sepolia ETH
  - Mints Mippy tokens to your wallet

- **MippyToken** (`0x121f6CD61DE0839a14823B97d751698013811d6f`): 
  - ERC20 token used for payments within the system

- **AIModelQueryTool** (`0x162857970E8807D706DAF3F0CA5aD2443F5A14f1`): 
  - Handles token payments for AI model queries

## Project Structure

```
joke-generator-blockchain/
├── app/            # Next.js app directory with pages
├── components/     # React components for UI
├── hooks/          # Custom React hooks for blockchain interaction
├── public/         # Static assets and contract artifacts (ABIs)
│   └── artifacts/  # Smart contract ABIs
├── config/         # Configuration including contract addresses
├── lib/            # Utility functions
├── styles/         # CSS and styling files
├── types/          # TypeScript type definitions
└── actions/        # Server actions for API calls
```

## Using the Application

1. **Connect Wallet**:
   - Click "Connect Wallet" in the navigation bar
   - Select your wallet provider (MetaMask recommended)
   - Ensure you're connected to Sepolia testnet

2. **Get Mippy Tokens**:
   - Click on your balance in the navigation bar
   - Enter amount of ETH to deposit
   - Confirm the transaction in your wallet

3. **Generate Jokes**:
   - Navigate to the Joke Generator page
   - Configure your joke parameters (type, tone, topic)
   - If this is your first time, click "Approve MIPPY" to authorize token spending
   - After approval, click "Generate Joke"
   - Confirm the transaction in your wallet
   - After blockchain confirmation, your joke will be generated and displayed

4. **View Transaction History**:
   - All transactions are recorded on the Sepolia blockchain
   - You can view them in your wallet or a blockchain explorer

## Built With

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- wagmi & viem for Ethereum interactions
- Rainbow Kit for wallet connection
- shadcn/ui components
- Venice API for AI generation

## Troubleshooting

- **Wallet Connection Issues**: Ensure you're using the Sepolia testnet
- **Transaction Failures**: Check that you have sufficient Sepolia ETH for gas fees
- **Approval Not Working**: Try refreshing the page and reconnecting your wallet
- **Infinite Loading**: If a transaction gets stuck, it will auto-reset after 15 seconds
- **Can't Access Joke Generator**: You need to have Mippy tokens in your wallet to access the joke generator page. If you're redirected to the home page, deposit ETH to get tokens first.

## License

MIT License
