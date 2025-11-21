import React, { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { ethers } from "ethers";

/**
 * Minimal App for debugging build / upload issues.
 * - Calls sdk.actions.ready()
 * - Allows connecting the host wallet and shows address
 * - Keeps UI tiny so we can isolate the failure
 *
 * If this file commits and builds successfully, we know the failure was in the earlier
 * (larger) App.jsx content (likely a syntax/JSON/ABI issue).
 */

export default function App() {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("idle");
  const [address, setAddress] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        await sdk.actions.ready();
        setReady(true);
        setStatus("SDK ready");
      } catch (err) {
        console.warn("sdk.actions.ready() error:", err);
        setStatus("SDK ready failed");
      }
    })();
  }, []);

  async function connectWallet() {
    setStatus("Connecting wallet...");
    try {
      const ethProvider = await sdk.wallet.getEthereumProvider();
      const provider = new ethers.providers.Web3Provider(ethProvider);
      const signer = provider.getSigner();
      const addr = await signer.getAddress();
      setAddress(addr);
      setStatus("Connected");
    } catch (err) {
      console.error("connectWallet error:", err);
      setStatus("Connect failed: " + (err?.message || String(err)));
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, -apple-system, Arial" }}>
      <h1>Gnomie Runner — Mini App (debug)</h1>

      <div style={{ marginBottom: 12 }}>
        <button onClick={connectWallet}>Connect Wallet</button>
      </div>

      <div style={{ marginTop: 8 }}>
        <strong>SDK ready:</strong> {ready ? "yes" : "no"}
      </div>

      <div style={{ marginTop: 8 }}>
        <strong>Status:</strong> {status}
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Address:</strong> {address ?? "not connected"}
      </div>

      <div style={{ marginTop: 18, fontSize: 13, color: "#666" }}>
        If this file builds and deploys, we can safely reintroduce the full game logic/ABI.
      </div>
    </div>
  );
}
