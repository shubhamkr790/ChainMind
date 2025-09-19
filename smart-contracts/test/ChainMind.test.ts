import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ChainMindToken, ChainMindEscrow, ChainMindReputation } from "../typechain-types";

describe("ChainMind Smart Contracts", function () {
  let mindToken: ChainMindToken;
  let escrowContract: ChainMindEscrow;
  let reputationContract: ChainMindReputation;
  
  let owner: SignerWithAddress;
  let developer: SignerWithAddress;
  let provider: SignerWithAddress;
  let feeCollector: SignerWithAddress;
  let arbitrator: SignerWithAddress;

  const INITIAL_SUPPLY = ethers.parseEther("1000000000"); // 1 billion tokens
  const JOB_AMOUNT = ethers.parseEther("100"); // 100 MIND tokens

  before(async function () {
    [owner, developer, provider, feeCollector, arbitrator] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // Deploy ChainMind Token
    const ChainMindToken = await ethers.getContractFactory("ChainMindToken");
    mindToken = await ChainMindToken.deploy(
      owner.address,
      feeCollector.address,
      INITIAL_SUPPLY
    );
    await mindToken.waitForDeployment();

    // Deploy ChainMind Reputation
    const ChainMindReputation = await ethers.getContractFactory("ChainMindReputation");
    reputationContract = await ChainMindReputation.deploy(owner.address);
    await reputationContract.waitForDeployment();

    // Deploy ChainMind Escrow
    const ChainMindEscrow = await ethers.getContractFactory("ChainMindEscrow");
    escrowContract = await ChainMindEscrow.deploy(
      await mindToken.getAddress(),
      feeCollector.address,
      owner.address
    );
    await escrowContract.waitForDeployment();

    // Initial setup
    await reputationContract.setReputationManager(await escrowContract.getAddress(), true);
    await mindToken.setMinterAuthorization(await escrowContract.getAddress(), true);
    await escrowContract.setArbitrator(arbitrator.address, true);

    // Transfer tokens to developer for testing
    await mindToken.transfer(developer.address, ethers.parseEther("10000"));
  });

  describe("ChainMind Token", function () {
    it("Should deploy with correct initial parameters", async function () {
      expect(await mindToken.name()).to.equal("ChainMind Token");
      expect(await mindToken.symbol()).to.equal("MIND");
      expect(await mindToken.totalSupply()).to.equal(INITIAL_SUPPLY);
      expect(await mindToken.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
      expect(await mindToken.feeCollector()).to.equal(feeCollector.address);
    });

    it("Should allow authorized minters to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await mindToken.setMinterAuthorization(provider.address, true);
      await mindToken.connect(provider).mint(developer.address, mintAmount);
      
      expect(await mindToken.balanceOf(developer.address)).to.equal(
        ethers.parseEther("10000") + mintAmount
      );
    });

    it("Should not allow unauthorized addresses to mint", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(
        mindToken.connect(provider).mint(developer.address, mintAmount)
      ).to.be.revertedWith("ChainMind: not authorized to mint");
    });

    it("Should allow users to burn their tokens", async function () {
      const burnAmount = ethers.parseEther("500");
      const initialBalance = await mindToken.balanceOf(developer.address);
      
      await mindToken.connect(developer).burn(burnAmount);
      
      expect(await mindToken.balanceOf(developer.address)).to.equal(
        initialBalance - burnAmount
      );
    });
  });

  describe("ChainMind Reputation", function () {
    it("Should initialize users with default reputation", async function () {
      await reputationContract.registerUser(provider.address, true, false);
      
      const reputation = await reputationContract.getUserReputation(provider.address);
      expect(reputation.score).to.equal(500); // DEFAULT_REPUTATION
      expect(reputation.isProvider).to.be.true;
      expect(reputation.isDeveloper).to.be.false;
    });

    it("Should allow users to submit ratings", async function () {
      await reputationContract.registerUser(provider.address, true, false);
      
      // Developer rates provider with 5 stars
      await reputationContract.connect(developer).submitRating(provider.address, 5);
      
      const reputation = await reputationContract.getUserReputation(provider.address);
      expect(reputation.score).to.equal(540); // 500 + (5-3)*20 = 540
      expect(reputation.totalRatings).to.equal(5);
      expect(reputation.ratingCount).to.equal(1);
    });

    it("Should not allow users to rate themselves", async function () {
      await reputationContract.registerUser(provider.address, true, false);
      
      await expect(
        reputationContract.connect(provider).submitRating(provider.address, 5)
      ).to.be.revertedWith("Reputation: cannot rate yourself");
    });
  });

  describe("ChainMind Escrow", function () {
    beforeEach(async function () {
      // Register users in reputation system
      await reputationContract.registerUser(developer.address, false, true);
      await reputationContract.registerUser(provider.address, true, false);
      
      // Approve escrow to spend developer's tokens
      await mindToken.connect(developer).approve(
        await escrowContract.getAddress(), 
        ethers.parseEther("1000")
      );
    });

    it("Should allow developers to create jobs", async function () {
      const datasetHash = "QmTest123...";
      
      await escrowContract.connect(developer).createJob(JOB_AMOUNT, datasetHash);
      
      const job = await escrowContract.getJob(1);
      expect(job.developer).to.equal(developer.address);
      expect(job.amount).to.equal(JOB_AMOUNT);
      expect(job.datasetHash).to.equal(datasetHash);
      expect(job.status).to.equal(0); // Created status
    });

    it("Should calculate fees correctly", async function () {
      const datasetHash = "QmTest123...";
      
      await escrowContract.connect(developer).createJob(JOB_AMOUNT, datasetHash);
      
      const job = await escrowContract.getJob(1);
      const expectedFee = (JOB_AMOUNT * 250n) / 10000n; // 2.5%
      expect(job.fee).to.equal(expectedFee);
    });

    it("Should allow providers to accept jobs", async function () {
      const datasetHash = "QmTest123...";
      
      await escrowContract.connect(developer).createJob(JOB_AMOUNT, datasetHash);
      await escrowContract.connect(provider).acceptJob(1);
      
      const job = await escrowContract.getJob(1);
      expect(job.provider).to.equal(provider.address);
      expect(job.status).to.equal(1); // Active status
    });

    it("Should allow providers to submit completion", async function () {
      const datasetHash = "QmTest123...";
      const proofHash = "QmProof456...";
      
      await escrowContract.connect(developer).createJob(JOB_AMOUNT, datasetHash);
      await escrowContract.connect(provider).acceptJob(1);
      await escrowContract.connect(provider).submitCompletion(1, proofHash);
      
      const job = await escrowContract.getJob(1);
      expect(job.proofHash).to.equal(proofHash);
      expect(job.status).to.equal(2); // Completed status
      expect(job.providerSubmitted).to.be.true;
    });

    it("Should release payment when developer approves job", async function () {
      const datasetHash = "QmTest123...";
      const proofHash = "QmProof456...";
      
      const initialProviderBalance = await mindToken.balanceOf(provider.address);
      const initialFeeCollectorBalance = await mindToken.balanceOf(feeCollector.address);
      
      await escrowContract.connect(developer).createJob(JOB_AMOUNT, datasetHash);
      await escrowContract.connect(provider).acceptJob(1);
      await escrowContract.connect(provider).submitCompletion(1, proofHash);
      await escrowContract.connect(developer).approveJob(1);
      
      const job = await escrowContract.getJob(1);
      expect(job.developerApproved).to.be.true;
      
      // Check balances
      const finalProviderBalance = await mindToken.balanceOf(provider.address);
      const finalFeeCollectorBalance = await mindToken.balanceOf(feeCollector.address);
      
      expect(finalProviderBalance).to.equal(initialProviderBalance + JOB_AMOUNT);
      expect(finalFeeCollectorBalance).to.equal(initialFeeCollectorBalance + job.fee);
    });

    it("Should allow developers to cancel jobs before acceptance", async function () {
      const datasetHash = "QmTest123...";
      const initialDeveloperBalance = await mindToken.balanceOf(developer.address);
      
      await escrowContract.connect(developer).createJob(JOB_AMOUNT, datasetHash);
      await escrowContract.connect(developer).cancelJob(1, "Changed mind");
      
      const job = await escrowContract.getJob(1);
      expect(job.status).to.equal(5); // Cancelled status
      
      // Check refund
      const finalDeveloperBalance = await mindToken.balanceOf(developer.address);
      expect(finalDeveloperBalance).to.equal(initialDeveloperBalance);
    });

    it("Should allow dispute creation", async function () {
      const datasetHash = "QmTest123...";
      const proofHash = "QmProof456...";
      const disputeReason = "Work not as specified";
      
      await escrowContract.connect(developer).createJob(JOB_AMOUNT, datasetHash);
      await escrowContract.connect(provider).acceptJob(1);
      await escrowContract.connect(provider).submitCompletion(1, proofHash);
      await escrowContract.connect(developer).createDispute(1, disputeReason);
      
      const job = await escrowContract.getJob(1);
      const dispute = await escrowContract.getDispute(1);
      
      expect(job.status).to.equal(3); // Disputed status
      expect(dispute.initiator).to.equal(developer.address);
      expect(dispute.reason).to.equal(disputeReason);
    });

    it("Should allow arbitrator to resolve disputes", async function () {
      const datasetHash = "QmTest123...";
      const proofHash = "QmProof456...";
      const disputeReason = "Work not as specified";
      
      const initialProviderBalance = await mindToken.balanceOf(provider.address);
      
      await escrowContract.connect(developer).createJob(JOB_AMOUNT, datasetHash);
      await escrowContract.connect(provider).acceptJob(1);
      await escrowContract.connect(provider).submitCompletion(1, proofHash);
      await escrowContract.connect(developer).createDispute(1, disputeReason);
      
      // Arbitrator resolves in favor of provider
      await escrowContract.connect(arbitrator).resolveDispute(1, provider.address);
      
      const job = await escrowContract.getJob(1);
      const dispute = await escrowContract.getDispute(1);
      
      expect(job.status).to.equal(4); // Resolved status
      expect(dispute.resolved).to.be.true;
      expect(dispute.winner).to.equal(provider.address);
      
      // Check payment was released to provider
      const finalProviderBalance = await mindToken.balanceOf(provider.address);
      expect(finalProviderBalance).to.equal(initialProviderBalance + JOB_AMOUNT);
    });
  });

  describe("Integration Tests", function () {
    it("Should update reputation when job is completed successfully", async function () {
      await reputationContract.registerUser(developer.address, false, true);
      await reputationContract.registerUser(provider.address, true, false);
      
      const initialProviderReputation = await reputationContract.getUserReputation(provider.address);
      const initialDeveloperReputation = await reputationContract.getUserReputation(developer.address);
      
      await mindToken.connect(developer).approve(await escrowContract.getAddress(), ethers.parseEther("1000"));
      
      const datasetHash = "QmTest123...";
      const proofHash = "QmProof456...";
      
      await escrowContract.connect(developer).createJob(JOB_AMOUNT, datasetHash);
      await escrowContract.connect(provider).acceptJob(1);
      await escrowContract.connect(provider).submitCompletion(1, proofHash);
      await escrowContract.connect(developer).approveJob(1);
      
      // Manually update reputation (in real scenario, this would be done by the escrow contract)
      await reputationContract.updateJobReputation(
        provider.address,
        developer.address,
        true, // successful
        JOB_AMOUNT
      );
      
      const finalProviderReputation = await reputationContract.getUserReputation(provider.address);
      const finalDeveloperReputation = await reputationContract.getUserReputation(developer.address);
      
      // Provider should gain reputation for successful job
      expect(finalProviderReputation.score).to.be.greaterThan(initialProviderReputation.score);
      expect(finalProviderReputation.successfulJobs).to.equal(1);
      
      // Developer should get small bonus
      expect(finalDeveloperReputation.score).to.be.greaterThan(initialDeveloperReputation.score);
    });
  });

  describe("Security Tests", function () {
    it("Should not allow non-authorized addresses to manage reputation", async function () {
      await expect(
        reputationContract.connect(provider).updateJobReputation(
          provider.address,
          developer.address,
          true,
          JOB_AMOUNT
        )
      ).to.be.revertedWith("Reputation: not authorized");
    });

    it("Should not allow non-arbitrators to resolve disputes", async function () {
      const datasetHash = "QmTest123...";
      await mindToken.connect(developer).approve(await escrowContract.getAddress(), ethers.parseEther("1000"));
      
      await escrowContract.connect(developer).createJob(JOB_AMOUNT, datasetHash);
      await escrowContract.connect(provider).acceptJob(1);
      await escrowContract.connect(developer).createDispute(1, "Test dispute");
      
      await expect(
        escrowContract.connect(developer).resolveDispute(1, provider.address)
      ).to.be.revertedWith("Escrow: not an arbitrator");
    });

    it("Should not allow job creation below minimum amount", async function () {
      const tooSmallAmount = ethers.parseEther("0.5"); // Below 1 MIND minimum
      await mindToken.connect(developer).approve(await escrowContract.getAddress(), tooSmallAmount + (tooSmallAmount * 250n) / 10000n);
      
      await expect(
        escrowContract.connect(developer).createJob(tooSmallAmount, "QmTest123...")
      ).to.be.revertedWith("Escrow: amount below minimum");
    });
  });
});
