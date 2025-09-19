// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ChainMind Reputation
 * @dev Smart contract for managing reputation scores in the ChainMind ecosystem
 * Features:
 * - On-chain reputation scoring for providers and developers
 * - Multiple reputation factors (job completion, uptime, user ratings)
 * - Reputation decay mechanism to incentivize continued activity
 * - Attestation system for verified achievements
 * - Reputation-based access controls
 */
contract ChainMindReputation is Ownable, ReentrancyGuard, Pausable {
    
    /// @dev Maximum reputation score
    uint256 public constant MAX_REPUTATION = 1000;
    
    /// @dev Minimum reputation score
    uint256 public constant MIN_REPUTATION = 0;
    
    /// @dev Default starting reputation
    uint256 public constant DEFAULT_REPUTATION = 500;
    
    /// @dev Reputation decay rate per day (in basis points)
    uint256 public decayRate = 1; // 0.01% per day
    
    /// @dev Reputation event types
    enum ReputationType {
        JOB_COMPLETED,    // Job successfully completed
        JOB_FAILED,       // Job failed or disputed
        UPTIME_BONUS,     // High uptime bonus
        USER_RATING,      // Rating from other users
        ATTESTATION,      // Verified achievement
        MANUAL_ADJUSTMENT // Manual admin adjustment
    }
    
    /// @dev User reputation data
    struct UserReputation {
        uint256 score;           // Current reputation score
        uint256 totalJobs;       // Total jobs completed
        uint256 successfulJobs;  // Successful jobs
        uint256 failedJobs;      // Failed/disputed jobs
        uint256 totalRatings;    // Sum of all ratings received
        uint256 ratingCount;     // Number of ratings received
        uint256 lastUpdateTime;  // Last reputation update timestamp
        bool isProvider;         // Whether user is a registered provider
        bool isDeveloper;        // Whether user is a developer
        bool isVerified;         // Whether user is verified
    }
    
    /// @dev Reputation event record
    struct ReputationEvent {
        address user;
        ReputationType eventType;
        int256 scoreChange;
        uint256 timestamp;
        address attestor;
        string metadata;
    }
    
    /// @dev Attestation record
    struct Attestation {
        address attestor;
        address user;
        string category;      // e.g., "hardware_verified", "kyc_completed"
        string details;
        uint256 timestamp;
        bool revoked;
    }
    
    /// @dev User reputation mapping
    mapping(address => UserReputation) public reputations;
    
    /// @dev Reputation events history
    mapping(address => ReputationEvent[]) public userEvents;
    
    /// @dev User attestations
    mapping(address => Attestation[]) public userAttestations;
    
    /// @dev Authorized reputation managers
    mapping(address => bool) public reputationManagers;
    
    /// @dev Authorized attestors
    mapping(address => bool) public attestors;
    
    /// @dev Total number of reputation events
    uint256 public totalEvents;
    
    /// @dev Total number of attestations
    uint256 public totalAttestations;
    
    // Events
    event ReputationUpdated(
        address indexed user,
        ReputationType eventType,
        int256 scoreChange,
        uint256 newScore,
        address indexed attestor
    );
    event UserRegistered(address indexed user, bool isProvider, bool isDeveloper);
    event AttestationCreated(
        address indexed user,
        address indexed attestor,
        string category,
        string details
    );
    event AttestationRevoked(address indexed user, address indexed attestor, uint256 attestationId);
    event ReputationManagerUpdated(address indexed manager, bool authorized);
    event AttestorUpdated(address indexed attestor, bool authorized);
    event DecayRateUpdated(uint256 oldRate, uint256 newRate);

    constructor(address _initialOwner) Ownable(_initialOwner) {
        require(_initialOwner != address(0), "Reputation: invalid owner");
    }

    /**
     * @dev Register a user in the reputation system
     * @param user The user address
     * @param isProvider Whether the user is a provider
     * @param isDeveloper Whether the user is a developer
     */
    function registerUser(
        address user, 
        bool isProvider, 
        bool isDeveloper
    ) external whenNotPaused {
        require(user != address(0), "Reputation: invalid user");
        require(
            msg.sender == user || reputationManagers[msg.sender] || msg.sender == owner(),
            "Reputation: not authorized"
        );
        
        UserReputation storage reputation = reputations[user];
        
        // Initialize reputation if first time
        if (reputation.lastUpdateTime == 0) {
            reputation.score = DEFAULT_REPUTATION;
            reputation.lastUpdateTime = block.timestamp;
        }
        
        reputation.isProvider = isProvider;
        reputation.isDeveloper = isDeveloper;
        
        emit UserRegistered(user, isProvider, isDeveloper);
    }

    /**
     * @dev Update reputation based on job completion
     * @param provider The provider address
     * @param developer The developer address
     * @param successful Whether the job was successful
     * @param jobValue The value of the job (affects reputation change)
     */
    function updateJobReputation(
        address provider,
        address developer,
        bool successful,
        uint256 jobValue
    ) external whenNotPaused {
        require(
            reputationManagers[msg.sender] || msg.sender == owner(),
            "Reputation: not authorized"
        );
        
        _applyDecay(provider);
        _applyDecay(developer);
        
        UserReputation storage providerRep = reputations[provider];
        UserReputation storage developerRep = reputations[developer];
        
        providerRep.totalJobs++;
        
        if (successful) {
            providerRep.successfulJobs++;
            
            // Calculate reputation change based on job value
            int256 reputationChange = _calculateJobReputationChange(jobValue, true);
            
            _updateReputation(provider, ReputationType.JOB_COMPLETED, reputationChange, address(0), "");
            
            // Small bonus for developer for successful collaboration
            _updateReputation(developer, ReputationType.JOB_COMPLETED, 5, address(0), "collaboration_bonus");
        } else {
            providerRep.failedJobs++;
            
            // Reputation penalty for failed job
            int256 reputationChange = _calculateJobReputationChange(jobValue, false);
            
            _updateReputation(provider, ReputationType.JOB_FAILED, reputationChange, address(0), "");
            
            // Small penalty for developer for failed collaboration
            _updateReputation(developer, ReputationType.JOB_FAILED, -2, address(0), "collaboration_failure");
        }
    }

    /**
     * @dev Submit a rating for a user
     * @param user The user to rate
     * @param rating The rating (1-5)
     */
    function submitRating(address user, uint256 rating) external whenNotPaused {
        require(user != address(0), "Reputation: invalid user");
        require(rating >= 1 && rating <= 5, "Reputation: invalid rating");
        require(user != msg.sender, "Reputation: cannot rate yourself");
        
        _applyDecay(user);
        
        UserReputation storage reputation = reputations[user];
        reputation.totalRatings += rating;
        reputation.ratingCount++;
        
        // Convert rating to reputation change (-40 to +40 range)
        int256 reputationChange = int256((rating - 3) * 20);
        
        _updateReputation(
            user,
            ReputationType.USER_RATING,
            reputationChange,
            msg.sender,
            "user_rating"
        );
    }

    /**
     * @dev Create an attestation for a user
     * @param user The user to attest
     * @param category The category of attestation
     * @param details Additional details
     * @param reputationBonus Bonus reputation points to award
     */
    function createAttestation(
        address user,
        string calldata category,
        string calldata details,
        uint256 reputationBonus
    ) external whenNotPaused {
        require(user != address(0), "Reputation: invalid user");
        require(attestors[msg.sender], "Reputation: not an attestor");
        require(bytes(category).length > 0, "Reputation: empty category");
        require(reputationBonus <= 100, "Reputation: bonus too high");
        
        _applyDecay(user);
        
        // Create attestation record
        Attestation memory attestation = Attestation({
            attestor: msg.sender,
            user: user,
            category: category,
            details: details,
            timestamp: block.timestamp,
            revoked: false
        });
        
        userAttestations[user].push(attestation);
        totalAttestations++;
        
        // Mark user as verified for certain categories
        if (
            keccak256(bytes(category)) == keccak256(bytes("kyc_completed")) ||
            keccak256(bytes(category)) == keccak256(bytes("hardware_verified"))
        ) {
            reputations[user].isVerified = true;
        }
        
        // Award reputation bonus
        if (reputationBonus > 0) {
            _updateReputation(
                user,
                ReputationType.ATTESTATION,
                int256(reputationBonus),
                msg.sender,
                category
            );
        }
        
        emit AttestationCreated(user, msg.sender, category, details);
    }

    /**
     * @dev Revoke an attestation
     * @param user The user whose attestation to revoke
     * @param attestationId The ID of the attestation to revoke
     * @param reputationPenalty Reputation penalty to apply
     */
    function revokeAttestation(
        address user,
        uint256 attestationId,
        uint256 reputationPenalty
    ) external whenNotPaused {
        require(attestors[msg.sender], "Reputation: not an attestor");
        require(attestationId < userAttestations[user].length, "Reputation: invalid attestation ID");
        
        Attestation storage attestation = userAttestations[user][attestationId];
        require(attestation.attestor == msg.sender, "Reputation: not your attestation");
        require(!attestation.revoked, "Reputation: already revoked");
        
        _applyDecay(user);
        
        attestation.revoked = true;
        
        // Apply reputation penalty
        if (reputationPenalty > 0) {
            _updateReputation(
                user,
                ReputationType.MANUAL_ADJUSTMENT,
                -int256(reputationPenalty),
                msg.sender,
                "attestation_revoked"
            );
        }
        
        emit AttestationRevoked(user, msg.sender, attestationId);
    }

    /**
     * @dev Manual reputation adjustment (admin only)
     * @param user The user whose reputation to adjust
     * @param change The reputation change (can be negative)
     * @param reason The reason for the adjustment
     */
    function adjustReputation(
        address user,
        int256 change,
        string calldata reason
    ) external onlyOwner whenNotPaused {
        require(user != address(0), "Reputation: invalid user");
        require(change != 0, "Reputation: no change");
        require(bytes(reason).length > 0, "Reputation: empty reason");
        
        _applyDecay(user);
        _updateReputation(user, ReputationType.MANUAL_ADJUSTMENT, change, msg.sender, reason);
    }

    /**
     * @dev Apply reputation decay for a user
     * @param user The user to apply decay for
     */
    function _applyDecay(address user) internal {
        UserReputation storage reputation = reputations[user];
        
        if (reputation.lastUpdateTime == 0) {
            // First time, set defaults
            reputation.score = DEFAULT_REPUTATION;
            reputation.lastUpdateTime = block.timestamp;
            return;
        }
        
        uint256 daysSinceUpdate = (block.timestamp - reputation.lastUpdateTime) / 1 days;
        
        if (daysSinceUpdate > 0) {
            uint256 decayAmount = (reputation.score * decayRate * daysSinceUpdate) / 10000;
            
            if (decayAmount > 0 && reputation.score > MIN_REPUTATION) {
                if (reputation.score > decayAmount) {
                    reputation.score -= decayAmount;
                } else {
                    reputation.score = MIN_REPUTATION;
                }
            }
            
            reputation.lastUpdateTime = block.timestamp;
        }
    }

    /**
     * @dev Internal function to update reputation
     */
    function _updateReputation(
        address user,
        ReputationType eventType,
        int256 change,
        address attestor,
        string memory metadata
    ) internal {
        UserReputation storage reputation = reputations[user];
        
        // Apply change
        if (change > 0) {
            uint256 newScore = reputation.score + uint256(change);
            reputation.score = newScore > MAX_REPUTATION ? MAX_REPUTATION : newScore;
        } else if (change < 0) {
            uint256 penalty = uint256(-change);
            reputation.score = reputation.score > penalty ? reputation.score - penalty : MIN_REPUTATION;
        }
        
        reputation.lastUpdateTime = block.timestamp;
        
        // Record event
        ReputationEvent memory repEvent = ReputationEvent({
            user: user,
            eventType: eventType,
            scoreChange: change,
            timestamp: block.timestamp,
            attestor: attestor,
            metadata: metadata
        });
        
        userEvents[user].push(repEvent);
        totalEvents++;
        
        emit ReputationUpdated(user, eventType, change, reputation.score, attestor);
    }

    /**
     * @dev Calculate reputation change based on job value and success
     */
    function _calculateJobReputationChange(uint256 jobValue, bool successful) internal pure returns (int256) {
        // Base change: +20 for success, -30 for failure
        int256 baseChange = successful ? int256(20) : int256(-30);
        
        // Adjust based on job value (higher value jobs have more impact)
        // jobValue is in wei, so we normalize it
        uint256 valueMultiplier = 1;
        if (jobValue >= 100 ether) {
            valueMultiplier = 3; // Large jobs
        } else if (jobValue >= 10 ether) {
            valueMultiplier = 2; // Medium jobs
        }
        
        return baseChange * int256(valueMultiplier);
    }

    // Admin functions

    /**
     * @dev Set reputation manager authorization
     */
    function setReputationManager(address manager, bool authorized) external onlyOwner {
        require(manager != address(0), "Reputation: invalid manager");
        
        reputationManagers[manager] = authorized;
        emit ReputationManagerUpdated(manager, authorized);
    }

    /**
     * @dev Set attestor authorization
     */
    function setAttestor(address attestor, bool authorized) external onlyOwner {
        require(attestor != address(0), "Reputation: invalid attestor");
        
        attestors[attestor] = authorized;
        emit AttestorUpdated(attestor, authorized);
    }

    /**
     * @dev Set reputation decay rate
     */
    function setDecayRate(uint256 _decayRate) external onlyOwner {
        require(_decayRate <= 100, "Reputation: decay rate too high"); // Max 1% per day
        
        uint256 oldRate = decayRate;
        decayRate = _decayRate;
        
        emit DecayRateUpdated(oldRate, _decayRate);
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
     * @dev Get user reputation with decay applied
     */
    function getUserReputation(address user) external view returns (UserReputation memory reputation) {
        reputation = reputations[user];
        
        if (reputation.lastUpdateTime == 0) {
            reputation.score = DEFAULT_REPUTATION;
            return reputation;
        }
        
        // Calculate decay
        uint256 daysSinceUpdate = (block.timestamp - reputation.lastUpdateTime) / 1 days;
        
        if (daysSinceUpdate > 0) {
            uint256 decayAmount = (reputation.score * decayRate * daysSinceUpdate) / 10000;
            
            if (decayAmount > 0 && reputation.score > MIN_REPUTATION) {
                if (reputation.score > decayAmount) {
                    reputation.score -= decayAmount;
                } else {
                    reputation.score = MIN_REPUTATION;
                }
            }
        }
        
        return reputation;
    }

    /**
     * @dev Get user's reputation events
     */
    function getUserEvents(address user) external view returns (ReputationEvent[] memory) {
        return userEvents[user];
    }

    /**
     * @dev Get user's attestations
     */
    function getUserAttestations(address user) external view returns (Attestation[] memory) {
        return userAttestations[user];
    }

    /**
     * @dev Get platform reputation statistics
     */
    function getPlatformStats() external view returns (
        uint256 _totalEvents,
        uint256 _totalAttestations,
        uint256 _decayRate,
        uint256 _defaultReputation
    ) {
        return (totalEvents, totalAttestations, decayRate, DEFAULT_REPUTATION);
    }

    /**
     * @dev Check if user meets minimum reputation requirement
     */
    function meetsReputationRequirement(address user, uint256 minReputation) external view returns (bool) {
        UserReputation memory reputation = this.getUserReputation(user);
        return reputation.score >= minReputation;
    }
}
