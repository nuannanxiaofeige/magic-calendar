import Taro from '@tarojs/taro'

// API 基础地址 - 开发环境使用局域网地址，生产环境需要替换为 HTTPS 域名
const BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-domain.com/api'
  : 'http://47.102.152.82:3000/api'

// 响应数据结构
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 请求配置
interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: any
  needAuth?: boolean
}

/**
 * 获取存储的 Token
 */
function getToken(): string {
  try {
    return Taro.getStorageSync('token') || ''
  } catch {
    return ''
  }
}

/**
 * 保存 Token
 */
function saveToken(token: string): void {
  try {
    Taro.setStorageSync('token', token)
  } catch (e) {
    console.error('保存 token 失败:', e)
  }
}

/**
 * 清除 Token
 */
function clearToken(): void {
  try {
    Taro.removeStorageSync('token')
  } catch (e) {
    console.error('清除 token 失败:', e)
  }
}

/**
 * 统一请求方法
 */
async function request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
  const { url, method = 'GET', data, header = {}, needAuth = false } = config

  // 构建完整 URL
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`

  // 构建请求头
  const reqHeader: Record<string, string> = {
    'Content-Type': 'application/json',
    ...header
  }

  // 需要认证时添加 Token
  if (needAuth) {
    const token = getToken()
    if (token) {
      reqHeader['Authorization'] = `Bearer ${token}`
    }
  }

  try {
    const response = await Taro.request({
      url: fullUrl,
      method,
      header: reqHeader,
      data: method === 'GET' ? undefined : data,
      // GET 请求参数拼接到 URL
      ...(method === 'GET' && data ? { data } : {})
    })

    const res = response.data as ApiResponse<T>

    // 处理业务错误
    if (!res.success) {
      // Token 过期或无效
      if (response.statusCode === 401) {
        clearToken()
        // 跳转到登录页
        Taro.redirectTo({ url: '/pages/login/login' })
      }
      throw new Error(res.message || '请求失败')
    }

    return res
  } catch (error: any) {
    console.error('请求错误:', error)

    // 网络错误处理
    if (error.errMsg && error.errMsg.includes('timeout')) {
      Taro.showToast({ title: '请求超时', icon: 'none' })
    } else if (error.errMsg && error.errMsg.includes('fail')) {
      Taro.showToast({ title: '网络错误', icon: 'none' })
    }

    return {
      success: false,
      message: error.message || '网络请求失败'
    }
  }
}

// ==================== API 方法 ====================

// 用户相关
export const userApi = {
  // 微信登录
  login: (code: string) =>
    request({ url: '/users/login/wechat', method: 'POST', data: { code } }),

  // 获取用户信息
  getProfile: () =>
    request({ url: '/users/profile', method: 'GET', needAuth: true }),

  // 更新用户信息
  updateProfile: (data: any) =>
    request({ url: '/users/profile', method: 'PUT', data, needAuth: true }),

  // 获取用户统计
  getStats: () =>
    request({ url: '/users/stats', method: 'GET', needAuth: true })
}

// 节假日/倒计时相关
export const holidayApi = {
  // 获取节假日列表
  getHolidays: (params?: { type?: string; page?: number; limit?: number }) =>
    request({ url: '/holidays', method: 'GET', data: params }),

  // 获取下一个节假日
  getNextHoliday: () =>
    request({ url: '/holidays/next', method: 'GET' }),

  // 获取最近节日列表（按天数排序）
  getRecentFestivals: (limit?: number) =>
    request({ url: '/holidays/recent', method: 'GET', data: { limit } }),

  // 获取节假日详情
  getHolidayById: (id: number) =>
    request({ url: `/holidays/${id}`, method: 'GET' }),

  // 获取倒计时列表
  getCountdownList: (userId?: number) =>
    request({ url: '/holidays/countdown/list', method: 'GET', data: { user_id: userId } }),

  // 添加倒计时
  addCountdown: (data: {
    custom_name: string
    custom_date: string
    custom_type?: string
    is_recurring?: boolean
    reminder_days?: number
  }) =>
    request({ url: '/holidays/countdown/add', method: 'POST', data }),

  // 更新倒计时
  updateCountdown: (id: number, data: any) =>
    request({ url: `/holidays/countdown/${id}`, method: 'PUT', data }),

  // 删除倒计时
  deleteCountdown: (id: number) =>
    request({ url: `/holidays/countdown/${id}`, method: 'DELETE' }),

  // 排序倒计时
  sortCountdowns: (items: Array<{ id: number; sort_order: number }>) =>
    request({ url: '/holidays/countdown/sort', method: 'PUT', data: { items } })
}

// 日程相关
export const scheduleApi = {
  // 获取日程列表
  getSchedules: (params: {
    user_id: number
    start_date?: string
    end_date?: string
    status?: string
  }) =>
    request({ url: '/schedules', method: 'GET', data: params }),

  // 获取日程详情
  getScheduleById: (id: number) =>
    request({ url: `/schedules/${id}`, method: 'GET' }),

  // 创建日程
  createSchedule: (data: {
    user_id: number
    title: string
    description?: string
    start_time: string
    end_time?: string
    is_all_day?: boolean
    priority?: string
    color?: string
  }) =>
    request({ url: '/schedules', method: 'POST', data }),

  // 更新日程
  updateSchedule: (id: number, data: any) =>
    request({ url: `/schedules/${id}`, method: 'PUT', data }),

  // 删除日程
  deleteSchedule: (id: number) =>
    request({ url: `/schedules/${id}`, method: 'DELETE' }),

  // 获取月度统计
  getMonthStats: (userId: number, year: number, month: number) =>
    request({ url: `/schedules/stats/${year}/${month}`, method: 'GET', data: { user_id: userId } })
}

// 黄历相关
export const almanacApi = {
  // 获取今日黄历
  getTodayAlmanac: () =>
    request({ url: '/almanac/today', method: 'GET' }),

  // 获取指定日期黄历
  getAlmanacByDate: (date: string) =>
    request({ url: `/almanac/${date}`, method: 'GET' }),

  // 获取本月黄历
  getAlmanacByMonth: (year: number, month: number) =>
    request({ url: `/almanac/month/${year}/${month}`, method: 'GET' }),

  // 获取吉日
  getAuspiciousDays: (event: string, month?: string) =>
    request({ url: '/almanac/auspicious/${event}', method: 'GET', data: { month } })
}

// 节气相关
export const termApi = {
  // 获取当前节气
  getCurrentTerm: () =>
    request({ url: '/terms/current', method: 'GET' }),

  // 获取今日节气百科
  getTodayTerm: () =>
    request({ url: '/terms/today', method: 'GET' }),

  // 获取节气列表
  getTermList: () =>
    request({ url: '/terms/list', method: 'GET' }),

  // 获取节气详情
  getTermDetail: (termName: string) =>
    request({ url: `/terms/detail/${termName}`, method: 'GET' })
}

// 农历节日相关
export const lunarFestivalApi = {
  // 获取今日农历节日
  getTodayLunarFestival: () =>
    request({ url: '/holidays/today-lunar', method: 'GET' }),

  // 获取农历节日列表
  getLunarFestivals: () =>
    request({ url: '/holidays/lunar-list', method: 'GET' })
}

// 历史事件相关
export const historyApi = {
  // 获取历史上的今天
  getHistoryToday: (date?: string) =>
    request({ url: '/history/today', method: 'GET', data: { date } }),

  // 按分类获取历史事件
  getHistoryByCategory: (category: string, date?: string) =>
    request({ url: `/history/today/category/${category}`, method: 'GET', data: { date } }),

  // 获取历史事件详情
  getHistoryEventById: (id: number) =>
    request({ url: `/history/event/${id}`, method: 'GET' }),

  // 搜索历史事件
  searchHistoryEvents: (keyword: string) =>
    request({ url: '/history/search', method: 'GET', data: { keyword } })
}

// 舔狗日记相关
export const tiangouApi = {
  // 获取每日舔狗日记（每天一条）
  getDailyDiary: (date?: string) =>
    request({ url: '/tiangou-diary/daily', method: 'GET', data: { date } }),

  // 获取随机一条舔狗日记
  getRandomDiary: () =>
    request({ url: '/tiangou-diary/random', method: 'GET' }),

  // 获取舔狗日记列表
  getDiaryList: (page?: number, limit?: number) =>
    request({ url: '/tiangou-diary/list', method: 'GET', data: { page, limit } }),

  // 获取多条随机舔狗日记
  getRandomDiaries: (count?: number) =>
    request({ url: '/tiangou-diary/randoms', method: 'GET', data: { count } })
}

// 打工者日记相关
export const workerDiaryApi = {
  // 获取每日打工者日记（仅工作日）
  getDailyDiary: (date?: string) =>
    request({ url: '/worker-diary/daily', method: 'GET', data: { date } }),

  // 检查是否为工作日
  checkWorkday: (date?: string) =>
    request({ url: '/worker-diary/check-workday', method: 'GET', data: { date } })
}

// 导出工具方法
export { getToken, saveToken, clearToken }
export default request
