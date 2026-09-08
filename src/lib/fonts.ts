// Brand typography — Google Sans Flex is the only typeface. Self-hosted.
// Weight logic: 300 everything, 400 headers only, 500 tracked caps (kickers) only.
import localFont from "next/font/local";

export const googleSansFlex = localFont({
  variable: "--font-google-sans",
  display: "swap",
  src: [
    { path: "../fonts/GoogleSansFlex-300.woff2", weight: "300", style: "normal" },
    { path: "../fonts/GoogleSansFlex-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/GoogleSansFlex-500.woff2", weight: "500", style: "normal" },
  ],
});
