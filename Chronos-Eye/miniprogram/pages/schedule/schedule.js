Page({
  data: {
    stats: {
      total: 0,
      completed: 0,
      rate: 0
    },
    schedules: [],
    baseUrl: ''
  },

  onLoad: function () {
    this.setData({ baseUrl: getApp().globalData.baseUrl })
    this.loadStats()
    this.loadSchedules()
  },

  onShow: function () {
    this.loadSchedules()
  },

  loadStats: function () {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const that = this
    wx.request({
      url: `${this.data.baseUrl}/schedules/stats/${year}/${month}`,
      success: function (res) {
        if (res.data.success && res.data.data) {
          that.setData({
            stats: {
              total: res.data.data.total || 0,
              completed: res.data.data.completed || 0,
              rate: res.data.data.completion_rate || 0
            }
          })
        }
      }
    })
  },

  loadSchedules: function () {
    const that = this
    wx.request({
      url: `${this.data.baseUrl}/schedules?user_id=1`,
      success: function (res) {
        if (res.data.success && res.data.data.length > 0) {
          const schedules = res.data.data.map(item => ({
            ...item,
            time: that.formatTime(item.start_time),
            priorityText: item.priority === 'high' ? '高' : item.priority === 'normal' ? '中' : '低',
            completed: item.status === 'completed'
          }))
          that.setData({ schedules })
        } else {
          that.setData({ schedules: [] })
        }
      },
      fail: function (err) {
        console.error('加载日程失败:', err)
        that.setData({ schedules: [] })
      }
    })
  },

  toggleStatus: function (e) {
    const id = e.currentTarget.dataset.id
    const schedules = this.data.schedules
    const index = schedules.findIndex(item => item.id === id)
    if (index !== -1) {
      const newStatus = !schedules[index].completed ? 'completed' : 'pending'
      const that = this
      wx.request({
        url: `${this.data.baseUrl}/schedules/${id}`,
        method: 'PUT',
        header: { 'content-type': 'application/json' },
        data: { status: newStatus },
        success: function () {
          schedules[index].completed = !schedules[index].completed
          that.setData({ schedules })
          that.loadStats()
          wx.showToast({ title: '更新成功', icon: 'success', duration: 1500 })
        }
      })
    }
  },

  formatTime: function (timeStr) {
    const date = new Date(timeStr)
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  },

  addSchedule: function () {
    const that = this
    wx.showActionSheet({
      itemList: ['创建日程', '选择日期'],
      success: function (res) {
        if (res.tapIndex === 0) {
          that.showCreateForm()
        } else {
          that.showDatePicker()
        }
      }
    })
  },

  showCreateForm: function () {
    const that = this
    wx.showModal({
      editable: true,
      placeholderText: '请输入日程标题',
      title: '创建日程',
      success: function (res) {
        if (res.confirm && res.content) {
          that.showPrioritySelect(function (priority, color) {
            that.showDatePick(function (selectedDate) {
              wx.request({
                url: `${this.data.baseUrl}/schedules`,
                method: 'POST',
                header: { 'content-type': 'application/json' },
                data: {
                  user_id: 1,
                  title: res.content,
                  start_time: selectedDate,
                  priority: priority,
                  color: color
                },
                success: function () {
                  wx.showToast({ title: '创建成功', icon: 'success' })
                  that.loadSchedules()
                  that.loadStats()
                },
                fail: function () {
                  wx.showToast({ title: '创建失败', icon: 'none' })
                }
              })
            })
          })
        }
      }
    })
  },

  showPrioritySelect: function (callback) {
    wx.showActionSheet({
      itemList: ['高优先级', '中优先级', '低优先级'],
      success: function (res) {
        const priorities = [
          { priority: 'high', color: '#e74c3c' },
          { priority: 'normal', color: '#667eea' },
          { priority: 'low', color: '#2ecc71' }
        ]
        callback && callback(priorities[res.tapIndex].priority, priorities[res.tapIndex].color)
      }
    })
  },

  showDatePick: function (callback) {
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')

    wx.showDatePickerView({
      mode: 'datetime',
      start: `${year}-${month}-${day} 00:00`,
      end: '2027-12-31 23:59',
      success: function (res) {
        callback && callback(res.dateValue)
      },
      fail: function () {
        wx.showModal({
          editable: true,
          placeholderText: '请输入日期时间（YYYY-MM-DD HH:mm）',
          title: '选择时间',
          success: function (res) {
            if (res.confirm && res.content) {
              callback && callback(res.content)
            }
          }
        })
      }
    })
  },

  showDatePicker: function () {
    const that = this
    wx.showDatePickerView({
      mode: 'date',
      start: '2026-03-17',
      end: '2027-12-31',
      success: function (res) {
        wx.request({
          url: `${this.data.baseUrl}/schedules?user_id=1&start_date=${res.dateValue}&end_date=${res.dateValue}`,
          success: function (res) {
            if (res.data.success && res.data.data.length > 0) {
              const schedules = res.data.data.map(item => ({
                ...item,
                time: that.formatTime(item.start_time),
                priorityText: item.priority === 'high' ? '高' : item.priority === 'normal' ? '中' : '低',
                completed: item.status === 'completed'
              }))
              that.setData({ schedules })
            } else {
              that.setData({ schedules: [] })
              wx.showToast({ title: '该日期无日程', icon: 'none' })
            }
          }
        })
      }
    })
  },

  deleteSchedule: function (id) {
    const that = this
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个日程吗？',
      success: function (res) {
        if (res.confirm) {
          wx.request({
            url: `${this.data.baseUrl}/schedules/${id}`,
            method: 'DELETE',
            success: function () {
              wx.showToast({ title: '删除成功', icon: 'success' })
              that.loadSchedules()
              that.loadStats()
            }
          })
        }
      }
    })
  }
})
