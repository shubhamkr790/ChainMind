import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Starting ChainMind Smart Contract Deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log(`📍 Deploying contracts with account: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH\n`);

  // Configuration
  const INITIAL_SUPPLY = ethers.parseEther("1000000000"); // 1 billion MIND tokens
  const FEE_COLLECTOR = deployer.address; // Use deployer as initial fee collector
  
  console.log("📋 Deployment Configuration:");
  console.log(`   Initial Supply: ${ethers.formatEther(INITIAL_SUPPLY)} MIND`);
  console.log(`   Fee Collector: ${FEE_COLLECTOR}\n`);

  // Deploy ChainMind Token
  console.log("1️⃣ Deploying ChainMind Token (MIND)...");
  const ChainMindToken = await ethers.getContractFactory("ChainMindToken");
  const mindToken = await ChainMindToken.deploy(
    deployer.address,  // initial owner
    FEE_COLLECTOR,     // fee collector
    INITIAL_SUPPLY     // initial supply
  );
  await mindToken.waitForDeployment();
  const tokenAddress = await mindToken.getAddress();
  console.log(`✅ ChainMind Token deployed to: ${tokenAddress}\n`);

  // Deploy ChainMind Reputation
  console.log("2️⃣ Deploying ChainMind Reputation...");
  const ChainMindReputation = await ethers.getContractFactory("ChainMindReputation");
  const reputationContract = await ChainMindReputation.deploy(
    deployer.address  // initial owner
  );
  await reputationContract.waitForDeployment();
  const reputationAddress = await reputationContract.getAddress();
  console.log(`✅ ChainMind Reputation deployed to: ${reputationAddress}\n`);

  // Deploy ChainMind Escrow
  console.log("3️⃣ Deploying ChainMind Escrow...");
  const ChainMindEscrow = await ethers.getContractFactory("ChainMindEscrow");
  const escrowContract = await ChainMindEscrow.deploy(
    tokenAddress,      // MIND token address
    FEE_COLLECTOR,     // fee collector
    deployer.address   // initial owner
  );
  await escrowContract.waitForDeployment();
  const escrowAddress = await escrowContract.getAddress();
  console.log(`✅ ChainMind Escrow deployed to: ${escrowAddress}\n`);

  // Initial configuration
  console.log("⚙️ Setting up initial configuration...");
  
  // Authorize escrow contract to manage reputation
  console.log("   • Authorizing escrow as reputation manager...");
  await reputationContract.setReputationManager(escrowAddress, true);
  
  // Authorize escrow contract to mint tokens (for rewards)
  console.log("   • Authorizing escrow as token minter...");
  await mindToken.setMinterAuthorization(escrowAddress, true);
  
  // Set deployer as initial arbitrator
  console.log("   • Setting deployer as initial arbitrator...");
  await escrowContract.setArbitrator(deployer.address, true);
  
  console.log("✅ Initial configuration completed!\n");

  // Deployment summary
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      ChainMindToken: {
        address: tokenAddress,
        initialSupply: ethers.formatEther(INITIAL_SUPPLY),
        feeCollector: FEE_COLLECTOR
      },
      ChainMindReputation: {
        address: reputationAddress,
        defaultReputation: "500",
        maxReputation: "1000"
      },
      ChainMindEscrow: {
        address: escrowAddress,
        tokenAddress: tokenAddress,
        feeCollector: FEE_COLLECTOR,
        platformFeeRate: "250" // 2.5%
      }
    },
    configuration: {
      escrowAuthorizedAsMinter: true,
      escrowAuthorizedAsReputationManager: true,
      deployerAsArbitrator: true
    }
  };

  console.log("📊 DEPLOYMENT SUMMARY");
  console.log("====================================");
  console.log(`🌐 Network: ${deploymentInfo.network} (Chain ID: ${deploymentInfo.chainId})`);
  console.log(`👤 Deployer: ${deploymentInfo.deployer}`);
  console.log(`📅 Timestamp: ${deploymentInfo.timestamp}\n`);
  
  console.log("📋 DEPLOYED CONTRACTS:");
  console.log(`🪙 ChainMind Token (MIND): ${tokenAddress}`);
  console.log(`⭐ ChainMind Reputation:   ${reputationAddress}`);
  console.log(`🔒 ChainMind Escrow:       ${escrowAddress}\n`);

  // Save deployment info to file
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const networkName = (await ethers.provider.getNetwork()).name;
  const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`💾 Deployment info saved to: ${deploymentFile}\n`);

  // Generate ABI files for frontend
  console.log("📝 Generating ABI files for frontend integration...");
  const abisDir = path.join(__dirname, "../abis");
  if (!fs.existsSync(abisDir)) {
    fs.mkdirSync(abisDir, { recursive: true });
  }

  // Get contract factories to extract ABIs
  const tokenABI = ChainMindToken.interface.format("json");
  const reputationABI = ChainMindReputation.interface.format("json");
  const escrowABI = ChainMindEscrow.interface.format("json");

  fs.writeFileSync(path.join(abisDir, "ChainMindToken.json"), JSON.stringify(JSON.parse(tokenABI as string), null, 2));
  fs.writeFileSync(path.join(abisDir, "ChainMindReputation.json"), JSON.stringify(JSON.parse(reputationABI as string), null, 2));
  fs.writeFileSync(path.join(abisDir, "ChainMindEscrow.json"), JSON.stringify(JSON.parse(escrowABI as string), null, 2));

  console.log("✅ ABI files generated in ./abis/ directory\n");

  // Verification instructions
  console.log("🔍 VERIFICATION INSTRUCTIONS:");
  console.log("====================================");
  console.log("To verify contracts on Polygonscan, run:");
  console.log(`npx hardhat verify --network ${networkName} ${tokenAddress} "${deployer.address}" "${FEE_COLLECTOR}" "${INITIAL_SUPPLY}"`);
  console.log(`npx hardhat verify --network ${networkName} ${reputationAddress} "${deployer.address}"`);
  console.log(`npx hardhat verify --network ${networkName} ${escrowAddress} "${tokenAddress}" "${FEE_COLLECTOR}" "${deployer.address}"`);
  console.log("");

  // Environment variables for backend/frontend
  console.log("🔧 ENVIRONMENT VARIABLES:");
  console.log("====================================");
  console.log("Add these to your .env files:");
  console.log(`NEXT_PUBLIC_CHAINMIND_TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`NEXT_PUBLIC_CHAINMIND_REPUTATION_ADDRESS=${reputationAddress}`);
  console.log(`NEXT_PUBLIC_CHAINMIND_ESCROW_ADDRESS=${escrowAddress}`);
  console.log(`CHAINMIND_TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`CHAINMIND_REPUTATION_ADDRESS=${reputationAddress}`);
  console.log(`CHAINMIND_ESCROW_ADDRESS=${escrowAddress}`);
  console.log("");

  console.log("🎉 ChainMind Smart Contract Deployment Completed Successfully!");
  console.log("Ready to revolutionize the AI compute marketplace! 🚀\n");
}

// Error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
