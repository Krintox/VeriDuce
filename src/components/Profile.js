import Navbar from "./Navbar";
import { useParams } from 'react-router-dom';
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState } from "react";
import NFTTile from "./NFTTile";

export default function Profile () {
    const [data, updateData] = useState([]);
    const [dataFetched, updateFetched] = useState(false);
    const [address, updateAddress] = useState("0x");
    const [totalPrice, updateTotalPrice] = useState("0");

    async function getNFTData(tokenId) {
        const ethers = require("ethers");
        let sumPrice = 0;
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const addr = await signer.getAddress();
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer)

        let transaction = await contract.getMyNFTs()
        
        const items = await Promise.all(transaction.map(async i => {
            const tokenURI = await contract.tokenURI(i.tokenId);
            let meta = await axios.get(tokenURI);
            meta = meta.data;

            let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
            let item = {
                price,
                tokenId: i.tokenId.toNumber(),
                seller: i.seller,
                owner: i.owner,
                image: meta.image,
                name: meta.name,
                description: meta.description,
            }
            sumPrice += Number(price);
            return item;
        }))

        updateData(items);
        updateFetched(true);
        updateAddress(addr);
        updateTotalPrice(sumPrice.toPrecision(3));
    }

    const params = useParams();
    const tokenId = params.tokenId;
    if (!dataFetched) getNFTData(tokenId);

    return (
        <div className="min-h-screen bg-[#1a1a1a] text-white">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
                    <div className="bg-[#2d2d2d] p-6 rounded-2xl shadow-lg">
                        <h2 className="text-lg font-semibold text-gray-300 mb-2">Wallet Address</h2>
                        <p className="text-sm break-words text-gray-400">{address}</p>
                    </div>
                    <div className="bg-[#2d2d2d] p-6 rounded-2xl shadow-lg grid grid-cols-2 gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-300">No. of NFTs</h2>
                            <p className="text-2xl font-bold mt-2">{data.length}</p>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-300">Total Value</h2>
                            <p className="text-2xl font-bold mt-2">{totalPrice} ETH</p>
                        </div>
                    </div>
                </div>

                <div className="mt-16">
                    <h2 className="text-3xl font-bold mb-6 text-center">Your NFTs</h2>

                    {data.length === 0 ? (
                        <div className="text-center text-gray-400 text-xl mt-10">
                            Oops, No NFT data to display. (Are you logged in?)
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
                            {data.map((value, index) => (
                                <NFTTile data={value} key={index} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
