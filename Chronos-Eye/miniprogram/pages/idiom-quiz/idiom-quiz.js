const app = getApp()

Page({
  data: {
    globalBgUrl: '',
    currentQuestion: null,
    optionStatus: ['', '', '', ''], // 每个选项的状态：correct, wrong, disabled
    loading: false,
    error: '',
    showFeedback: false,
    showExplanation: false,
    showNextButton: false,
    answerResult: '', // correct 或 wrong
    feedbackText: '',
    difficultyText: '一般'
  },

  onLoad: function () {
    this.loadQuestion()
  },

  onShow: function () {
    const app = getApp()
    app.applyGlobalBackground(this)
  },
  onPullDownRefresh: function () {
    this.loadQuestion().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 加载题目
  loadQuestion: async function () {
    this.setData({
      loading: true,
      error: '',
      currentQuestion: null,
      showFeedback: false,
      showExplanation: false,
      showNextButton: false,
      optionStatus: ['', '', '', '']
    })

    return new Promise((resolve) => {
      wx.request({
        url: `${app.globalData.baseUrl}/idiom-quiz/random`,
        success: (res) => {
          console.log('成语填词 API 响应:', res)
          if (res.data.code === 200 && res.data.data) {
            const data = res.data.data
            this.setData({
              currentQuestion: data,
              difficultyText: this.getDifficultyText(data.diff),
              loading: false
            })
          } else {
            this.setData({
              error: '暂无题目',
              loading: false
            })
          }
        },
        fail: (err) => {
          console.error('请求题目失败:', err)
          this.setData({
            error: '加载失败，请重试',
            loading: false
          })
        },
        complete: () => {
          resolve()
        }
      })
    })
  },

  // 难度文字转换
  getDifficultyText: function (diff) {
    const texts = {
      1: '一般',
      2: '中等',
      3: '困难'
    }
    return texts[diff] || '一般'
  },

  // 选择选项
  selectOption: function (e) {
    const index = e.currentTarget.dataset.index
    const question = this.data.currentQuestion

    // 已经回答过或选项被禁用则不处理
    if (this.data.showFeedback || this.data.optionStatus[index].includes('disabled')) {
      return
    }

    const selectedOption = question.options[index]
    const correctAnswer = question.correct

    // 标记选项状态
    const newStatus = this.data.optionStatus.map((status, i) => {
      if (question.options[i] === correctAnswer) {
        return 'correct'
      }
      if (i === index && question.options[i] !== correctAnswer) {
        return 'wrong'
      }
      return 'disabled'
    })

    const isCorrect = selectedOption === correctAnswer

    this.setData({
      optionStatus: newStatus,
      showFeedback: true,
      showExplanation: true,
      showNextButton: true,
      answerResult: isCorrect ? 'correct' : 'wrong',
      feedbackText: isCorrect ? '回答正确！' : '回答错误，正确答案已标绿'
    })
  },

  // 下一题
  nextQuestion: function () {
    this.loadQuestion()
  }
})
