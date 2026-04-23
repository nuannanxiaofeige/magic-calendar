Component({
  properties: {
    src: {
      type: String,
      value: ''
    }
  },
  data: {
    bgStyle: ''
  },
  observers: {
    'src': function(val) {
      if (val) {
        // 判断是渐变色还是图片 URL
        if (val.startsWith('linear-gradient') || val.startsWith('radial-gradient')) {
          this.setData({
            bgStyle: `background: ${val}; background-size: cover; background-position: center top; background-attachment: fixed;`
          })
        } else {
          this.setData({
            bgStyle: `background-image: url('${val}'); background-size: cover; background-position: center top; background-attachment: fixed; background-repeat: no-repeat;`
          })
        }
      } else {
        this.setData({ bgStyle: '' })
      }
    }
  }
})
