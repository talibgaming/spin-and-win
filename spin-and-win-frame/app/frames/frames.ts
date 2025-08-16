// app/frames/frames.ts
import { createFrames } from "frames.js/next";
// Optional: validate+augment with Neynar middleware
// import { neynarValidate } from "frames.js/middleware/neynar";

export const frames = createFrames({
  basePath: "/frames",
  // middleware: [
  //   neynarValidate({ apiKey: process.env.NEYNAR_API_KEY! }), // optional
  // ],
});
