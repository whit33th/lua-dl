module.exports = {
  plugins: ["prettier-plugin-tailwindcss"],
  overrides: [
    {
      files: "*.md",
      options: {
        printWidth: 60,
        // Don't reformat code examples in README
        embeddedLanguageFormatting: "off",
      },
    },
  ],
};
