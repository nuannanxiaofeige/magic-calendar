import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { holidayApi } from '../../services/api'
import './detail.css'

interface HolidayDetail {
  id: number
  name: string
  type: string
  date: string
  date_month?: number
  date_day?: number
  weekday?: number
  days_left: number
  vacation_dates?: string[]
  work_dates?: string[]
  wage_dates?: string[]
  is_official?: number
  is_rest?: number
  is_work?: number
  tip?: string
  rest_tip?: string
  description?: string
  customs?: string
  holiday_str?: string
  year?: number
  start?: string
  end?: string
  now?: number
}

// 根据节日名称获取匹配的渐变色
const getHolidayGradient = (name: string, type: string): string => {
  const gradients: Record<string, string> = {
    // 春节相关
    '春节': 'linear-gradient(180deg, #e74c3c 0%, #c0392b 100%)',
    '除夕': 'linear-gradient(180deg, #e74c3c 0%, #c0392b 100%)',
    '元宵节': 'linear-gradient(180deg, #f39c12 0%, #e67e22 100%)',
    // 清明
    '清明': 'linear-gradient(180deg, #27ae60 0%, #2ecc71 100%)',
    // 端午
    '端午': 'linear-gradient(180deg, #27ae60 0%, #16a085 100%)',
    // 七夕
    '七夕': 'linear-gradient(180deg, #e91e63 0%, #f06292 100%)',
    '情人节': 'linear-gradient(180deg, #e91e63 0%, #f06292 100%)',
    // 中秋
    '中秋': 'linear-gradient(180deg, #3498db 0%, #2980b9 100%)',
    // 国庆
    '国庆': 'linear-gradient(180deg, #e74c3c 0%, #f1c40f 100%)',
    // 重阳
    '重阳': 'linear-gradient(180deg, #9b59b6 0%, #8e44ad 100%)',
    // 元旦
    '元旦': 'linear-gradient(180deg, #3498db 0%, #9b59b6 100%)',
    // 劳动
    '劳动': 'linear-gradient(180deg, #e67e22 0%, #d35400 100%)',
    // 儿童
    '儿童': 'linear-gradient(180deg, #f39c12 0%, #e74c3c 100%)',
    // 教师
    '教师': 'linear-gradient(180deg, #9b59b6 0%, #3498db 100%)',
    // 圣诞
    '圣诞': 'linear-gradient(180deg, #27ae60 0%, #e74c3c 100%)',
    '万圣': 'linear-gradient(180deg, #e67e22 0%, #2c3e50 100%)',
    // 母亲/父亲
    '母亲': 'linear-gradient(180deg, #e91e63 0%, #f06292 100%)',
    '父亲': 'linear-gradient(180deg, #34495e 0%, #2c3e50 100%)',
    // 其他节气
    '立春': 'linear-gradient(180deg, #2ecc71 0%, #27ae60 100%)',
    '立夏': 'linear-gradient(180deg, #f39c12 0%, #e74c3c 100%)',
    '立秋': 'linear-gradient(180deg, #e67e22 0%, #d35400 100%)',
    '立冬': 'linear-gradient(180deg, #3498db 0%, #9b59b6 100%)',
  }

  // 先精确匹配
  if (gradients[name]) {
    return gradients[name]
  }

  // 再模糊匹配关键词
  for (const key of Object.keys(gradients)) {
    if (name.includes(key)) {
      return gradients[key]
    }
  }

  // 按类型返回默认
  if (type === 'festival') {
    return 'linear-gradient(180deg, #e74c3c 0%, #f1c40f 100%)'
  } else if (type === 'lunar') {
    return 'linear-gradient(180deg, #34495e 0%, #2c3e50 100%)'
  } else if (type === 'solar') {
    return 'linear-gradient(180deg, #f39c12 0%, #e67e22 100%)'
  }

  return 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)'
}

