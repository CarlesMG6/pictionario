import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Usar compat.extends para obtener los extends como array
const extendsArr = compat.extends("next/core-web-vitals", "next/typescript");

export default {
  extends: extendsArr.map(e => (typeof e === 'string' ? e : e.extends)).flat(),
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
