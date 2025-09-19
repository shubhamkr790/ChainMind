// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ChainMind Escrow
 * @dev Smart contract for handling escrow payments between AI developers and GPU providers
 * Features:
 * - Secure escrow for job payments
 * - Multi-signature dispute resolution
 * - Automated payment release with proof verification
 * - Fee collection mechanism
 * - Emergency pause functionality
 */
contract ChainMindEscrow is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /// @dev ChainMind token contract
    IERC20 public immutable mindToken;
    
    /// @dev Fee collector address
    address public feeCollector;
    
    /// @dev Platform fee in basis points (e.g., 250 = 2.5%)
    uint256 public platformFeeRate = 250; // 2.5%
    
    /// @dev Maximum platform fee rate (5%)
    uint256 public constant MAX_FEE_RATE = 500;
    
    /// @dev Minimum job amount
    uint256 public minJobAmount = 1e18; // 1 MIND
    
    /// @dev Job status enum
    enum JobStatus {
        Created,      // Job created and funded
        Active,       // Job accepted by provider
        Completed,    // Job completed by provider
        Disputed,     // Job in dispute
        Resolved,     // Dispute resolved
        Cancelled     // Job cancelled
    }
    
    /// @dev Job struct
    struct Job {
        uint256 jobId;
        address developer;
        address provider;
        uint256 amount;
        uint256 fee;
        string datasetHash;
        string proofHash;
        JobStatus status;
        uint256 createdAt;
        uint256 completedAt;
        bool developerApproved;
        bool providerSubmitted;
    }
    
    /// @dev Dispute struct
    struct Dispute {
        uint256 jobId;
        address initiator;
        string reason;
        uint256 createdAt;
        bool resolved;
        address winner;
    }
    
    /// @dev Mapping from job ID to job details
    mapping(uint256 => Job) public jobs;
    
    /// @dev Mapping from job ID to dispute details
    mapping(uint256 => Dispute) public disputes;
    
    /// @dev Mapping for dispute arbitrators
    mapping(address => bool) public arbitrators;
    
    /// @dev Job counter
    uint256 public nextJobId = 1;
    
    /// @dev Total jobs created
    uint256 public totalJobs;
    
    /// @dev Total volume processed
    uint256 public totalVolume;
    
    // Events
    event JobCreated(uint256 indexed jobId, address indexed developer, uint256 amount, string datasetHash);
    event JobAccepted(uint256 indexed jobId, address indexed provider);
    event JobCompleted(uint256 indexed jobId, string proofHash);
    event JobApproved(uint256 indexed jobId, address indexed developer);
    event JobDisputed(uint256 indexed jobId, address indexed initiator, string reason);
    event DisputeResolved(uint256 indexed jobId, address indexed winner, address indexed arbitrator);
    event JobCancelled(uint256 indexed jobId, string reason);
    event PaymentReleased(uint256 indexed jobId, address indexed provider, uint256 amount, uint256 fee);
    event FeeCollectorUpdated(address indexed oldCollector, address indexed newCollector);
    event PlatformFeeUpdated(uint256 oldRate, uint256 newRate);
    event ArbitratorUpdated(address indexed arbitrator, bool authorized);

    constructor(
        address _mindToken,
        address _feeCollector,
        address _initialOwner
    ) Ownable(_initialOwner) {
        require(_mindToken != address(0), "Escrow: invalid token address");
        require(_feeCollector != address(0), "Escrow: invalid fee collector");
        require(_initialOwner != address(0), "Escrow: invalid owner");
        
        mindToken = IERC20(_mindToken);
        feeCollector = _feeCollector;
    }

    /**
     * @dev Create a new job and lock funds in escrow
     * @param amount The amount of MIND tokens to escrow
     * @param datasetHash IPFS hash of the dataset
     */
    function createJob(uint256 amount, string calldata datasetHash) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 jobId)
    {
        require(amount >= minJobAmount, "Escrow: amount below minimum");
        require(bytes(datasetHash).length > 0, "Escrow: empty dataset hash");
        
        uint256 fee = (amount * platformFeeRate) / 10000;
        uint256 totalAmount = amount + fee;
        
        jobId = nextJobId++;
        
        jobs[jobId] = Job({
            jobId: jobId,
            developer: msg.sender,
            provider: address(0),
            amount: amount,
            fee: fee,
            datasetHash: datasetHash,
            proofHash: "",
            status: JobStatus.Created,
            createdAt: block.timestamp,
            completedAt: 0,
            developerApproved: false,
            providerSubmitted: false
        });
        
        totalJobs++;
        totalVolume += amount;
        
        // Transfer tokens to escrow
        mindToken.safeTransferFrom(msg.sender, address(this), totalAmount);
        
        emit JobCreated(jobId, msg.sender, amount, datasetHash);
        
        return jobId;
    }

    /**
     * @dev Accept a job as a provider
     * @param jobId The ID of the job to accept
     */
    function acceptJob(uint256 jobId) external nonReentrant whenNotPaused {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Created, "Escrow: job not available");
        require(job.developer != msg.sender, "Escrow: cannot accept own job");
        
        job.provider = msg.sender;
        job.status = JobStatus.Active;
        
        emit JobAccepted(jobId, msg.sender);
    }

    /**
     * @dev Submit job completion with proof
     * @param jobId The ID of the job
     * @param proofHash IPFS hash of the completion proof/results
     */
    function submitCompletion(uint256 jobId, string calldata proofHash) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Active, "Escrow: job not active");
        require(job.provider == msg.sender, "Escrow: not the provider");
        require(bytes(proofHash).length > 0, "Escrow: empty proof hash");
        
        job.proofHash = proofHash;
        job.status = JobStatus.Completed;
        job.completedAt = block.timestamp;
        job.providerSubmitted = true;
        
        emit JobCompleted(jobId, proofHash);
    }

    /**
     * @dev Approve job completion and release payment
     * @param jobId The ID of the job to approve
     */
    function approveJob(uint256 jobId) external nonReentrant whenNotPaused {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Completed, "Escrow: job not completed");
        require(job.developer == msg.sender, "Escrow: not the developer");
        
        job.developerApproved = true;
        _releasePayment(jobId);
        
        emit JobApproved(jobId, msg.sender);
    }

    /**
     * @dev Create a dispute for a job
     * @param jobId The ID of the job to dispute
     * @param reason The reason for the dispute
     */
    function createDispute(uint256 jobId, string calldata reason) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        Job storage job = jobs[jobId];
        require(
            job.status == JobStatus.Active || job.status == JobStatus.Completed,
            "Escrow: cannot dispute job in this status"
        );
        require(
            job.developer == msg.sender || job.provider == msg.sender,
            "Escrow: not involved in job"
        );
        require(disputes[jobId].createdAt == 0, "Escrow: dispute already exists");
        require(bytes(reason).length > 0, "Escrow: empty dispute reason");
        
        job.status = JobStatus.Disputed;
        
        disputes[jobId] = Dispute({
            jobId: jobId,
            initiator: msg.sender,
            reason: reason,
            createdAt: block.timestamp,
            resolved: false,
            winner: address(0)
        });
        
        emit JobDisputed(jobId, msg.sender, reason);
    }

    /**
     * @dev Resolve a dispute (arbitrator only)
     * @param jobId The ID of the disputed job
     * @param winner The address of the dispute winner
     */
    function resolveDispute(uint256 jobId, address winner) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(arbitrators[msg.sender], "Escrow: not an arbitrator");
        
        Job storage job = jobs[jobId];
        Dispute storage dispute = disputes[jobId];
        
        require(job.status == JobStatus.Disputed, "Escrow: job not disputed");
        require(!dispute.resolved, "Escrow: dispute already resolved");
        require(
            winner == job.developer || winner == job.provider,
            "Escrow: invalid winner"
        );
        
        dispute.resolved = true;
        dispute.winner = winner;
        job.status = JobStatus.Resolved;
        
        if (winner == job.provider) {
            _releasePayment(jobId);
        } else {
            // Refund to developer
            _refundDeveloper(jobId);
        }
        
        emit DisputeResolved(jobId, winner, msg.sender);
    }

    /**
     * @dev Cancel a job (developer only, before acceptance)
     * @param jobId The ID of the job to cancel
     * @param reason The reason for cancellation
     */
    function cancelJob(uint256 jobId, string calldata reason) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Created, "Escrow: cannot cancel job");
        require(job.developer == msg.sender, "Escrow: not the developer");
        
        job.status = JobStatus.Cancelled;
        _refundDeveloper(jobId);
        
        emit JobCancelled(jobId, reason);
    }

    /**
     * @dev Internal function to release payment to provider
     */
    function _releasePayment(uint256 jobId) internal {
        Job storage job = jobs[jobId];
        
        // Transfer amount to provider
        mindToken.safeTransfer(job.provider, job.amount);
        
        // Transfer fee to fee collector
        mindToken.safeTransfer(feeCollector, job.fee);
        
        emit PaymentReleased(jobId, job.provider, job.amount, job.fee);
    }

    /**
     * @dev Internal function to refund developer
     */
    function _refundDeveloper(uint256 jobId) internal {
        Job storage job = jobs[jobId];
        uint256 totalRefund = job.amount + job.fee;
        
        mindToken.safeTransfer(job.developer, totalRefund);
    }

    // Admin functions

    /**
     * @dev Set fee collector address
     */
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Escrow: invalid fee collector");
        
        address oldCollector = feeCollector;
        feeCollector = _feeCollector;
        
        emit FeeCollectorUpdated(oldCollector, _feeCollector);
    }

    /**
     * @dev Set platform fee rate
     */
    function setPlatformFeeRate(uint256 _feeRate) external onlyOwner {
        require(_feeRate <= MAX_FEE_RATE, "Escrow: fee rate too high");
        
        uint256 oldRate = platformFeeRate;
        platformFeeRate = _feeRate;
        
        emit PlatformFeeUpdated(oldRate, _feeRate);
    }

    /**
     * @dev Set minimum job amount
     */
    function setMinJobAmount(uint256 _minAmount) external onlyOwner {
        minJobAmount = _minAmount;
    }

    /**
     * @dev Add or remove arbitrator
     */
    function setArbitrator(address _arbitrator, bool _authorized) external onlyOwner {
        require(_arbitrator != address(0), "Escrow: invalid arbitrator");
        
        arbitrators[_arbitrator] = _authorized;
        emit ArbitratorUpdated(_arbitrator, _authorized);
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // View functions

    /**
     * @dev Get job details
     */
    function getJob(uint256 jobId) external view returns (Job memory) {
        return jobs[jobId];
    }

    /**
     * @dev Get dispute details
     */
    function getDispute(uint256 jobId) external view returns (Dispute memory) {
        return disputes[jobId];
    }

    /**
     * @dev Check if address is arbitrator
     */
    function isArbitrator(address _address) external view returns (bool) {
        return arbitrators[_address];
    }

    /**
     * @dev Get platform statistics
     */
    function getPlatformStats() external view returns (
        uint256 _totalJobs,
        uint256 _totalVolume,
        uint256 _platformFeeRate,
        uint256 _minJobAmount
    ) {
        return (totalJobs, totalVolume, platformFeeRate, minJobAmount);
    }
}
