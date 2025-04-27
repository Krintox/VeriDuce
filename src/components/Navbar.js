import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const [connected, toggleConnect] = useState(false);
  const location = useLocation();
  const [currAddress, updateAddress] = useState("0x");

  async function getAddress() {
    const ethers = require("ethers");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const addr = await signer.getAddress();
    updateAddress(addr);
  }

  function updateButton() {
    const ethereumButton = document.querySelector(".enableEthereumButton");
    if (ethereumButton) ethereumButton.textContent = "Connected";
  }

  async function connectWebsite() {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId !== "0xaa36a7") {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }],
      });
    }
    await window.ethereum.request({ method: "eth_requestAccounts" });
    updateButton();
    getAddress();
    window.location.replace(location.pathname);
  }

  useEffect(() => {
    if (window.ethereum === undefined) return;
    const isConnected = window.ethereum.isConnected();
    if (isConnected) {
      getAddress();
      toggleConnect(true);
      updateButton();
    }

    window.ethereum.on("accountsChanged", function () {
      window.location.replace(location.pathname);
    });
  }, []);

  return (
    <nav className="bg-gradient-to-r from-[#1e1e2f] via-[#2a2a45] to-[#1c1c2e] shadow-lg py-4 px-8 text-white font-medium">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-extrabold tracking-wide text-purple-400 hover:text-purple-300 transition">
          VeriDuce
        </Link>

        {/* Navigation Links */}
        <ul className="flex gap-8 items-center text-md">
          <li className={location.pathname === "/" ? "border-b-2 border-purple-500 pb-1" : "hover:text-purple-400"}>
            <Link to="/">Marketplace</Link>
          </li>
          <li className={location.pathname === "/sellNFT" ? "border-b-2 border-purple-500 pb-1" : "hover:text-purple-400"}>
            <Link to="/sellNFT">List My Credits</Link>
          </li>
          <li className={location.pathname === "/profile" ? "border-b-2 border-purple-500 pb-1" : "hover:text-purple-400"}>
            <Link to="/profile">Profile</Link>
          </li>
          <li>
            <button
              className={`enableEthereumButton transition-all px-4 py-2 rounded-xl font-semibold text-sm shadow-md ${
                connected
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
              onClick={connectWebsite}
            >
              {connected ? "Connected" : "Connect Wallet"}
            </button>
          </li>
        </ul>
      </div>

      {/* Wallet Address Display */}
      <div className="text-right text-sm mt-2 pr-2 text-gray-400">
        {currAddress !== "0x"
          ? `Connected to ${currAddress.substring(0, 15)}...`
          : "Not Connected. Please login to view Carbon Credits"}
      </div>
    </nav>
  );
}

export default Navbar;
