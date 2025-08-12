const { ethers } = require('ethers');
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)"
];

async function sendEth(to, amountEth) {
  const tx = await wallet.sendTransaction({ to, value: ethers.utils.parseEther(String(amountEth)) });
  return tx.hash; // don't wait on serverless
}
async function sendErc20(addr, to, amountTokens) {
  const erc20 = new ethers.Contract(addr, ERC20_ABI, wallet);
  const decimals = await erc20.decimals().catch(()=>18);
  const amt = ethers.utils.parseUnits(String(amountTokens), decimals);
  const tx = await erc20.transfer(to, amt);
  return tx.hash;
}
module.exports = { sendEth, sendErc20 };
