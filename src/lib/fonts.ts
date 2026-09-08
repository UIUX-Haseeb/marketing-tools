// Brand typography — self-hosted (no runtime Google Fonts).
// Google Sans Flex: display, body, UI.  Literata: editorial accent only (italic accent word, pull quotes).
import localFont from "next/font/local";

export const googleSansFlex = localFont({
  variable: "--font-google-sans",
  display: "swap",
  src: [
    { path: "../fonts/GoogleSansFlex-300.woff2", weight: "300", style: "normal" },
    { path: "../fonts/GoogleSansFlex-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/GoogleSansFlex-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/GoogleSansFlex-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/GoogleSansFlex-700.woff2", weight: "700", style: "normal" },
  ],
});

export const literata = localFont({
  variable: "--font-literata",
  display: "swap",
  src: [
    { path: "../fonts/Literata-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Literata-Italic.woff2", weight: "400", style: "italic" },
    { path: "../fonts/Literata-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/Literata-MediumItalic.woff2", weight: "500", style: "italic" },
  ],
});
