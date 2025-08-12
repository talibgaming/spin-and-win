// lib/utils.ts
export function pickWin(probability = 0.15) {
  return Math.random() < probability; // 15% default
}

export function short(txHash: string) {
  return txHash.slice(0, 6) + "…" + txHash.slice(-4);
}
