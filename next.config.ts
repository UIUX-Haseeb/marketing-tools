import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cross-origin isolation lets the in-browser background remover (ONNX runtime wasm) use
  // SharedArrayBuffer and run multi-threaded — several times faster than the single-thread
  // fallback. `credentialless` keeps same-origin assets working without extra CORP headers.
  // Everything this app loads is same-origin, so nothing else is affected.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // The model + wasm chunks are content-addressed (sha256 names): cache them for good.
        source: "/tools/_shared/bg-removal/:hash([a-f0-9]{64})",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
