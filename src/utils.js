export function GetIpfsUrlFromPinata(url) {
    if (!url || typeof url !== "string") return ""; // <-- Guard clause
  
    const parts = url.split("/");
    const lastSegment = parts[parts.length - 1];
    return `https://gateway.pinata.cloud/ipfs/${lastSegment}`;
  }
  