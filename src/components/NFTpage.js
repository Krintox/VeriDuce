import Navbar from "./Navbar";
import { useParams } from "react-router-dom";
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState } from "react";
import { GetIpfsUrlFromPinata } from "../utils";

export default function NFTPage() {
  const [data, updateData] = useState({});
  const [dataFetched, updateDataFetched] = useState(false);
  const [message, updateMessage] = useState("");
  const [currAddress, updateCurrAddress] = useState("0x");

  async function getNFTData(tokenId) {
    const ethers = require("ethers");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const addr = await signer.getAddress();

    let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
    let tokenURI = await contract.tokenURI(tokenId);
    const listedToken = await contract.getListedTokenForId(tokenId);
    tokenURI = GetIpfsUrlFromPinata(tokenURI);
    let meta = await axios.get(tokenURI);
    meta = meta.data;

    let item = {
      price: meta.price,
      tokenId,
      seller: listedToken.seller,
      owner: listedToken.owner,
      image: GetIpfsUrlFromPinata(meta.image),
      name: meta.name,
      description: meta.description,
    };

    updateData(item);
    updateDataFetched(true);
    updateCurrAddress(addr);
  }

  async function buyNFT(tokenId) {
    try {
      const ethers = require("ethers");
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);

      const salePrice = ethers.utils.parseUnits(data.price, "ether");
      updateMessage("Buying the NFT... Please Wait (Up to 5 mins)");
      let transaction = await contract.executeSale(tokenId, { value: salePrice });
      await transaction.wait();

      alert("You successfully bought the NFT!");
      updateMessage("");
    } catch (e) {
      alert("Upload Error: " + e);
    }
  }

  const params = useParams();
  const tokenId = params.tokenId;

  if (!dataFetched) getNFTData(tokenId);

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white font-sans">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="flex justify-center">
          <img
            src={data.image}
            alt="NFT Preview"
            className="rounded-2xl shadow-xl border border-gray-700 w-full max-w-lg object-cover"
          />
        </div>

        <div className="space-y-6 p-8 bg-[#2d2d2d] border border-gray-700 rounded-2xl shadow-lg">
          <h2 className="text-3xl font-bold">{data.name}</h2>
          <p className="text-gray-300">Number of Carbon Credits: {data.description}</p>

          <div className="text-lg">
            <span className="font-semibold text-gray-400">Price:</span>{" "}
            <span className="text-emerald-400">{data.price} ETH</span>
          </div>

          <div className="text-sm">
            <span className="font-semibold text-gray-400">Owner:</span>{" "}
            <span className="text-gray-400">{data.owner}</span>
          </div>

          <div className="text-sm">
            <span className="font-semibold text-gray-400">Seller:</span>{" "}
            <span className="text-gray-400">{data.seller}</span>
          </div>

          {currAddress !== data.owner && currAddress !== data.seller ? (
            <button
              onClick={() => buyNFT(tokenId)}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 transition px-6 py-2 text-white font-semibold rounded-lg"
            >
              Buy these Carbon Credits 🌿
            </button>
          ) : (
            <div className="text-green-500 mt-4 font-semibold">
              You are the owner of these Carbon Credits.
            </div>
          )}

          {message && (
            <div className="text-center mt-4 text-yellow-400">{message}</div>
          )}
        </div>
      </div>
    </div>
  );
}
