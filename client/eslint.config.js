import js from "@eslint/js";
import solid from "eslint-plugin-solid/configs/recommended";

export default [
  js.configs.recommended,
  solid,
  {
    files: ["src/*.jsx", "src/*.js"],
    rules: {
      "no-undef": "off"
    }
  }
];
