# 📖 ChainMind User Guide

## 🎯 Welcome to ChainMind

This comprehensive guide will walk you through every aspect of using ChainMind, the decentralized AI training marketplace.

## 🚀 Getting Started

### 📋 Prerequisites
- **Web3 Wallet**: MetaMask, WalletConnect, or compatible wallet with Polygon support
- **Cryptocurrency**: POL tokens for gas fees and payments
- **Polygon Network**: Add Polygon network to your wallet
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

### 🔗 Account Setup

#### 1. Connect Your Wallet
1. Visit [chainmind](https://chainmind.up.railway.app/)
2. Click **"Connect Wallet"** in the top-right corner
3. Select your preferred wallet (MetaMask recommended)
4. Approve the connection request
5. Your wallet address will appear in the navigation bar

#### 2. Network Configuration
Ensure your wallet is connected to the correct Polygon network:
- **Mainnet**: Polygon Mainnet (Chain ID: 137) for production use
- **Testnet**: Polygon Amoy Testnet (Chain ID: 80002) for testing

**Adding Polygon to MetaMask:**
```
Network Name: Polygon Mainnet
RPC URL: https://polygon-rpc.com/
Chain ID: 137
Symbol: POL
Block Explorer: https://polygonscan.com/
```

**Adding Polygon Amoy Testnet:**
```
Network Name: Polygon Amoy Testnet
RPC URL: https://rpc-amoy.polygon.technology/
Chain ID: 80002
Symbol: POL
Block Explorer: https://amoy.polygonscan.com/
```

---

## 🧠 For AI/ML Engineers

### 🔍 Finding GPU Providers

#### 1. Browse the Marketplace
- Navigate to the **"Marketplace"** tab
- View available GPU providers in grid or list format
- Use filters to narrow down options:
  - **GPU Model**: RTX 4090, A100, H100, etc.
  - **Memory**: 16GB, 24GB, 40GB, 80GB
  - **Location**: Select regions for lower latency
  - **Price Range**: Set your budget constraints
  - **Availability**: Show only online providers

#### 2. Provider Information
Each provider card displays:
- **GPU Specifications**: Model, memory, compute capability
- **Pricing**: Hourly rate in POL tokens or USD
- **Reputation Score**: Community rating out of 5 stars
- **Location**: Geographic region
- **Uptime**: Availability percentage
- **Response Time**: Average connection latency
- **Polygon Benefits**: Ultra-low transaction fees

### 📤 Submitting Training Jobs

#### 1. Job Submission Wizard
Click **"Submit New Job"** to open the multi-step wizard:

**Step 1: Dataset Upload**
- Drag and drop your training dataset
- Supported formats: ZIP, TAR.GZ, individual files
- Files are encrypted and stored on IPFS
- Maximum size: 10GB per job

**Step 2: Training Configuration**
```yaml
# Example configuration
model_type: "pytorch"
framework: "transformers"
epochs: 10
batch_size: 32
learning_rate: 0.001
optimizer: "adam"
```

**Step 3: Resource Requirements**
- **GPU Memory**: Minimum required VRAM
- **Compute Hours**: Estimated training time
- **Storage**: Dataset and output storage needs

**Step 4: Budget & Timeline**
- **Maximum Budget**: Total amount willing to spend
- **Deadline**: When you need results
- **Auto-extend**: Allow job to continue if needed

#### 2. Escrow Creation
- Review job details and total cost
- Approve the Polygon escrow smart contract transaction
- Funds are locked until job completion
- Gas fees: ~$0.002-0.005 in POL (ultra-low Polygon fees)
- Transaction confirmation: 2-3 seconds on Polygon

### 📊 Monitoring Your Jobs

#### Real-time Dashboard
- **Job Progress**: Visual progress bar and metrics
- **Live Logs**: Real-time training output
- **Resource Usage**: GPU/CPU/Memory utilization
- **Cost Tracking**: Running expenses and estimates

#### Communication
- **Direct Chat**: Message your provider
- **Status Updates**: Automatic notifications
- **Issue Reporting**: Flag problems immediately

### ✅ Job Completion

#### 1. Results Download
- Receive notification when training completes
- Download trained models and logs
- Files are available for 30 days

#### 2. Provider Rating
- Rate your experience (1-5 stars)
- Leave detailed feedback
- Help build provider reputation

---

## 💻 For GPU Providers

### 🖥️ Hardware Registration

#### 1. Provider Setup
Navigate to **"Become a Provider"** section:

**Hardware Verification**
- Run our GPU benchmarking tool
- Submit hardware specifications
- Verify ownership with signed message
- Wait for approval (usually 24-48 hours)

**Pricing Strategy**
- Set competitive hourly rates
- Enable dynamic pricing (recommended)
- Set availability schedules
- Configure auto-bidding rules

#### 2. Staking Requirements
- **Minimum Stake**: 100 POL tokens (low barrier to entry)
- **CMT Token Staking**: 1,000 CMT tokens for additional benefits
- **Reputation Bonus**: Higher stakes = better visibility
- **Slashing Risk**: Stakes can be reduced for poor performance
- **Polygon Advantages**: Instant staking/unstaking with low fees

### 🎯 Managing Jobs

#### 1. Job Bidding
- Receive real-time job notifications
- Review job requirements and budget
- Submit competitive bids
- Auto-accept jobs matching your criteria

#### 2. Job Execution
- Secure containerized environment setup
- Automated dataset download from IPFS
- Real-time progress reporting
- Secure result upload

#### 3. Earnings Management
- View real-time earnings dashboard
- Automatic payment upon job completion
- Withdraw funds to your wallet anytime
- Track performance metrics

---

## 💰 Payments & Escrow System

### 🔒 How Escrow Works

1. **Job Creation**: Client creates escrow with full payment
2. **Funds Locked**: Smart contract holds funds securely
3. **Job Execution**: Provider begins work
4. **Completion**: Results delivered and verified
5. **Release**: Funds automatically released to provider

### 💳 Payment Methods
- **POL Tokens**: Primary payment currency on Polygon
- **CMT Tokens**: Platform tokens with discounts
- **Stablecoins**: USDC, DAI on Polygon (coming soon)
- **Instant Settlements**: 2-3 second transaction finality

### 🔄 Refund Policy
- **Automatic Refunds**: If job exceeds deadline
- **Dispute Process**: Mediation for disagreements
- **Partial Refunds**: For incomplete work

---

## 🏆 Reputation System

### ⭐ Rating System
- **5-Star Scale**: Standard rating system
- **Detailed Reviews**: Written feedback encouraged
- **Verified Ratings**: Only from completed jobs
- **Historical Data**: Full rating history visible

### 📈 Reputation Factors
- **Average Rating**: Primary reputation metric
- **Completion Rate**: Percentage of successful jobs
- **Response Time**: Speed of communication
- **Stake Amount**: Higher stakes boost reputation

---

## 🔧 Troubleshooting

### ❗ Common Issues

**Wallet Connection Problems**
- Clear browser cache and cookies
- Try different browser or incognito mode
- Update MetaMask to latest version
- Check network connectivity

**Job Submission Failures**
- Ensure sufficient ETH for gas fees
- Verify dataset format compatibility
- Check file size limits (10GB max)
- Try uploading smaller batches

**Payment Issues**
- Confirm wallet has sufficient balance
- Check gas price recommendations
- Verify network congestion status
- Contact support for stuck transactions

### 🆘 Getting Help

**Support Channels**
- **Discord**: Real-time community support
- **Documentation**: Comprehensive guides
- **Email**: hello@chainmind.ai
- **Ticket System**: Formal issue tracking

**Emergency Contacts**
- **Urgent Issues**: Use emergency contact form
- **Lost Funds**: Dispute resolution process
- **Technical Problems**: Developer support channel

---

## 🔐 Security Best Practices

### 🛡️ Wallet Security
- **Hardware Wallets**: Use Ledger or Trezor for large amounts
- **Private Keys**: Never share your private keys
- **Phishing**: Always verify URLs before connecting
- **Backups**: Secure your seed phrases

### 🔒 Data Protection
- **Encryption**: All data encrypted in transit and storage
- **Access Control**: Fine-grained permissions
- **Privacy**: No personal data stored unnecessarily
- **Compliance**: GDPR and privacy law compliant

---

## 🌟 Advanced Features

### 🔄 Automated Trading
- **Smart Bidding**: AI-powered bid optimization
- **Auto-scaling**: Dynamic resource allocation
- **Portfolio Management**: Multiple concurrent jobs
- **Risk Management**: Automated stop-loss rules

### 📊 Analytics Dashboard
- **Performance Metrics**: Detailed job analytics
- **Cost Analysis**: Spending patterns and optimization
- **Market Insights**: Provider trends and pricing
- **ROI Tracking**: Return on investment calculations

---

## 🚀 Tips for Success

### 💡 For Clients
- **Clear Requirements**: Provide detailed job specifications
- **Realistic Budgets**: Price competitively for better results
- **Communication**: Stay engaged with providers
- **Feedback**: Help improve the ecosystem with ratings

### 💻 For Providers
- **Competitive Pricing**: Research market rates
- **High Uptime**: Maintain reliable infrastructure
- **Quick Response**: Fast communication builds trust
- **Quality Work**: Deliver excellent results consistently

---

## 📈 Future Features

### 🔮 Coming Soon
- **Mobile App**: iOS and Android applications
- **Multi-chain**: Polygon, BSC, and Arbitrum support
- **Advanced ML**: Support for specialized frameworks
- **Enterprise**: Dedicated support and SLAs

### 🌟 Roadmap Preview
- **Federated Learning**: Distributed training protocols
- **Model Marketplace**: Trade pre-trained models
- **DAO Governance**: Community-driven decisions
- **Cross-chain Bridge**: Seamless multi-chain experience

---

*This guide is continuously updated. Check back regularly for new features and improvements.*
