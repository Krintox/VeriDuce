import Navbar from "./Navbar";
import NFTTile from "./NFTTile";
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState, useEffect } from "react";
import { GetIpfsUrlFromPinata } from "../utils";

export default function Marketplace() {
  const [data, updateData] = useState([]);
  const [dataFetched, updateFetched] = useState(false);

  async function getAllNFTs() {
    try {
      const ethers = require("ethers");
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        MarketplaceJSON.address,
        MarketplaceJSON.abi,
        signer
      );
      const transaction = await contract.getAllNFTs();

      const items = await Promise.all(
        transaction.map(async (i) => {
          let tokenURI = await contract.tokenURI(i.tokenId);
          tokenURI = GetIpfsUrlFromPinata(tokenURI);
          let meta = await axios.get(tokenURI);
          meta = meta.data;

          let price = ethers.utils.formatUnits(i.price.toString(), "ether");
          let item = {
            price,
            tokenId: i.tokenId.toNumber(),
            seller: i.seller,
            owner: i.owner,
            image: meta.image,
            name: meta.name,
            description: meta.description,
          };
          return item;
        })
      );

      updateData(items);
      updateFetched(true);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
    }
  }

  useEffect(() => {
    if (!dataFetched) {
      getAllNFTs();
    }
  }, [dataFetched]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0c29] via-[#302b63] to-[#24243e] text-white font-sans">
      <Navbar />
      <section className="container mx-auto px-4 pt-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold leading-tight mb-4">
            Discover, Collect & Sell Carbon <span className="text-purple-400">Credits</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto text-lg">
            Join the digital revolution in transparent and trustworthy carbon credit trading.
          </p>
          <button className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-medium transition">
            Start Trading
          </button>
        </div>

        <h2 className="text-3xl font-semibold mb-6">🔥 Live Auctions</h2>
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.length > 0 ? (
            data.map((nft, index) => <NFTTile key={index} data={nft} />)
          ) : (
            <div className="col-span-full text-center text-gray-400">
              No Carbon Credits found or loading...
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
