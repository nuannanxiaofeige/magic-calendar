Page({
  data: {
    countdowns: []
  },

  onLoad: function () {
    this.loadCountdowns()
  },

  onShow: function () {
    this.loadCountdowns()
  },

  loadCountdowns: function () {
    const that = this
    wx.request({
      url: 'http://localhost:3000/api/holidays/countdown/list?user_id=1',
      success: function (res) {
        if (res.data.success && res.data.data && res.data.data.length > 0) {
          that.setData({ countdowns: res.data.data })
        } else {
          that.setData({ countdowns: [] })
        }
      },
      fail: function (err) {
        console.error('加载倒计时失败:', err)
        that.setData({ countdowns: [] })
      }
    })
  },

  addCountdown: function () {
    const that = this
    wx.showActionSheet({
      itemList: ['选择日期', '从节日列表添加'],
      success: function (res) {
        if (res.tapIndex === 0) {
          that.showDatePicker()
        } else {
          that.showHolidaySelector()
        }
      }
    })
  },

  showDatePicker: function () {
    const that = this
    wx.showModal({
      title: '添加倒计时',
      editable: true,
      placeholderText: '请输入倒计时名称（如：生日、纪念日）',
      success: function (res) {
        if (res.confirm && res.content) {
          that.showDatePick(function (selectedDate) {
            wx.request({
              url: 'http://localhost:3000/api/holidays/countdown/add',
              method: 'POST',
              header: { 'content-type': 'application/json' },
              data: {
                user_id: 1,
                custom_name: res.content,
                custom_date: selectedDate,
                custom_type: 'solar',
                is_recurring: 1
              },
              success: function (res) {
                if (res.data.success) {
                  wx.showToast({ title: '添加成功', icon: 'success' })
                  that.loadCountdowns()
                } else {
                  wx.showToast({ title: '添加失败', icon: 'none' })
                }
              },
              fail: function () {
                wx.showToast({ title: '添加失败', icon: 'none' })
              }
            })
          })
        }
      }
    })
  },

  showDatePick: function (callback) {
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')

    wx.showDatePickerView({
      mode: 'date',
      start: `${year}-${month}-${day}`,
      end: '2030-12-31',
      success: function (res) {
        callback && callback(res.dateValue)
      },
      fail: function () {
        // 降级处理
        wx.showModal({
          title: '选择日期',
          editable: true,
          placeholderText: '请输入日期（YYYY-MM-DD）',
          success: function (res) {
            if (res.confirm && res.content) {
              callback && callback(res.content)
            }
          }
        })
      }
    })
  },

  showHolidaySelector: function () {
    const that = this
    wx.request({
      url: 'http://localhost:3000/api/holidays',
      success: function (res) {
        if (res.data.success && res.data.data) {
          const holidays = res.data.data
          const itemList = holidays.map(h => h.name)
          wx.showActionSheet({
            itemList: itemList,
            success: function (res) {
              const selected = holidays[res.tapIndex]
              wx.request({
                url: 'http://localhost:3000/api/holidays/countdown/add',
                method: 'POST',
                header: { 'content-type': 'application/json' },
                data: {
                  user_id: 1,
                  custom_name: selected.name,
                  custom_date: selected.date_full || `${year}-${selected.date_month}-${selected.date_day}`,
                  custom_type: selected.type,
                  is_recurring: 1
                },
                success: function () {
                  wx.showToast({ title: '添加成功', icon: 'success' })
                  that.loadCountdowns()
                }
              })
            }
          })
        }
      }
    })
  },

  deleteCountdown: function (e) {
    const id = e.currentTarget.dataset.id
    const that = this
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个倒计时吗？',
      success: function (res) {
        if (res.confirm) {
          wx.request({
            url: `http://localhost:3000/api/holidays/countdown/${id}`,
            method: 'DELETE',
            success: function () {
              wx.showToast({ title: '删除成功', icon: 'success' })
              that.loadCountdowns()
            }
          })
        }
      }
    })
  }
})
