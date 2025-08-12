const { ethers } = require("ethers");

let provider, wallet;

function getWallet() {
  const RPC_URL = process.env.RPC_URL || "https://mainnet.base.org";
  const PK = process.env.PRIVATE_KEY;
  if (!PK) throw new Error("Missing PRIVATE_KEY");
  if (!provider) provider = new ethers.JsonRpcProvider(RPC_URL);
  if (!wallet) wallet = new ethers.Wallet(PK, provider);
  return wallet;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { address, result } = req.body || {};

    if (!address || !result) {
      return res.status(400).json({ error: "Missing fields: address, result" });
    }
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: "Invalid address" });
    }
    if (result !== "win") {
      return res.status(200).json({ success: false, message: "No reward" });
    }

    const amount = process.env.DEFAULT_REWARD_ETH || "0.0001";
    const tx = await getWallet().sendTransaction({
      to: address,
      value: ethers.parseEther(String(amount))
    });

    return res.status(200).json({
      success: true,
      txHash: tx.hash,
      amountEth: amount
    });
  } catch (e) {
    return res.status(500).json({
      error: "Failed to process payout",
      details: e.message
    });
  }
};
