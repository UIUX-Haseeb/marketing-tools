/* eslint-disable @next/next/no-img-element */
/**
 * The e-card's QR code: drawn as SVG modules (sharp at any export size), error correction H so the
 * Provident mark can sit in a white square in the middle — the square is module-aligned and
 * covers well under the ~30% of the code that H can lose. It encodes the agent's contact-page address
 * (contact.ts) or a link.
 */
import { useMemo } from "react";
import { encode } from "uqr";

export function QrCode({ text, logo, className }: { text: string; logo: string; className?: string }) {
  const { n, path, box } = useMemo(() => {
    // H and at least version 5 (37 × 37): a short contact-page link would otherwise make a code so
    // small that the logo square hides too much of it
    const { data, size } = encode(text || " ", { ecc: "H", minVersion: 5, border: 0 });
    // the logo square: ~30% of the side, centred on whole modules
    const bw = Math.max(7, Math.round(size * 0.3) | 1);
    const bh = bw;
    const bx = (size - bw) / 2;
    const by = (size - bh) / 2;
    let d = "";
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const inBox = x >= bx && x < bx + bw && y >= by && y < by + bh;
        if (data[y][x] && !inBox) d += `M${x} ${y}h1v1h-1z`;
      }
    }
    return { n: size, path: d, box: { x: bx, y: by, w: bw, h: bh } };
  }, [text]);

  return (
    <div className={className} style={{ position: "relative", aspectRatio: "1" }}>
      <svg viewBox={`0 0 ${n} ${n}`} width="100%" height="100%" shapeRendering="crispEdges" style={{ display: "block" }}>
        <path d={path} fill="#000" />
      </svg>
      <div
        style={{
          position: "absolute",
          left: `${(box.x / n) * 100}%`,
          top: `${(box.y / n) * 100}%`,
          width: `${(box.w / n) * 100}%`,
          height: `${(box.h / n) * 100}%`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img src={logo} alt="" style={{ height: "80%", width: "auto", display: "block" }} />
      </div>
    </div>
  );
}
