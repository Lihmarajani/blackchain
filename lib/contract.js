
import { ethers } from "ethers";
import LandVerificationArtifact from "./contracts/LandVerification.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const EXPECTED_CHAIN_ID = 11155111n;

const CONTRACT_ABI = LandVerificationArtifact.abi;

export function getContractAddress() {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "NEXT_PUBLIC_CONTRACT_ADDRESS is missing from .env.local."
    );
  }

  if (!ethers.isAddress(CONTRACT_ADDRESS)) {
    throw new Error("The configured contract address is invalid.");
  }

  return CONTRACT_ADDRESS;
}

export async function getReadOnlyContract() {
  const address = getContractAddress();

  // Read-only access through a public Sepolia RPC.
  const provider = new ethers.JsonRpcProvider(
    "https://ethereum-sepolia-rpc.publicnode.com"
  );

  const network = await provider.getNetwork();

  if (network.chainId !== EXPECTED_CHAIN_ID) {
    throw new Error(
      `Wrong RPC network. Expected Sepolia (${EXPECTED_CHAIN_ID}), received ${network.chainId}.`
    );
  }

  const contract = new ethers.Contract(
    address,
    CONTRACT_ABI,
    provider
  );

  // Confirm the address contains deployed contract code.
  const code = await provider.getCode(address);

  if (code === "0x") {
    throw new Error(
      "No deployed contract code was found at the configured address."
    );
  }

  return { provider, contract, network };
}

export async function getWalletContract() {
  if (typeof window === "undefined") {
    throw new Error("Wallet interaction can only be performed in the browser.");
  }

  // Handle multi-wallet environments (e.g. Phantom, Coinbase, MetaMask installed simultaneously)
  let ethereum = window.ethereum;
  if (ethereum?.providers?.length) {
    ethereum = ethereum.providers.find((p) => p.isMetaMask) || ethereum.providers[0];
  }

  if (!ethereum) {
    throw new Error(
      "MetaMask was not detected. Please install or enable the MetaMask extension, unlock your wallet, and refresh the page."
    );
  }

  // Request wallet connection / account access
  await ethereum.request({
    method: "eth_requestAccounts",
  });

  // Attempt automatic switch to Ethereum Sepolia (Chain ID 11155111 / 0xaa36a7)
  const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
    });
  } catch (switchError) {
    // Error 4902 indicates that the chain has not been added to MetaMask yet
    if (switchError.code === 4902) {
      try {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: SEPOLIA_CHAIN_ID_HEX,
              chainName: "Sepolia",
              nativeCurrency: {
                name: "Sepolia Ether",
                symbol: "SEP",
                decimals: 18,
              },
              rpcUrls: [
                "https://rpc.sepolia.org",
                "https://ethereum-sepolia-rpc.publicnode.com",
              ],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        });
      } catch (addError) {
        console.error("Failed to add Sepolia network:", addError);
      }
    } else if (switchError.code === 4001) {
      throw new Error(
        "Network switch request was rejected. Please switch MetaMask to Ethereum Sepolia (Chain ID 11155111)."
      );
    } else {
      console.warn("Could not automatically switch chain:", switchError);
    }
  }

  const provider = new ethers.BrowserProvider(ethereum);
  const network = await provider.getNetwork();

  if (network.chainId !== EXPECTED_CHAIN_ID) {
    throw new Error(
      "Please switch MetaMask to Ethereum Sepolia (Chain ID 11155111)."
    );
  }

  const signer = await provider.getSigner();
  const contract = new ethers.Contract(
    getContractAddress(),
    CONTRACT_ABI,
    signer
  );

  return { provider, signer, contract, network };
}
