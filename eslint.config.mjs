import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  {
    rules: {
      "react/no-unescaped-entities": "off",

      // Estas regras pertencem ao conjunto de validações do React Compiler.
      // O Compiler não é necessário para executar React 19/Next 16 e o código
      // legado ainda será modernizado em lotes menores para evitar regressões.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      "react-hooks/static-components": "off",
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
  globalIgnores([
    ".next/**",
    ".next-build/**",
    ".next-preview/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);
