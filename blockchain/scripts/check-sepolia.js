
const { ethers, network } = require("hardhat");

async function main() {
  if (network.name !== "sepolia") {
    throw new Error(
      `Wrong network: ${network.name}. Run with --network sepolia.`
    );
  }

  if (!process.env.SEPOLIA_RPC_URL) {
    throw new Error("SEPOLIA_RPC_URL is missing from .env.");
  }

  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error("DEPLOYER_PRIVATE_KEY is missing from .env.");
  }

  const provider = ethers.provider;
  const connectedNetwork = await provider.getNetwork();

  if (connectedNetwork.chainId !== 11155111n) {
    throw new Error(
      `Unexpected chain ID: ${connectedNetwork.chainId}. Expected Sepolia (11155111).`
    );
  }

  const [deployer] = await ethers.getSigners();

  if (!deployer) {
    throw new Error("No deployer wallet is configured.");
  }

  const address = await deployer.getAddress();
  const balance = await provider.getBalance(address);

  console.log("RPC connection: successful");
  console.log("Network:", network.name);
  console.log("Chain ID:", connectedNetwork.chainId.toString());
  console.log("Deployer address:", address);
  console.log("Sepolia ETH balance:", ethers.formatEther(balance));

  if (balance === 0n) {
    throw new Error("Wallet has zero Sepolia ETH.");
  }

  console.log("Pre-deployment checks passed.");
}

main().catch((error) => {
  console.error("Check failed:", error.message);
  process.exitCode = 1;
});
