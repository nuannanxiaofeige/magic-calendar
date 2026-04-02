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
        this.setData({
          bgStyle: `background-image: url('${val}'); background-size: cover; background-position: center top; background-attachment: fixed; background-repeat: no-repeat;`
        })
      } else {
        this.setData({ bgStyle: '' })
      }
    }
  }
})
