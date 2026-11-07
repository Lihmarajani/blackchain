
const { ethers, network } = require("hardhat");

async function main() {
  // Confirm the requested Hardhat network.
  if (network.name !== "sepolia") {
    throw new Error(
      `Wrong network: ${network.name}. Expected sepolia.`
    );
  }

  // Confirm the required environment variables exist.
  if (!process.env.SEPOLIA_RPC_URL) {
    throw new Error("SEPOLIA_RPC_URL is missing from .env.");
  }

  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error("DEPLOYER_PRIVATE_KEY is missing from .env.");
  }

  // Verify the actual RPC-connected blockchain.
  const provider = ethers.provider;
  const connectedNetwork = await provider.getNetwork();

  if (connectedNetwork.chainId !== 11155111n) {
    throw new Error(
      `Wrong chain ID: ${connectedNetwork.chainId}. Expected Sepolia (11155111).`
    );
  }

  const [deployer] = await ethers.getSigners();

  if (!deployer) {
    throw new Error("No deployer wallet is configured.");
  }

  const deployerAddress = await deployer.getAddress();
  const balance = await provider.getBalance(deployerAddress);

  console.log("Network:", network.name);
  console.log("Chain ID:", connectedNetwork.chainId.toString());
  console.log("Deployer address:", deployerAddress);
  console.log(
    "Deployer balance:",
    ethers.formatEther(balance),
    "Sepolia ETH"
  );

  if (balance === 0n) {
    throw new Error("The deployer has no Sepolia ETH.");
  }

  // The deployer becomes the initial administrator and registrar.
  const Factory = await ethers.getContractFactory(
    "LandVerification",
    deployer
  );

  console.log("Preparing deployment...");

  const contract = await Factory.deploy(deployerAddress);

  const deploymentTransaction = contract.deploymentTransaction();

  if (!deploymentTransaction) {
    throw new Error("Could not retrieve the deployment transaction.");
  }

  console.log(
    "Deployment transaction:",
    deploymentTransaction.hash
  );
  console.log("Waiting for transaction confirmation...");

  const receipt = await deploymentTransaction.wait();

  if (!receipt || receipt.status !== 1) {
    throw new Error("Deployment transaction failed.");
  }

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log("Deployment confirmed.");
  console.log("Contract address:", contractAddress);
  console.log(
    "Transaction:",
    `https://sepolia.etherscan.io/tx/${deploymentTransaction.hash}`
  );
  console.log(
    "Contract explorer:",
    `https://sepolia.etherscan.io/address/${contractAddress}`
  );
  console.log("Initial administrator:", deployerAddress);
  console.log("Save the contract address for frontend configuration.");
}

main().catch((error) => {
  console.error("Deployment failed:", error.shortMessage || error.message);
  process.exitCode = 1;
});
