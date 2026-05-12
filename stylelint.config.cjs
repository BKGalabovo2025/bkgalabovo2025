module.exports = {
  extends: ["stylelint-config-standard", "stylelint-config-tailwindcss"],
  rules: {
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: [
          "tailwind",
          "apply",
          "variants",
          "responsive",
          "screen",
          "theme",
          "utility",
          "layer",
          "config",
          "plugin",
          "source",
          "custom-variant",
        ],
      },
    ],
    "no-descending-specificity": null,
    "at-rule-empty-line-before": null,
    "rule-empty-line-before": null,
    "declaration-empty-line-before": null,
    "color-function-notation": null,
    "alpha-value-notation": null,
    "color-function-alias-notation": null,
  },
};
