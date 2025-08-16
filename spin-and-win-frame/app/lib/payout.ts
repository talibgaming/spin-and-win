// lib/payout.ts
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL!);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

export async function sendRewardETH(to: string, amountEth: string) {
  const tx = await signer.sendTransaction({
    to,
    value: ethers.parseEther(amountEth),
  });
  return tx.hash; // don't wait for confirmation
}
