module.exports = {
  extends: ["stylelint-config-standard"],
  rules: {
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: [
          "tailwind",
          "theme",
          "plugin",
          "utility",
          "variant",
          "custom-variant",
          "keyframes",
          "source",
        ],
      },
    ],
    "import-notation": null,
    "no-descending-specificity": null,
    "color-function-notation": null,
    "color-function-alias-notation": null,
    "alpha-value-notation": null,
    "at-rule-empty-line-before": null,
    "rule-empty-line-before": null,
    "declaration-empty-line-before": null,
    "property-no-unknown": [
      true,
      {
        ignoreProperties: ["appearance"],
      },
    ],
    "selector-class-pattern": null,
    "custom-property-pattern": null,
  },
};
