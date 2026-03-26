module.exports = {
  outputRoot: 'dist',
  copy: {
    patterns: [],
    options: {}
  },
  webpackChain: (chain, webpack) => {},
  miniCssExtractPluginOption: {
    ignoreOrder: true
  }
}
