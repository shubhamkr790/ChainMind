import { ethers, Contract, Wallet, HDNodeWallet } from 'ethers';
import { logger } from '../utils/logger';

// Contract ABIs (simplified for main functions)
const ESCROW_ABI = [
  'function createEscrow(string memory jobId, address provider, uint256 amount) external payable returns (uint256)',
  'function releaseEscrow(uint256 escrowId) external',
  'function refundEscrow(uint256 escrowId) external',
  'function getEscrow(uint256 escrowId) external view returns (tuple(uint256 id, string jobId, address client, address provider, uint256 amount, uint8 status, uint256 createdAt))',
  'event EscrowCreated(uint256 indexed escrowId, string indexed jobId, address indexed client, address provider, uint256 amount)',
  'event EscrowReleased(uint256 indexed escrowId, address indexed provider, uint256 amount)',
  'event EscrowRefunded(uint256 indexed escrowId, address indexed client, uint256 amount)'
];

const REPUTATION_ABI = [
  'function submitRating(address provider, string memory jobId, uint8 rating, string memory review) external',
  'function getProviderReputation(address provider) external view returns (tuple(uint256 totalRatings, uint256 averageRating, uint256 level, uint256 experience))',
  'function updateProviderLevel(address provider) external',
  'event RatingSubmitted(address indexed provider, address indexed client, string indexed jobId, uint8 rating)',
];

