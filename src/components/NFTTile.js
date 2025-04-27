import { Link } from "react-router-dom";
import { GetIpfsUrlFromPinata } from "../utils";
import { FiMoreHorizontal } from "react-icons/fi";
import { useState } from "react";

function NFTTile({ data }) {
    const newTo = {
        pathname: "/nftPage/" + data.tokenId,
    };

    const IPFSUrl = GetIpfsUrlFromPinata(data.image);
      const [currAddress, updateAddress] = useState("0x");

      async function getAddress() {
        const ethers = require("ethers");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const addr = await signer.getAddress();
        updateAddress(addr);
      }


    return (
        <Link to={newTo} className="transform transition duration-300 hover:scale-105">
            <div className="bg-[#1e1b2e] rounded-3xl overflow-hidden shadow-xl w-[270px] flex flex-col border border-[#3a3a3a] text-white">
                {/* Top Section - User Info and More Icon */}
                <div className="flex items-center justify-between px-4 pt-4">
                    <div className="flex items-center space-x-2">
                        <img
                            src="https://avatars.githubusercontent.com/u/74071671?v=4"
                            alt="user"
                            className="w-8 h-8 rounded-full"
                        />
                        <span className="text-sm font-semibold">{`${currAddress.substring(0, 15)}...`}</span>
                    </div>
                    <FiMoreHorizontal className="text-lg text-gray-400" />
                </div>

                {/* NFT Image */}
                <img
                    src={IPFSUrl}
                    alt={data.name}
                    className="w-full h-60 object-cover rounded-xl mt-3 px-3"
                />

                {/* Timer */}
                {/* <div className="flex items-center justify-between px-4 py-2 mt-4">
                    <div className="flex items-center space-x-1 text-sm bg-white/10 px-3 py-1 rounded-full font-medium">
                        <span>48:20</span>
                        <span className="text-orange-400">left</span>
                        <span>🔥</span>
                    </div>
                </div> */}

                {/* Name & Price */}
                <div className="px-4 mt-1 mb-4">
                    <h3 className="font-bold text-md truncate">{data.name}</h3>
                    {/* <p className="text-sm text-gray-400 truncate">Highest bid 1/1</p> */}
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-[#59c4bd] font-semibold">{data.price} ETH</span>
                        <button className="bg-[#d946ef] hover:bg-[#c026d3] px-3 py-1 rounded-full text-sm font-medium transition-all">
                            Buy Credit
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default NFTTile;
