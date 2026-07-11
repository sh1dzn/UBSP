import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  js.configs.recommended,
  {
    ignores: ["**/*.ts", "**/*.tsx", ".next/**", "dist/**", "node_modules/**"],
  },
  globalIgnores([".next/**", "dist/**", "node_modules/**"]),
]);
