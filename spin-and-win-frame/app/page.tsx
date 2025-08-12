// app/page.tsx
import { fetchMetadata } from "frames.js/next";

export async function generateMetadata() {
  return {
    title: "Spin & Win (Frame)",
    other: await fetchMetadata(new URL("/frames", process.env.NEXT_PUBLIC_HOST)),
  };
}

export default function Page() {
  return <div>Spin & Win is a Farcaster Frame. Open it in Warpcast.</div>;
}
