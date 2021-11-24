module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint/eslint-plugin', 'prettier'],
  extends: ['eslint:recommended', 'airbnb-base', 'plugin:prettier/recommended'],
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.js'],
      rules: {
        /**
         * Exception handling of eslint `no-unused-vars` error when importing Typescript Interface
         * @see https://github.com/typescript-eslint/typescript-eslint/issues/46
         */
        '@typescript-eslint/no-unused-vars': [2, { args: 'none' }],
        /**
         * @see https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/extensions.md
         */
        'import/extensions': 0,
        'prettier/prettier': [
          'warn',
          {
            arrowParens: 'always',
            bracketSpacing: true,
            jsxSingleQuote: false,
            printWidth: 80,
            quoteProps: 'as-needed',
            semi: true,
            singleQuote: true,
            tabWidth: 2,
            trailingComma: 'es5',
            useTabs: false,
            endOfLine: 'auto',
          },
        ],
      },
      settings: {
        /**
         * Automatically enter extension when loading `.[d.]ts` files
         * @see https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-unresolved.md
         */
        'import/resolver': {
          node: {
            paths: './',
            extensions: ['.js', '.jsx', '.ts', '.ts'],
          },
        },
      },
    },
  ],
};