const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export default function Detail() {
  const router = useRouter()
  const { id } = router.params
  const [holiday, setHoliday] = useState<HolidayDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [gradient, setGradient] = useState('')

  useEffect(() => {
    if (id) {
      loadHolidayDetail(Number(id))
    }
  }, [id])

  const loadHolidayDetail = async (holidayId: number) => {
    try {
      setLoading(true)
      const res = await holidayApi.getHolidayById(holidayId)
      if (res.success && res.data) {
        setHoliday(res.data)
        // 设置节日风格
        setGradient(getHolidayGradient(res.data.name, res.data.type))
        // 设置页面标题
        Taro.setNavigationBarTitle({ title: res.data.name })
      }
    } catch (error) {
      console.error('加载节假日详情失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = weekdayNames[date.getDay()]
    return `${year}年${month}月${day}日 ${weekday}`
  }

  // 格式化日期范围
  const formatDuration = () => {
    if (holiday?.start && holiday?.end) {
      const start = new Date(holiday.start)
      const end = new Date(holiday.end)
      const startYear = start.getFullYear()
      const startMonth = start.getMonth() + 1
      const startDay = start.getDate()
      const endYear = end.getFullYear()
      const endMonth = end.getMonth() + 1
      const endDay = end.getDate()
      if (startYear === endYear && startMonth === endMonth) {
        return `${startYear}年${startMonth}月${startDay}日 - ${endDay}日`
      }
      return `${startYear}年${startMonth}月${startDay}日 - ${endYear}年${endMonth}月${endDay}日`
    }
    if (holiday?.vacation_dates && holiday.vacation_dates.length > 0) {
      const start = new Date(holiday.vacation_dates[0])
      const end = new Date(holiday.vacation_dates[holiday.vacation_dates.length - 1])
      const startYear = start.getFullYear()
      const startMonth = start.getMonth() + 1
      const startDay = start.getDate()
      const endYear = end.getFullYear()
      const endMonth = end.getMonth() + 1
      const endDay = end.getDate()
      if (startYear === endYear && startMonth === endMonth) {
        return `${startYear}年${startMonth}月${startDay}日 - ${endDay}日`
      }
      return `${startYear}年${startMonth}月${startDay}日 - ${endYear}年${endMonth}月${endDay}日`
    }
    return formatDate(holiday?.date || '')
  }

  // 获取假期天数
  const getDuration = () => {
    if (holiday?.vacation_dates && holiday.vacation_dates.length > 0) {
      return holiday.vacation_dates.length
    }
    return 1
  }

  // 获取类型文本
  const getTypeText = () => {
    switch (holiday?.type) {
      case 'festival':
        return '法定节假日'
      case 'solar':
        return '公历节日'
      case 'lunar':
        return '农历节日'
      default:
        return '其他'
    }
  }

  if (loading) {
    return (
      <View className="detail-loading">
        <Text>加载中...</Text>
      </View>
    )
  }

  if (!holiday) {
    return (
      <View className="detail-empty">
        <Text>暂无数据</Text>
      </View>
    )
  }

  // 使用 date_full 或 date 字段
  const holidayDate = holiday.date_full || holiday.date || ''

  return (
    <ScrollView className="detail-container" scrollY style={{ background: gradient }}>
      {/* 头部区域 */}
      <View className="detail-header" style={{ background: gradient }}>
        <View className="detail-header-content">
          <Text className="detail-holiday-name">{holiday.name}</Text>
          <View className="detail-countdown">
            <Text className="detail-days-number">{holiday.days_left}</Text>
            <Text className="detail-days-unit">天</Text>
          </View>
          <Text className="detail-countdown-label">
            {holiday.days_left === 0 ? '就是今天！' : `距离${holiday.name}还有`}
          </Text>
        </View>
      </View>

      {/* 详细信息区域 */}
      <View className="detail-content">
        {/* 基本信息卡片 */}
        <View className="detail-card">
          <Text className="detail-card-title">基本信息</Text>

          <View className="detail-row">
            <Text className="detail-row-label">📅 节日日期</Text>
            <Text className="detail-row-value">{formatDate(holidayDate)}</Text>
          </View>

          {holiday.weekday !== undefined && (
            <View className="detail-row">
              <Text className="detail-row-label">⭐ 星期</Text>
              <Text className="detail-row-value">{weekdayNames[holiday.weekday]}</Text>
            </View>
          )}

          <View className="detail-row">
            <Text className="detail-row-label">🏷️ 节日类型</Text>
            <Text className="detail-row-value">{getTypeText()}</Text>
          </View>

          {holiday.year && (
            <View className="detail-row">
              <Text className="detail-row-label">📆 年份</Text>
              <Text className="detail-row-value">{holiday.year}年</Text>
            </View>
          )}
        </View>

        {/* 假期安排卡片 */}
        {(holiday.vacation_dates || holiday.tip || holiday.work_dates) && (
          <View className="detail-card">
            <Text className="detail-card-title">假期安排</Text>

            {holiday.vacation_dates && holiday.vacation_dates.length > 0 && (
              <>
                <View className="detail-row">
                  <Text className="detail-row-label">📆 放假时间</Text>
                  <Text className="detail-row-value">{formatDuration()}</Text>
                </View>
                <View className="detail-row">
                  <Text className="detail-row-label">⏱️ 假期天数</Text>
                  <Text className="detail-row-value">共 {getDuration()} 天</Text>
                </View>
              </>
            )}

            {holiday.tip && (
              <View className="detail-row detail-full">
                <Text className="detail-row-label">💡 放假说明</Text>
                <Text className="detail-row-value detail-text">{holiday.tip}</Text>
              </View>
            )}

            {holiday.work_dates && holiday.work_dates.length > 0 && (
              <View className="detail-row detail-full">
                <Text className="detail-row-label">⚠️ 调休上班</Text>
                <Text className="detail-row-value detail-text">
                  {holiday.work_dates.map(d => {
                    const date = new Date(d)
                    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
                  }).join('、')}
                </Text>
              </View>
            )}

            {holiday.rest_tip && (
              <View className="detail-row detail-full">
                <Text className="detail-row-label">📝 请假建议</Text>
                <Text className="detail-row-value detail-text">{holiday.rest_tip}</Text>
              </View>
            )}
          </View>
        )}

        {/* 三倍工资信息 */}
        {holiday.wage_dates && holiday.wage_dates.length > 0 && (
          <View className="detail-card">
            <Text className="detail-card-title">加班工资</Text>
            <View className="detail-row detail-full">
              <Text className="detail-row-label">💰 三倍工资日期</Text>
              <Text className="detail-row-value detail-text">
                {holiday.wage_dates.map(d => {
                  const date = new Date(d)
                  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
                }).join('、')}
              </Text>
            </View>
          </View>
        )}

        {/* 节日文化卡片 */}
        {(holiday.description || holiday.customs) && (
          <View className="detail-card">
            <Text className="detail-card-title">节日文化</Text>

            {holiday.description && (
              <View className="detail-row detail-full">
                <Text className="detail-row-label">📖 节日介绍</Text>
                <Text className="detail-row-value detail-text">{holiday.description}</Text>
              </View>
            )}

            {holiday.customs && (
              <View className="detail-row detail-full">
                <Text className="detail-row-label">🎊 传统习俗</Text>
                <Text className="detail-row-value detail-text">{holiday.customs}</Text>
              </View>
            )}
          </View>
        )}

        {/* 状态标签 */}
        <View className="detail-tags">
          {holiday.is_official === 1 && (
            <View className="detail-tag detail-tag-primary">法定节假日</View>
          )}
          {holiday.is_rest === 1 && !holiday.is_work && (
            <View className="detail-tag detail-tag-success">休息日</View>
          )}
          {holiday.is_work === 1 && (
            <View className="detail-tag detail-tag-warning">调休上班</View>
          )}
        </View>
      </View>

      {/* 底部占位 */}
      <View className="detail-bottom-spacer" />
    </ScrollView>
  )
}
