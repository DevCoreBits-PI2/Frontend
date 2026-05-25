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
  ]),
  {
    // Bajamos a warning las reglas que el codebase usa intencionalmente.
    // No las desactivamos del todo para que sigan siendo visibles, pero
    // dejan de bloquear el panel "Problems" como errores.
    rules: {
      // Patrón usado en casi todas las páginas: useEffect → fetch → setState.
      // Es válido y deliberado en este proyecto.
      "react-hooks/set-state-in-effect": "off",

      // El proyecto no usa next/image (tendría que refactorizarse todo).
      "@next/next/no-img-element": "off",

      // any preexistente en algunos formularios; warning para no perderlos
      // de vista pero sin marcar como error.
      "@typescript-eslint/no-explicit-any": "warn",

      // Comillas literales en JSX: warning, no error.
      "react/no-unescaped-entities": "warn",

      // Dependencias faltantes en useEffect: warning (a veces son intencionales).
      "react-hooks/exhaustive-deps": "warn",

      // Variables prefijadas con _ se consideran ignoradas intencionalmente.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
]);

export default eslintConfig;
