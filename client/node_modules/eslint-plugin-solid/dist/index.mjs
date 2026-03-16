import {
  require_typescript
} from "./chunk-2RM2RZIF.mjs";
import {
  __commonJS,
  __toESM,
  init_plugin,
  plugin,
  require_recommended
} from "./chunk-5IRTCPIR.mjs";

// src/index.ts
var require_src = __commonJS({
  "src/index.ts"(exports, module) {
    init_plugin();
    var import_recommended = __toESM(require_recommended());
    var import_typescript = __toESM(require_typescript());
    var pluginLegacy = {
      rules: plugin.rules,
      configs: {
        recommended: {
          plugins: ["solid"],
          env: {
            browser: true,
            es6: true
          },
          parserOptions: import_recommended.default.languageOptions.parserOptions,
          rules: import_recommended.default.rules
        },
        typescript: {
          plugins: ["solid"],
          env: {
            browser: true,
            es6: true
          },
          parserOptions: {
            sourceType: "module"
          },
          rules: import_typescript.default.rules
        },
        "flat/recommended": import_recommended.default,
        "flat/typescript": import_typescript.default
      }
    };
    module.exports = pluginLegacy;
  }
});
export default require_src();
//# sourceMappingURL=index.mjs.map