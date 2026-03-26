const db = require('../config/database')

/**
 * 获取一道成语填词题目
 * @param {number} diff - 难度等级（可选）：1=一般，2=中等，3=困难
 * @returns {Promise<Object>} 成语填词数据
 */
async function getIdiomQuiz(diff = null) {
  try {
    let sql = 'SELECT * FROM idiom_quiz WHERE 1=1'
    const params = []

    if (diff) {
      sql += ' AND diff = ?'
      params.push(diff)
    }

    // 随机获取一道题目
    sql += ' ORDER BY RAND() LIMIT 1'

    const rows = await db.query(sql, params)

    if (rows && rows.length > 0) {
      const item = rows[0]
      return {
        id: item.id,
        diff: item.diff,
        full: item.full,
        explan: item.explan,
        correct: item.correct,
        options: [item.correct, item.wrong_a, item.wrong_b, item.wrong_c].sort(() => Math.random() - 0.5),
        question: item.question
      }
    }

    return null
  } catch (error) {
    console.error('获取成语填词失败:', error.message)
    return null
  }
}

/**
 * 验证答案
 * @param {number} id - 题目 ID
 * @param {string} answer - 用户答案
 * @returns {Promise<Object>} 验证结果
 */
async function verifyAnswer(id, answer) {
  try {
    const sql = 'SELECT correct, full FROM idiom_quiz WHERE id = ?'
    const rows = await db.query(sql, [id])

    if (rows && rows.length > 0) {
      const item = rows[0]
      const isCorrect = answer === item.correct

      return {
        correct: isCorrect,
        answer: item.correct,
        full: item.full,
        message: isCorrect ? '回答正确！' : '回答错误，再试试其他选项吧'
      }
    }

    return {
      correct: false,
      message: '题目不存在'
    }
  } catch (error) {
    console.error('验证答案失败:', error.message)
    return {
      correct: false,
      message: '验证失败'
    }
  }
}

/**
 * 获取成语详情（包含解释）
 * @param {number} id - 题目 ID
 * @returns {Promise<Object>} 成语详情
 */
async function getIdiomDetail(id) {
  try {
    const sql = 'SELECT full, explan, diff FROM idiom_quiz WHERE id = ?'
    const rows = await db.query(sql, [id])

    if (rows && rows.length > 0) {
      const item = rows[0]
      return {
        full: item.full,
        explan: item.explan,
        diff: item.diff
      }
    }

    return null
  } catch (error) {
    console.error('获取成语详情失败:', error.message)
    return null
  }
}

module.exports = {
  getIdiomQuiz,
  verifyAnswer,
  getIdiomDetail
}
