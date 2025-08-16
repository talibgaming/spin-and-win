/* app/frames/route.tsx */
import { frames } from "./frames";
import { Button } from "frames.js/next";
import { validateFrameMessage } from "frames.js"; // server-side signature validation
import { sendRewardETH } from "@/lib/payout";
import { canSpin } from "@/lib/rateLimit";
import { pickWin, short } from "@/lib/utils";

const REWARD_ETH = "0.001"; // tweak to taste
const SPIN_PROBABILITY = 0.15; // 15% win rate

const handle = frames(async (ctx) => {
  // Initial GET: show an image + Spin button
  if (ctx.request.method === "GET") {
    return {
      image: (
        <div
          style={{
            display: "flex",
            height: "100%",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 56,
          }}
        >
          🎡 Spin & Win on Base
        </div>
      ),
      buttons: [<Button action="post">Spin</Button>],
    };
  }

  // POST: user pressed a button → verify signature & process
  const body = await ctx.request.json();
  const { isValid, message } = await validateFrameMessage(body); // queries a hub
  if (!isValid || !message) {
    return {
      image: <span>Invalid action. Please try again.</span>,
    };
  }

  const fid = message.data.fid?.toString();
  // Connected wallet (if provided by client)
  const connectedAddress =
    // vNext spec includes address in frame action; some clients omit if no wallet
    (message.data.frameActionBody as any)?.address || undefined;

  if (!connectedAddress) {
    return {
      image: (
        <div style={{ fontSize: 48, padding: 24 }}>
          Connect a wallet in Warpcast, then try again.
        </div>
      ),
    };
  }

  // Rate limit by fid (or address)
  const limiterKey = fid || connectedAddress.toLowerCase();
  if (!canSpin(limiterKey, 30)) {
    return {
      image: <span>⏳ You’re spinning too fast. Try again in a bit.</span>,
    };
  }

  // Decide outcome server-side (authoritative)
  const won = pickWin(SPIN_PROBABILITY);
  if (!won) {
    return {
      image: (
        <div style={{ fontSize: 56 }}>
          😕 No win this time. Good luck next spin!
        </div>
      ),
      buttons: [<Button>Close</Button>],
    };
  }

  // WIN: send reward from sponsor wallet
  let txHash = "";
  try {
    txHash = await sendRewardETH(connectedAddress, REWARD_ETH);
  } catch (e: any) {
    return {
      image: (
        <div style={{ fontSize: 48, padding: 24 }}>
          Payout error: {e?.message || "unknown"}. Try again later.
        </div>
      ),
    };
  }

  const baseScan = `https://basescan.org/tx/${txHash}`;
  return {
    image: (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 56 }}>🎉 You won {REWARD_ETH} ETH!</div>
        <div style={{ fontSize: 36 }}>Tx: {short(txHash)}</div>
        <div style={{ fontSize: 28 }}>{baseScan}</div>
      </div>
    ),
    buttons: [<Button>Nice!</Button>],
  };
});

export const GET = handle;
export const POST = handle;
