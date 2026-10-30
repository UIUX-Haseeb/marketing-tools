import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The designer's Business Card Studio, kept verbatim (vanilla browser JS, built by build.py).
    "src/tools/agent-kit/business-card/studio/**",
    "src/tools/agent-kit/business-card/embed.js",
    "public/**",
  ]),
]);

export default eslintConfig;
