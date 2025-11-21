import React, { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { ethers } from "ethers";

/**
 * App.jsx — main Mini App UI
 *
 * Environment:
 * - Vite exposes env vars via import.meta.env.VITE_APP_DOMAIN and VITE_IPFS_GATEWAY
 * - Replace VITE_APP_DOMAIN in .env for your GitHub Pages domain (or use the placeholder in public/.well-known/farcaster.json)
 *
 * Behavior:
 * - Connects to the host's Ethereum provider via the Farcaster SDK
 * - Scans Transfer logs to find tokenIds sent to the connected address
 * - Reads tokenURI for each tokenId and tries to find an attribute named "version"
 * - Shows owned versions and allows user to mint (attempts common Manifold functions)
 */

const CONTRACT_ADDRESS = "0x3453f1b85A6b4B44E76B66793eF5D43eB54A2037";

// Full ABI (paste here exactly). This is the ABI you provided earlier.
const CONTRACT_ABI = [
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"AdminApproved","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"AdminRevoked","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"extension","type":"address"}],"name":"ApproveTransferUpdated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"address payable[]","name":"receivers","type":"address[]"},{"indexed":false,"internalType":"uint256[]","name":"basisPoints","type":"uint256[]"}],"name":"DefaultRoyaltiesUpdated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"extension","type":"address"},{"indexed":false,"internalType":"bool","name":"enabled","type":"bool"}],"name":"ExtensionApproveTransferUpdated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"extension","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"ExtensionBlacklisted","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"extension","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"ExtensionRegistered","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"extension","type":"address"},{"indexed":false,"internalType":"address payable[]","name":"receivers","type":"address[]"},{"indexed":false,"internalType":"uint256[]","name":"basisPoints","type":"uint256[]"}],"name":"ExtensionRoyaltiesUpdated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"extension","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"ExtensionUnregistered","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"extension","type":"address"},{"indexed":true,"internalType":"address","name":"permissions","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"MintPermissionsUpdated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"address payable[]","name":"receivers","type":"address[]"},{"indexed":false,"internalType":"uint256[]","name":"basisPoints","type":"uint256[]"}],"name":"RoyaltiesUpdated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},
  {"inputs":[],"name":"VERSION","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"admin","type":"address"}],"name":"approveAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"extension","type":"address"}],"name":"blacklistExtension","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"getAdmins","outputs":[{"internalType":"address[]","name":"admins","type":"address[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getApproveTransfer","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getExtensions","outputs":[{"internalType":"address[]","name":"extensions","type":"address[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getFeeBps","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getFeeRecipients","outputs":[{"internalType":"address payable[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getFees","outputs":[{"internalType":"address payable[]","name":"","type":"address[]"},{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"string","name":"_name","type":"string"},{"internalType":"string","name":"_symbol","type":"string"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"admin","type":"address"}],"name":"isAdmin","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"mintBase","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"string","name":"uri","type":"string"}],"name":"mintBase","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"string[]","name":"uris","type":"string[]"}],"name":"mintBaseBatch","outputs":[{"internalType":"uint256[]","name":"tokenIds","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint16","name":"count","type":"uint16"}],"name":"mintBaseBatch","outputs":[{"internalType":"uint256[]","name":"tokenIds","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"mintExtension","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint80","name":"data","type":"uint80"}],"name":"mintExtension","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"string","name":"uri","type":"string"}],"name":"mintExtension","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"string[]","name":"uris","type":"string[]"}],"name":"mintExtensionBatch","outputs":[{"internalType":"uint256[]","name":"tokenIds","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint80[]","name":"data","type":"uint80[]"}],"name":"mintExtensionBatch","outputs":[{"internalType":"uint256[]","name":"tokenIds","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint16","name":"count","type":"uint16"}],"name":"mintExtensionBatch","outputs":[{"internalType":"uint256[]","name":"tokenIds","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"extension","type":"address"},{"internalType":"string","name":"baseURI","type":"string"}],"name":"registerExtension","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"extension","type":"address"},{"internalType":"string","name":"baseURI","type":"string"},{"internalType":"bool","name":"baseURIIdentical","type":"bool"}],"name":"registerExtension","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"admin","type":"address"}],"name":"revokeAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"royaltyInfo","outputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"extension","type":"address"}],"name":"setApproveTransfer","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"bool","name":"enabled","type":"bool"}],"name":"setApproveTransferExtension","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"string","name":"uri","type":"string"}],"name":"setBaseTokenURI","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"string","name":"uri","type":"string"}],"name":"setBaseTokenURIExtension","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"string","name":"uri","type":"string"},{"internalType":"bool","name":"identical","type":"bool"}],"name":"setBaseTokenURIExtension","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"extension","type":"address"},{"internalType":"address","name":"permissions","type":"address"}],"name":"setMintPermissions","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"address payable[]","name":"receivers","type":"address[]"},{"internalType":"uint256[]","name":"basisPoints","type":"uint256[]"}],"name":"setRoyalties","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address payable[]","name":"receivers","type":"address[]"},{"internalType":"uint256[]","name":"basisPoints","type":"uint256[]"}],"name":"setRoyalties","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"extension","type":"address"},{"internalType":"address payable[]","name":"receivers","type":"address[]"},{"internalType":"uint256[]","name":"basisPoints","type":"uint256[]"}],"name":"setRoyaltiesExtension","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"string","name":"uri","type":"string"}],"name":"setTokenURI","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256[]","name":"tokenIds","type":"uint256[]"},{"internalType":"string[]","name":"uris","type":"string[]"}],"name":"setTokenURI","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256[]","name":"tokenIds","type":"uint256[]"},{"internalType":"string[]","name":"uris","type":"string[]"}],"name":"setTokenURIExtension","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256[]","name":"tokenIds","type":"uint256[]"},{"internalType":"string[]","name":"uris","type":"string[]"}],"name":"setTokenURIExtension","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"string","name":"uri","type":"string"}],"name":"setTokenURIExtension","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"string","name":"prefix","type":"string"}],"name":"setTokenURIPrefix","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"string","name":"prefix","type":"string"}],"name":"setTokenURIPrefixExtension","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenData","outputs":[{"internalType":"uint80","name":"","type":"uint80"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenExtension","outputs":[{"internalType":"address","name":"extension","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"extension","type":"address"}],"name":"unregisterExtension","outputs":[],"stateMutability":"nonpayable","type":"function"}
];

const IPFS_GATEWAY = import.meta.env.VITE_IPFS_GATEWAY || "https://ipfs.io/ipfs/";
const APP_DOMAIN = import.meta.env.VITE_APP_DOMAIN || "https://YOUR_GITHUB_PAGES_DOMAIN";

export default function App() {
  const [ready, setReady] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState(null);
  const [ownedTokens, setOwnedTokens] = useState([]);
  const [status, setStatus] = useState("");
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await sdk.actions.ready();
        setReady(true);
      } catch (e) {
        console.warn("sdk.actions.ready() failed", e);
      }
    })();
  }, []);

  async function connectAndScan() {
    setStatus("Connecting to wallet...");
    try {
      const ethProvider = await sdk.wallet.getEthereumProvider();
      const ethersProvider = new ethers.providers.Web3Provider(ethProvider);
      const signerLocal = ethersProvider.getSigner();
      const addr = await signerLocal.getAddress();

      setProvider(ethersProvider);
      setSigner(signerLocal);
      setAddress(addr);
      setStatus(`Connected: ${addr}`);

      await detectOwnedTokens(addr, ethersProvider);
    } catch (e) {
      console.error(e);
      setStatus("Connect failed: " + (e?.message || e));
    }
  }

  async function detectOwnedTokens(ownerAddr, ethersProvider) {
    setScanning(true);
    setStatus("Scanning Transfer logs (this may take a moment)...");
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, ethersProvider);
      const transferTopic = ethers.id("Transfer(address,address,uint256)");
      const ownerTopic = ethers.hexZeroPad(ownerAddr, 32);

      const filter = {
        address: CONTRACT_ADDRESS,
        topics: [transferTopic, null, ownerTopic],
        fromBlock: 0
      };

      const logs = await ethersProvider.getLogs(filter);
      const tokenIds = logs.map((l) => ethers.BigNumber.from(l.topics[3]).toString());
      const uniqueIds = [...new Set(tokenIds)];

      const results = [];

      for (const id of uniqueIds) {
        try {
          const curOwner = await contract.ownerOf(id);
          if (curOwner.toLowerCase() !== ownerAddr.toLowerCase()) continue;

          let uri = await contract.tokenURI(id);
          if (!uri) {
            results.push({ tokenId: id, version: `token-${id}` });
            continue;
          }

          if (uri.startsWith("ipfs://")) {
            uri = uri.replace("ipfs://", IPFS_GATEWAY);
          } else if (uri.startsWith("ipfs/")) {
            uri = uri.replace("ipfs/", IPFS_GATEWAY);
          }

          let meta = null;
          try {
            const resp = await fetch(uri);
            if (resp.ok) meta = await resp.json();
          } catch (err) {
            console.warn("Failed to fetch metadata", uri, err);
          }

          let version = null;
          if (meta) {
            const attrs = meta.attributes || meta.traits || [];
            for (const a of attrs) {
              const key = (a.trait_type || a.type || "").toLowerCase();
              if (key === "version") {
                version = a.value;
                break;
              }
              if (key === "type" && ["OG","Slime","Smoke","Mud","Water","Wood"].includes(String(a.value))) {
                version = a.value;
                break;
              }
            }
            if (!version && typeof meta.name === "string") {
              const found = ["OG","Slime","Smoke","Mud","Water","Wood"].find((v) =>
                meta.name.includes(v)
              );
              if (found) version = found;
            }
          }
          if (!version) version = meta?.name || `token-${id}`;
          results.push({ tokenId: id, version });
        } catch (e) {
          console.warn("Error for token", id, e);
        }
      }

      setOwnedTokens(results);
      setStatus(results.length ? `Found ${results.length} token(s)` : "No owned tokens found");
    } catch (e) {
      console.error(e);
      setStatus("Detection failed: " + (e?.message || e));
    } finally {
      setScanning(false);
    }
  }

  async function mint(quantity = 1) {
    if (!signer) {
      setStatus("Connect wallet first.");
      return;
    }
    setStatus("Attempting mint...");
    try {
      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const me = await signer.getAddress();

      // Try common Manifold entry points in order
      try {
        if (typeof contractWithSigner.mintBase === "function") {
          setStatus("Calling mintBase(address) …");
          const tx = await contractWithSigner.mintBase(me);
          setStatus(`Mint tx sent: ${tx.hash}, waiting...`);
          await tx.wait();
          setStatus("Mint confirmed. Refreshing ownership.");
          await detectOwnedTokens(me, signer.provider);
          return;
        }
      } catch (e) {
        console.warn("mintBase failed:", e);
      }

      try {
        if (typeof contractWithSigner.mintExtension === "function") {
          setStatus("Calling mintExtension(address) …");
          const tx = await contractWithSigner.mintExtension(me);
          setStatus(`Mint tx sent: ${tx.hash}, waiting...`);
          await tx.wait();
          setStatus("Mint confirmed. Refreshing ownership.");
          await detectOwnedTokens(me, signer.provider);
          return;
        }
      } catch (e) {
        console.warn("mintExtension failed:", e);
      }

      try {
        if (typeof contractWithSigner.mintBaseBatch === "function") {
          setStatus("Calling mintBaseBatch(address, count) …");
          const tx = await contractWithSigner.mintBaseBatch(me, quantity);
          setStatus(`Mint tx sent: ${tx.hash}, waiting...`);
          await tx.wait();
          setStatus("Mint confirmed. Refreshing ownership.");
          await detectOwnedTokens(me, signer.provider);
          return;
        }
      } catch (e) {
        console.warn("mintBaseBatch failed:", e);
      }

      setStatus("No supported public mint function succeeded. Check contract permissions or provide exact mint signature.");
    } catch (e) {
      console.error("Mint attempt failed", e);
      setStatus("Mint failed: " + (e?.message || e));
    }
  }

  function play() {
    if (!selectedVersion) {
      setStatus("Select a version first.");
      return;
    }
    const url = `${APP_DOMAIN.replace(/\/$/, "")}/play?version=${encodeURIComponent(selectedVersion)}`;
    sdk.actions.openUrl(url);
  }

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <h1>Gnomie Runner — Mini App</h1>

      <div style={{ marginBottom: 12 }}>
        <button onClick={connectAndScan}>Connect Wallet & Detect</button>
        <button onClick={() => mint(1)} style={{ marginLeft: 8 }}>
          Mint (in-app)
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Status:</strong> {status} {scanning ? "(scanning logs…)" : ""}
      </div>

      <div style={{ marginTop: 18 }}>
        <h3>Your owned versions</h3>
        {ownedTokens.length === 0 ? (
          <div>No owned tokens detected.</div>
        ) : (
          <ul>
            {ownedTokens.map((t) => (
              <li key={t.tokenId}>
                <label>
                  <input
                    type="radio"
                    name="version"
                    value={t.version}
                    checked={selectedVersion === t.version}
                    onChange={() => setSelectedVersion(t.version)}
                  />{" "}
                  {t.version} (token #{t.tokenId})
                </label>
              </li>
            ))}
          </ul>
        )}
        <div style={{ marginTop: 12 }}>
          <button onClick={play} disabled={!selectedVersion}>
            Play selected version
          </button>
        </div>
      </div>

      <div style={{ marginTop: 24, color: "#666", fontSize: 13 }}>
        <div>Contract: {CONTRACT_ADDRESS}</div>
        <div>App domain: {APP_DOMAIN}</div>
        <div>
          Note: Replace `public/.well-known/farcaster.json` accountAssociation with a signed object
          from Farcaster Developer Tools before trying to add the Mini App.
        </div>
      </div>
    </div>
  );
}