const CMT_TOKEN_ABI = [
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function mint(address to, uint256 amount) external',
  'function burn(uint256 amount) external',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

export interface EscrowData {
  id: number;
  jobId: string;
  client: string;
  provider: string;
  amount: string;
  status: number; // 0: pending, 1: released, 2: refunded
  createdAt: number;
}

export interface ReputationData {
  totalRatings: number;
  averageRating: number;
  level: number;
  experience: number;
}

export class BlockchainService {
  private provider?: ethers.JsonRpcProvider;
  private wallet?: Wallet | HDNodeWallet;
  private escrowContract?: Contract;
  private reputationContract?: Contract;
  private cmtTokenContract?: Contract;
  private isConfigured: boolean = false;

  constructor() {
    try {
      // Check if blockchain configuration is available
      if (!process.env.RPC_URL || !process.env.ESCROW_CONTRACT_ADDRESS || !process.env.REPUTATION_CONTRACT_ADDRESS || !process.env.CMT_TOKEN_CONTRACT_ADDRESS) {
        logger.warn('Blockchain configuration incomplete. Blockchain features will be disabled.');
        logger.warn('Missing: RPC_URL, ESCROW_CONTRACT_ADDRESS, REPUTATION_CONTRACT_ADDRESS, or CMT_TOKEN_CONTRACT_ADDRESS');
        return;
      }

      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      
      // Initialize wallet (backend wallet for contract interactions)
      if (!process.env.BACKEND_PRIVATE_KEY || process.env.BACKEND_PRIVATE_KEY === 'your_backend_private_key_here') {
        logger.warn('Backend private key not configured. Contract interactions will be limited.');
        this.wallet = Wallet.createRandom().connect(this.provider);
      } else {
        this.wallet = new Wallet(process.env.BACKEND_PRIVATE_KEY, this.provider);
      }

      // Initialize contracts
      this.escrowContract = new Contract(
        process.env.ESCROW_CONTRACT_ADDRESS,
        ESCROW_ABI,
        this.wallet
      );

      this.reputationContract = new Contract(
        process.env.REPUTATION_CONTRACT_ADDRESS,
        REPUTATION_ABI,
        this.wallet
      );

      this.cmtTokenContract = new Contract(
        process.env.CMT_TOKEN_CONTRACT_ADDRESS,
        CMT_TOKEN_ABI,
        this.wallet
      );

      this.isConfigured = true;
      logger.info('Blockchain service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize blockchain service:', error);
      logger.warn('Blockchain features will be disabled.');
    }
  }

  /**
   * Create an escrow for a job
   */
  async createEscrow(jobId: string, providerAddress: string, amountInPOL: number): Promise<{
    success: boolean;
    escrowId?: number;
    transactionHash?: string;
    error?: string;
  }> {
    if (!this.isConfigured || !this.escrowContract) {
      return {
        success: false,
        error: 'Blockchain service not configured. Please set required environment variables.'
      };
    }

    try {
      const amount = ethers.parseEther(amountInPOL.toString());
      
      logger.info(`Creating escrow for job ${jobId}, amount: ${amountInPOL} POL`);
      
      const tx = await this.escrowContract!.createEscrow(
        jobId,
        providerAddress,
        amount,
        { value: amount }
      );

      const receipt = await tx.wait();
      
      // Parse the EscrowCreated event to get escrow ID
      const escrowCreatedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = this.escrowContract!.interface.parseLog(log);
          return parsed?.name === 'EscrowCreated';
        } catch {
          return false;
        }
      });

      let escrowId: number | undefined;
      if (escrowCreatedEvent) {
        const parsed = this.escrowContract!.interface.parseLog(escrowCreatedEvent);
        escrowId = Number(parsed?.args.escrowId);
      }

      logger.info(`Escrow created successfully. ID: ${escrowId}, TX: ${tx.hash}`);

      return {
        success: true,
        escrowId,
        transactionHash: tx.hash
      };
    } catch (error: any) {
      logger.error('Failed to create escrow:', error);
      return {
        success: false,
        error: error.message || 'Failed to create escrow'
      };
    }
  }

  /**
   * Release escrow to provider
   */
  async releaseEscrow(escrowId: number): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      logger.info(`Releasing escrow ${escrowId}`);
      
      const tx = await this.escrowContract!.releaseEscrow(escrowId);
      await tx.wait();
      
      logger.info(`Escrow ${escrowId} released successfully. TX: ${tx.hash}`);
      
      return {
        success: true,
        transactionHash: tx.hash
      };
    } catch (error: any) {
      logger.error(`Failed to release escrow ${escrowId}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to release escrow'
      };
    }
  }

  /**
   * Refund escrow to client
   */
  async refundEscrow(escrowId: number): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      logger.info(`Refunding escrow ${escrowId}`);
      
      const tx = await this.escrowContract!.refundEscrow(escrowId);
      await tx.wait();
      
      logger.info(`Escrow ${escrowId} refunded successfully. TX: ${tx.hash}`);
      
      return {
        success: true,
        transactionHash: tx.hash
      };
    } catch (error: any) {
      logger.error(`Failed to refund escrow ${escrowId}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to refund escrow'
      };
    }
  }

  /**
   * Get escrow details
   */
  async getEscrow(escrowId: number): Promise<EscrowData | null> {
    try {
      const escrowData = await this.escrowContract!.getEscrow(escrowId);
      
      return {
        id: Number(escrowData.id),
        jobId: escrowData.jobId,
        client: escrowData.client,
        provider: escrowData.provider,
        amount: escrowData.amount.toString(),
        status: Number(escrowData.status),
        createdAt: Number(escrowData.createdAt)
      };
    } catch (error: any) {
      logger.error(`Failed to get escrow ${escrowId}:`, error);
      return null;
    }
  }

  /**
   * Submit a rating for a provider
   */
  async submitRating(
    providerAddress: string,
    jobId: string,
    rating: number,
    review: string
  ): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      logger.info(`Submitting rating for provider ${providerAddress}, job ${jobId}, rating: ${rating}`);
      
      const tx = await this.reputationContract!.submitRating(
        providerAddress,
        jobId,
        rating,
        review
      );
      await tx.wait();
      
      logger.info(`Rating submitted successfully. TX: ${tx.hash}`);
      
      return {
        success: true,
        transactionHash: tx.hash
      };
    } catch (error: any) {
      logger.error('Failed to submit rating:', error);
      return {
        success: false,
        error: error.message || 'Failed to submit rating'
      };
    }
  }

  /**
   * Get provider reputation
   */
  async getProviderReputation(providerAddress: string): Promise<ReputationData | null> {
    try {
      const reputation = await this.reputationContract!.getProviderReputation(providerAddress);
      
      return {
        totalRatings: Number(reputation.totalRatings),
        averageRating: Number(reputation.averageRating),
        level: Number(reputation.level),
        experience: Number(reputation.experience)
      };
    } catch (error: any) {
      logger.error(`Failed to get provider reputation for ${providerAddress}:`, error);
      return null;
    }
  }

  /**
   * Get CMT token balance
   */
  async getCMTBalance(address: string): Promise<string | null> {
    try {
      const balance = await this.cmtTokenContract!.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error: any) {
      logger.error(`Failed to get CMT balance for ${address}:`, error);
      return null;
    }
  }

  /**
   * Transfer CMT tokens
   */
  async transferCMT(
    toAddress: string,
    amount: number
  ): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      const amountWei = ethers.parseEther(amount.toString());
      
      logger.info(`Transferring ${amount} CMT to ${toAddress}`);
      
      const tx = await this.cmtTokenContract!.transfer(toAddress, amountWei);
      await tx.wait();
      
      logger.info(`CMT transfer successful. TX: ${tx.hash}`);
      
      return {
        success: true,
        transactionHash: tx.hash
      };
    } catch (error: any) {
      logger.error('Failed to transfer CMT:', error);
      return {
        success: false,
        error: error.message || 'Failed to transfer CMT'
      };
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string) {
    try {
      return await this.provider!.getTransactionReceipt(txHash);
    } catch (error: any) {
      logger.error(`Failed to get transaction receipt for ${txHash}:`, error);
      return null;
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<string | null> {
    try {
      const gasPrice = await this.provider!.getFeeData();
      return gasPrice.gasPrice?.toString() || null;
    } catch (error: any) {
      logger.error('Failed to get gas price:', error);
      return null;
    }
  }

  /**
   * Validate wallet address
   */
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  /**
   * Format ether values
   */
  formatEther(amount: string): string {
    return ethers.formatEther(amount);
  }

  /**
   * Parse ether values
   */
  parseEther(amount: string): string {
    return ethers.parseEther(amount).toString();
  }
}

export const blockchainService = new BlockchainService();
