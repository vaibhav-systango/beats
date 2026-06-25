module.exports = {
  extends: ['next/core-web-vitals', 'prettier'],
  ignorePatterns: ['!**/*', '.next/**/*'],
  rules: {
    '@next/next/no-img-element': 'off',
  },
}
