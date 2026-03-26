const config = {
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {
          selectorBlackList: ['nut-']
        }
      }
    }
  }
}

module.exports = function (merge) {
  return merge({}, config)
}
