import {
  __commonJS,
  __toESM,
  require_recommended
} from "./chunk-5IRTCPIR.mjs";

// src/configs/typescript.ts
var require_typescript = __commonJS({
  "src/configs/typescript.ts"(exports, module) {
    var import_recommended = __toESM(require_recommended());
    var typescript = {
      // no files; either apply to all files, or let users spread in this config
      // and specify matching patterns. This is eslint-plugin-react's take.
      plugins: import_recommended.default.plugins,
      // no languageOptions; ESLint's default parser can't parse TypeScript,
      // and parsers are configured in languageOptions, so let the user handle
      // this rather than cause potential conflicts
      rules: {
        ...import_recommended.default.rules,
        "solid/jsx-no-undef": [2, { typescriptEnabled: true }],
        // namespaces taken care of by TS
        "solid/no-unknown-namespaces": 0
      }
    };
    module.exports = typescript;
  }
});

export {
  require_typescript
};
//# sourceMappingURL=chunk-2RM2RZIF.mjs.map