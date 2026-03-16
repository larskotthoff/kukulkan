import { TSESLint } from '@typescript-eslint/utils';

/**
 * FIXME: remove this comments and import when below issue is fixed.
 * This import is necessary for type generation due to a bug in the TypeScript compiler.
 * See: https://github.com/microsoft/TypeScript/issues/42873
 */

declare const pluginLegacy: {
    rules: {
        "components-return-once": TSESLint.RuleModule<"noEarlyReturn" | "noConditionalReturn", [], unknown, TSESLint.RuleListener>;
        "event-handlers": TSESLint.RuleModule<"naming" | "capitalization" | "nonstandard" | "make-handler" | "make-attr" | "detected-attr" | "spread-handler", [({
            ignoreCase?: boolean;
            warnOnSpread?: boolean;
        } | undefined)?], unknown, TSESLint.RuleListener>;
        imports: TSESLint.RuleModule<"prefer-source", [], unknown, TSESLint.RuleListener>;
        "jsx-no-duplicate-props": TSESLint.RuleModule<"noDuplicateProps" | "noDuplicateClass" | "noDuplicateChildren", [({
            ignoreCase?: boolean;
        } | undefined)?], unknown, TSESLint.RuleListener>;
        "jsx-no-undef": TSESLint.RuleModule<"undefined" | "customDirectiveUndefined" | "autoImport", [({
            allowGlobals?: boolean;
            autoImport?: boolean;
            typescriptEnabled?: boolean;
        } | undefined)?], unknown, TSESLint.RuleListener>;
        "jsx-no-script-url": TSESLint.RuleModule<"noJSURL", [], unknown, TSESLint.RuleListener>;
        "jsx-uses-vars": TSESLint.RuleModule<never, [], unknown, TSESLint.RuleListener>;
        "no-destructure": TSESLint.RuleModule<"noDestructure", [], unknown, TSESLint.RuleListener>;
        "no-innerhtml": TSESLint.RuleModule<"dangerous" | "conflict" | "notHtml" | "useInnerText" | "dangerouslySetInnerHTML", [({
            allowStatic?: boolean;
        } | undefined)?], unknown, TSESLint.RuleListener>;
        "no-proxy-apis": TSESLint.RuleModule<"noStore" | "spreadCall" | "spreadMember" | "proxyLiteral" | "mergeProps", [], unknown, TSESLint.RuleListener>;
        "no-react-deps": TSESLint.RuleModule<"noUselessDep", [], unknown, TSESLint.RuleListener>;
        "no-react-specific-props": TSESLint.RuleModule<"prefer" | "noUselessKey", [], unknown, TSESLint.RuleListener>;
        "no-unknown-namespaces": TSESLint.RuleModule<"unknown" | "style" | "component" | "component-suggest", [({
            allowedNamespaces: Array<string>;
        } | undefined)?], unknown, TSESLint.RuleListener>;
        "prefer-classlist": TSESLint.RuleModule<"preferClasslist", [({
            classnames?: Array<string>;
        } | undefined)?], unknown, TSESLint.RuleListener>;
        "prefer-for": TSESLint.RuleModule<"preferFor" | "preferForOrIndex", [], unknown, TSESLint.RuleListener>;
        "prefer-show": TSESLint.RuleModule<"preferShowAnd" | "preferShowTernary", [], unknown, TSESLint.RuleListener>;
        reactivity: TSESLint.RuleModule<"noWrite" | "untrackedReactive" | "expectedFunctionGotExpression" | "badSignal" | "badUnnamedDerivedSignal" | "shouldDestructure" | "shouldAssign" | "noAsyncTrackedScope", [{
            customReactiveFunctions: string[];
        }], unknown, TSESLint.RuleListener>;
        "self-closing-comp": TSESLint.RuleModule<"selfClose" | "dontSelfClose", [({
            component?: "all" | "none";
            html?: "all" | "void" | "none";
        } | undefined)?], unknown, TSESLint.RuleListener>;
        "style-prop": TSESLint.RuleModule<"kebabStyleProp" | "invalidStyleProp" | "numericStyleValue" | "stringStyle", [({
            styleProps?: Array<string>;
            allowString?: boolean;
        } | undefined)?], unknown, TSESLint.RuleListener>;
        "no-array-handlers": TSESLint.RuleModule<"noArrayHandlers", [], unknown, TSESLint.RuleListener>;
    };
    configs: {
        recommended: {
            plugins: string[];
            env: {
                browser: boolean;
                es6: boolean;
            };
            parserOptions: {
                ecmaFeatures: {
                    jsx: true;
                };
            };
            rules: {
                "solid/jsx-no-duplicate-props": 2;
                "solid/jsx-no-undef": 2;
                "solid/jsx-uses-vars": 2;
                "solid/no-unknown-namespaces": 2;
                "solid/no-innerhtml": 2;
                "solid/jsx-no-script-url": 2;
                "solid/components-return-once": 1;
                "solid/no-destructure": 2;
                "solid/prefer-for": 2;
                "solid/reactivity": 1;
                "solid/event-handlers": 1;
                "solid/imports": 1;
                "solid/style-prop": 1;
                "solid/no-react-deps": 1;
                "solid/no-react-specific-props": 1;
                "solid/self-closing-comp": 1;
                "solid/no-array-handlers": 0;
                "solid/prefer-show": 0;
                "solid/no-proxy-apis": 0;
                "solid/prefer-classlist": 0;
            };
        };
        typescript: {
            plugins: string[];
            env: {
                browser: boolean;
                es6: boolean;
            };
            parserOptions: {
                sourceType: string;
            };
            rules: {
                "solid/jsx-no-undef": [2, {
                    typescriptEnabled: boolean;
                }];
                "solid/no-unknown-namespaces": 0;
                "solid/jsx-no-duplicate-props": 2;
                "solid/jsx-uses-vars": 2;
                "solid/no-innerhtml": 2;
                "solid/jsx-no-script-url": 2;
                "solid/components-return-once": 1;
                "solid/no-destructure": 2;
                "solid/prefer-for": 2;
                "solid/reactivity": 1;
                "solid/event-handlers": 1;
                "solid/imports": 1;
                "solid/style-prop": 1;
                "solid/no-react-deps": 1;
                "solid/no-react-specific-props": 1;
                "solid/self-closing-comp": 1;
                "solid/no-array-handlers": 0;
                "solid/prefer-show": 0;
                "solid/no-proxy-apis": 0;
                "solid/prefer-classlist": 0;
            };
        };
        "flat/recommended": {
            plugins: {
                solid: {
                    meta: {
                        name: any;
                        version: any;
                    };
                    rules: {
                        "components-return-once": TSESLint.RuleModule<"noEarlyReturn" | "noConditionalReturn", [], unknown, TSESLint.RuleListener>;
                        "event-handlers": TSESLint.RuleModule<"naming" | "capitalization" | "nonstandard" | "make-handler" | "make-attr" | "detected-attr" | "spread-handler", [({
                            ignoreCase?: boolean;
                            warnOnSpread?: boolean;
                        } | undefined)?], unknown, TSESLint.RuleListener>;
                        imports: TSESLint.RuleModule<"prefer-source", [], unknown, TSESLint.RuleListener>;
                        "jsx-no-duplicate-props": TSESLint.RuleModule<"noDuplicateProps" | "noDuplicateClass" | "noDuplicateChildren", [({
                            ignoreCase?: boolean;
                        } | undefined)?], unknown, TSESLint.RuleListener>;
                        "jsx-no-undef": TSESLint.RuleModule<"undefined" | "customDirectiveUndefined" | "autoImport", [({
                            allowGlobals?: boolean;
                            autoImport?: boolean;
                            typescriptEnabled?: boolean;
                        } | undefined)?], unknown, TSESLint.RuleListener>;
                        "jsx-no-script-url": TSESLint.RuleModule<"noJSURL", [], unknown, TSESLint.RuleListener>;
                        "jsx-uses-vars": TSESLint.RuleModule<never, [], unknown, TSESLint.RuleListener>;
                        "no-destructure": TSESLint.RuleModule<"noDestructure", [], unknown, TSESLint.RuleListener>;
                        "no-innerhtml": TSESLint.RuleModule<"dangerous" | "conflict" | "notHtml" | "useInnerText" | "dangerouslySetInnerHTML", [({
                            allowStatic?: boolean;
                        } | undefined)?], unknown, TSESLint.RuleListener>;
                        "no-proxy-apis": TSESLint.RuleModule<"noStore" | "spreadCall" | "spreadMember" | "proxyLiteral" | "mergeProps", [], unknown, TSESLint.RuleListener>;
                        "no-react-deps": TSESLint.RuleModule<"noUselessDep", [], unknown, TSESLint.RuleListener>;
                        "no-react-specific-props": TSESLint.RuleModule<"prefer" | "noUselessKey", [], unknown, TSESLint.RuleListener>;
                        "no-unknown-namespaces": TSESLint.RuleModule<"unknown" | "style" | "component" | "component-suggest", [({
                            allowedNamespaces: Array<string>;
                        } | undefined)?], unknown, TSESLint.RuleListener>;
                        "prefer-classlist": TSESLint.RuleModule<"preferClasslist", [({
                            classnames?: Array<string>;
                        } | undefined)?], unknown, TSESLint.RuleListener>;
                        "prefer-for": TSESLint.RuleModule<"preferFor" | "preferForOrIndex", [], unknown, TSESLint.RuleListener>;
                        "prefer-show": TSESLint.RuleModule<"preferShowAnd" | "preferShowTernary", [], unknown, TSESLint.RuleListener>;
                        reactivity: TSESLint.RuleModule<"noWrite" | "untrackedReactive" | "expectedFunctionGotExpression" | "badSignal" | "badUnnamedDerivedSignal" | "shouldDestructure" | "shouldAssign" | "noAsyncTrackedScope", [{
                            customReactiveFunctions: string[];
                        }], unknown, TSESLint.RuleListener>;
                        "self-closing-comp": TSESLint.RuleModule<"selfClose" | "dontSelfClose", [({
                            component?: "all" | "none";
                            html?: "all" | "void" | "none";
                        } | undefined)?], unknown, TSESLint.RuleListener>;
                        "style-prop": TSESLint.RuleModule<"kebabStyleProp" | "invalidStyleProp" | "numericStyleValue" | "stringStyle", [({
                            styleProps?: Array<string>;
                            allowString?: boolean;
                        } | undefined)?], unknown, TSESLint.RuleListener>;
                        "no-array-handlers": TSESLint.RuleModule<"noArrayHandlers", [], unknown, TSESLint.RuleListener>;
                    };
                };
            };
            languageOptions: {
                sourceType: "module";
                parserOptions: {
                    ecmaFeatures: {
                        jsx: true;
                    };
                };
            };
            rules: {
                "solid/jsx-no-duplicate-props": 2;
                "solid/jsx-no-undef": 2;
                "solid/jsx-uses-vars": 2;
                "solid/no-unknown-namespaces": 2;
                "solid/no-innerhtml": 2;
                "solid/jsx-no-script-url": 2;
                "solid/components-return-once": 1;
                "solid/no-destructure": 2;
                "solid/prefer-for": 2;
                "solid/reactivity": 1;
                "solid/event-handlers": 1;
                "solid/imports": 1;
                "solid/style-prop": 1;
                "solid/no-react-deps": 1;
                "solid/no-react-specific-props": 1;
                "solid/self-closing-comp": 1;
                "solid/no-array-handlers": 0;
                "solid/prefer-show": 0;
                "solid/no-proxy-apis": 0;
                "solid/prefer-classlist": 0;
            };
        };
        "flat/typescript": {
            plugins: {
                solid: {
                    meta: {
                        name: any;
                        version: any;
                    };
                    rules: {
                        "components-return-once": TSESLint.RuleModule<"noEarlyReturn" | "noConditionalReturn", [], unknown, TSESLint.RuleListener>;
                        "event-handlers": TSESLint.RuleModule<"naming" | "capitalization" | "nonstandard" | "make-handler" | "make-attr" | "detected-attr" | "spread-handler", [({
                            ignoreCase?: boolean;
                            warnOnSpread?: boolean;
                        } | undefined)?], unknown, TSESLint.RuleListener>;
                        imports: TSESLint.RuleModule<"prefer-source", [], unknown, TSESLint.RuleListener>;
                        "jsx-no-duplicate-props": TSESLint.RuleModule<"noDuplicateProps" | "noDuplicateClass" | "noDuplicateChildren", [({
                            ignoreCase?: boolean;
                        } | undefined)?], unknown, TSESLint.RuleListener>;
                        "jsx-no-undef": TSESLint.RuleModule<"undefined" | "customDirectiveUndefined" | "autoImport", [({
                            allowGlobals?: boolean;
                            autoImport?: boolean;
                            typescriptEnabled?: boolean;
                        } | undefined)?], unknown, TSESLint.RuleListener>;
                        "jsx-no-script-url": TSESLint.RuleModule<"noJSURL", [], unknown, TSESLint.RuleListener>;
                        "jsx-uses-vars": TSESLint.RuleModule<never, [], unknown, TSESLint.RuleListener>;
                        "no-destructure": TSESLint.RuleModule<"noDestructure", [], unknown, TSESLint.RuleListener>;
                        "no-innerhtml": TSESLint.RuleModule<"dangerous" | "conflict" | "notHtml" | "useInnerText" | "dangerouslySetInnerHTML", [({
                            allowStatic?: boolean;
                        } | undefined)?], unknown, TSESLint.RuleListener>;
                        "no-proxy-apis": TSESLint.RuleModule<"noStore" | "spreadCall" | "spreadMember" | "proxyLiteral" | "mergeProps", [], unknown, TSESLint.RuleListener>;
                        "no-react-deps": TSESLint.RuleModule<"noUselessDep", [], unknown, TSESLint.RuleListener>;
                        "no-react-specific-props": TSESLint.RuleModule<"prefer" | "noUselessKey", [], unknown, TSESLint.RuleListener>;
                        "no-unknown-namespaces": TSESLint.RuleModule<"unknown" | "style" | "component" | "component-suggest", [({
                            allowedNamespaces: Array<string>;
                        } | undefined)?], unknown, TSESLint.RuleListener>;
                        "prefer-classlist": TSESLint.RuleModule<"preferClasslist", [({
                            classnames?: Array<string>;
                        } | undefined)?], unknown, TSESLint.RuleListener>;
                        "prefer-for": TSESLint.RuleModule<"preferFor" | "preferForOrIndex", [], unknown, TSESLint.RuleListener>;
                        "prefer-show": TSESLint.RuleModule<"preferShowAnd" | "preferShowTernary", [], unknown, TSESLint.RuleListener>;
                        reactivity: TSESLint.RuleModule<"noWrite" | "untrackedReactive" | "expectedFunctionGotExpression" | "badSignal" | "badUnnamedDerivedSignal" | "shouldDestructure" | "shouldAssign" | "noAsyncTrackedScope", [{
                            customReactiveFunctions: string[];
                        }], unknown, TSESLint.RuleListener>;
                        "self-closing-comp": TSESLint.RuleModule<"selfClose" | "dontSelfClose", [({
                            component?: "all" | "none";
                            html?: "all" | "void" | "none";
                        } | undefined)?], unknown, TSESLint.RuleListener>;
                        "style-prop": TSESLint.RuleModule<"kebabStyleProp" | "invalidStyleProp" | "numericStyleValue" | "stringStyle", [({
                            styleProps?: Array<string>;
                            allowString?: boolean;
                        } | undefined)?], unknown, TSESLint.RuleListener>;
                        "no-array-handlers": TSESLint.RuleModule<"noArrayHandlers", [], unknown, TSESLint.RuleListener>;
                    };
                };
            };
            rules: {
                "solid/jsx-no-undef": [2, {
                    typescriptEnabled: boolean;
                }];
                "solid/no-unknown-namespaces": 0;
                "solid/jsx-no-duplicate-props": 2;
                "solid/jsx-uses-vars": 2;
                "solid/no-innerhtml": 2;
                "solid/jsx-no-script-url": 2;
                "solid/components-return-once": 1;
                "solid/no-destructure": 2;
                "solid/prefer-for": 2;
                "solid/reactivity": 1;
                "solid/event-handlers": 1;
                "solid/imports": 1;
                "solid/style-prop": 1;
                "solid/no-react-deps": 1;
                "solid/no-react-specific-props": 1;
                "solid/self-closing-comp": 1;
                "solid/no-array-handlers": 0;
                "solid/prefer-show": 0;
                "solid/no-proxy-apis": 0;
                "solid/prefer-classlist": 0;
            };
        };
    };
};

export { pluginLegacy as default };
