import { View, Text, Navigator } from '@tarojs/components'
import './NextHolidayCard.css'

interface NextHolidayCardProps {
  holiday: {
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
  }
}

const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

// 根据节日名称获取匹配的渐变色
const getHolidayGradient = (name: string, type: string): string => {
  const gradients: Record<string, string> = {
    // 春节相关
    '春节': 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
    '除夕': 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
    '元宵节': 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
    // 清明
    '清明': 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
    // 端午
    '端午': 'linear-gradient(135deg, #27ae60 0%, #16a085 100%)',
    // 七夕
    '七夕': 'linear-gradient(135deg, #e91e63 0%, #f06292 100%)',
    '情人节': 'linear-gradient(135deg, #e91e63 0%, #f06292 100%)',
    // 中秋
    '中秋': 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
    // 国庆
    '国庆': 'linear-gradient(135deg, #e74c3c 0%, #f1c40f 100%)',
    // 重阳
    '重阳': 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
    // 元旦
    '元旦': 'linear-gradient(135deg, #3498db 0%, #9b59b6 100%)',
    // 劳动
    '劳动': 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)',
    // 儿童
    '儿童': 'linear-gradient(135deg, #f39c12 0%, #e74c3c 100%)',
    // 教师
    '教师': 'linear-gradient(135deg, #9b59b6 0%, #3498db 100%)',
    // 圣诞
    '圣诞': 'linear-gradient(135deg, #27ae60 0%, #e74c3c 100%)',
    '万圣': 'linear-gradient(135deg, #e67e22 0%, #2c3e50 100%)',
    // 母亲/父亲
    '母亲': 'linear-gradient(135deg, #e91e63 0%, #f06292 100%)',
    '父亲': 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)',
    // 其他节气
    '立春': 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
    '立夏': 'linear-gradient(135deg, #f39c12 0%, #e74c3c 100%)',
    '立秋': 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)',
    '立冬': 'linear-gradient(135deg, #3498db 0%, #9b59b6 100%)',
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
    return 'linear-gradient(135deg, #e74c3c 0%, #f1c40f 100%)'
  } else if (type === 'lunar') {
    return 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)'
  } else if (type === 'solar') {
    return 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'
  }

  return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
}

export default function NextHolidayCard({ holiday }: NextHolidayCardProps) {
  // 获取节日风格
  const gradient = getHolidayGradient(holiday.name, holiday.type)

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = weekdayNames[date.getDay()]
    return `${month}月${day}日 ${weekday}`
  }

  // 获取假期天数
  const getDuration = () => {
    if (holiday.vacation_dates && holiday.vacation_dates.length > 0) {
      return holiday.vacation_dates.length
    }
    return 1
  }

  // 判断是否调休上班
  const isWorkDay = holiday.is_work === 1

  return (
    <Navigator
      className="next-holiday-card"
      url={`/pages/countdown/detail?id=${holiday.id}`}
      hoverClass="next-holiday-card-hover"
      style={{ background: gradient }}
    >
      {/* 顶部倒计时区域 */}
      <View className="holiday-countdown-header">
        <Text className="holiday-title">{holiday.name}</Text>
        <View className="holiday-countdown">
          <Text className="days-number">{holiday.days_left}</Text>
          <Text className="days-unit">天</Text>
        </View>
        <Text className="countdown-label">
          {holiday.days_left === 0 ? '就是今天！' : `距离${holiday.name}还有`}
        </Text>
      </View>

      {/* 节日详细信息 */}
      <View className="holiday-details">
        {/* 日期信息 */}
        <View className="detail-row">
          <Text className="detail-label">📅 日期</Text>
          <Text className="detail-value">{formatDate(holiday.date)}</Text>
        </View>

        {/* 星期信息 */}
        {holiday.weekday !== undefined && (
          <View className="detail-row">
            <Text className="detail-label">⭐ 星期</Text>
            <Text className="detail-value">{weekdayNames[holiday.weekday]}</Text>
          </View>
        )}

        {/* 假期类型 */}
        <View className="detail-row">
          <Text className="detail-label">🏷️ 类型</Text>
          <Text className="detail-value">
            {holiday.type === 'festival' ? '法定节假日' :
             holiday.type === 'solar' ? '公历节日' :
             holiday.type === 'lunar' ? '农历节日' : '其他'}
          </Text>
        </View>

        {/* 假期天数 */}
        {holiday.vacation_dates && holiday.vacation_dates.length > 0 && (
          <View className="detail-row">
            <Text className="detail-label">📆 假期天数</Text>
            <Text className="detail-value">共 {getDuration()} 天</Text>
          </View>
        )}

        {/* 放假安排 */}
        {holiday.tip && (
          <View className="detail-row detail-full">
            <Text className="detail-label">💡 放假安排</Text>
            <Text className="detail-value detail-text">{holiday.tip}</Text>
          </View>
        )}

        {/* 调休上班信息 */}
        {holiday.work_dates && holiday.work_dates.length > 0 && (
          <View className="detail-row detail-full">
            <Text className="detail-label">⚠️ 调休上班</Text>
            <Text className="detail-value detail-text">
              {holiday.work_dates.map(d => {
                const date = new Date(d)
                return `${date.getMonth() + 1}月${date.getDate()}日`
              }).join('、')}
            </Text>
          </View>
        )}

        {/* 三倍工资日期 */}
        {holiday.wage_dates && holiday.wage_dates.length > 0 && (
          <View className="detail-row detail-full">
            <Text className="detail-label">💰 三倍工资</Text>
            <Text className="detail-value detail-text">
              {holiday.wage_dates.map(d => {
                const date = new Date(d)
                return `${date.getMonth() + 1}月${date.getDate()}日`
              }).join('、')}
            </Text>
          </View>
        )}

        {/* 请假建议 */}
        {holiday.rest_tip && (
          <View className="detail-row detail-full">
            <Text className="detail-label">📝 请假建议</Text>
            <Text className="detail-value detail-text">{holiday.rest_tip}</Text>
          </View>
        )}

        {/* 节日描述 */}
        {holiday.description && (
          <View className="detail-row detail-full">
            <Text className="detail-label">📖 节日描述</Text>
            <Text className="detail-value detail-text">{holiday.description}</Text>
          </View>
        )}

        {/* 节日习俗 */}
        {holiday.customs && (
          <View className="detail-row detail-full">
            <Text className="detail-label">🎊 传统习俗</Text>
            <Text className="detail-value detail-text">{holiday.customs}</Text>
          </View>
        )}
      </View>

      {/* 底部状态标签 */}
      <View className="holiday-tags">
        {holiday.is_official === 1 && (
          <View className="tag tag-primary">法定节假日</View>
        )}
        {holiday.is_rest === 1 && !isWorkDay && (
          <View className="tag tag-success">休息日</View>
        )}
        {isWorkDay && (
          <View className="tag tag-warning">调休上班</View>
        )}
      </View>

      {/* 点击提示 */}
      <View className="click-hint">
        <Text className="hint-text">点击查看完整详情</Text>
      </View>
    </Navigator>
  )
}
