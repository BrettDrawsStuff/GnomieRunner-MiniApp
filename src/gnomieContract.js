import { ethers } from "ethers";

export const CONTRACT_ADDRESS = "0x3453f1b85A6b4B44E76B66793eF5D43eB54A2037";

// ABI (from your provided ABI) — includes tokenURI, ownerOf, mintBase, mintExtension, etc.
export const CONTRACT_ABI = [ /* ABI truncated in this helper; main ABI is included in App.jsx */ ];

// Helper to create contract instance
export function getContract(providerOrSigner) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, providerOrSigner);
}
