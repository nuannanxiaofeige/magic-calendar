import { View, Text, Navigator } from '@tarojs/components'
import './RecentFestivalCard.css'

interface RecentFestivalCardProps {
  festival: {
    id: number
    name: string
    type: string
    date: string
    date_full?: string
    days_left: number
    is_official?: number
  }
}

// 根据节日名称获取匹配的图标和渐变色
const getHolidayStyle = (name: string, type: string) => {
  const styles: Record<string, { icon: string; gradient: string }> = {
    // 春节相关
    '春节': { icon: '🧧', gradient: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' },
    '除夕': { icon: '🏮', gradient: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' },
    '元宵节': { icon: '🏮', gradient: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' },
    // 清明
    '清明': { icon: '🌸', gradient: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)' },
    // 端午
    '端午': { icon: '🫔', gradient: 'linear-gradient(135deg, #27ae60 0%, #16a085 100%)' },
    // 七夕
    '七夕': { icon: '💕', gradient: 'linear-gradient(135deg, #e91e63 0%, #f06292 100%)' },
    '情人节': { icon: '💕', gradient: 'linear-gradient(135deg, #e91e63 0%, #f06292 100%)' },
    // 中秋
    '中秋': { icon: '🌕', gradient: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' },
    // 国庆
    '国庆': { icon: '🇨🇳', gradient: 'linear-gradient(135deg, #e74c3c 0%, #f1c40f 100%)' },
    // 重阳
    '重阳': { icon: '🏔️', gradient: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)' },
    // 元旦
    '元旦': { icon: '🎉', gradient: 'linear-gradient(135deg, #3498db 0%, #9b59b6 100%)' },
    // 劳动
    '劳动': { icon: '🛠️', gradient: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)' },
    // 儿童
    '儿童': { icon: '🧸', gradient: 'linear-gradient(135deg, #f39c12 0%, #e74c3c 100%)' },
    // 教师
    '教师': { icon: '📚', gradient: 'linear-gradient(135deg, #9b59b6 0%, #3498db 100%)' },
    // 圣诞
    '圣诞': { icon: '🎄', gradient: 'linear-gradient(135deg, #27ae60 0%, #e74c3c 100%)' },
    '万圣': { icon: '🎃', gradient: 'linear-gradient(135deg, #e67e22 0%, #2c3e50 100%)' },
    // 母亲/父亲
    '母亲': { icon: '💐', gradient: 'linear-gradient(135deg, #e91e63 0%, #f06292 100%)' },
    '父亲': { icon: '👔', gradient: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)' },
    // 其他节气
    '立春': { icon: '🌱', gradient: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)' },
    '立夏': { icon: '☀️', gradient: 'linear-gradient(135deg, #f39c12 0%, #e74c3c 100%)' },
    '立秋': { icon: '🍂', gradient: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)' },
    '立冬': { icon: '❄️', gradient: 'linear-gradient(135deg, #3498db 0%, #9b59b6 100%)' },
  }

  // 先精确匹配
  if (styles[name]) {
    return styles[name]
  }

  // 模糊匹配：找最长匹配关键词（优先匹配更长的关键词）
  let matchedKey = ''
  for (const key of Object.keys(styles)) {
    if (name.includes(key) && key.length > matchedKey.length) {
      matchedKey = key
    }
  }
  if (matchedKey) {
    return styles[matchedKey]
  }

  // 按类型返回默认
  if (type === 'festival') {
    return { icon: '🇨🇳', gradient: 'linear-gradient(135deg, #e74c3c 0%, #f1c40f 100%)' }
  } else if (type === 'lunar') {
    return { icon: '🌙', gradient: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)' }
  } else if (type === 'solar') {
    return { icon: '☀️', gradient: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' }
  }

  return { icon: '📅', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
}

export default function RecentFestivalCard({ festival }: RecentFestivalCardProps) {
  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}年${month}月${day}日`
  }

  // 获取节日风格
  const style = getHolidayStyle(festival.name, festival.type)

  return (
    <Navigator
      className="recent-festival-card"
      url={`/pages/countdown/detail?id=${festival.id}`}
      hoverClass="recent-festival-card-hover"
    >
      <View className="festival-main">
        <View className="festival-icon" style={{ background: style.gradient }}>{style.icon}</View>
        <View className="festival-info">
          <Text className="festival-name">{festival.name}</Text>
          <Text className="festival-date">{formatDate(festival.date_full || festival.date)}</Text>
        </View>
        <View className="festival-countdown">
          <Text className="countdown-number">{festival.days_left}</Text>
          <Text className="countdown-label">{festival.days_left === 0 ? '今天' : '天'}</Text>
        </View>
      </View>
      {festival.is_official === 1 && (
        <View className="official-tag">{style.gradient.includes('#e74c3c') || style.gradient.includes('#f1c40f') ? '🇨🇳' : '法定'}</View>
      )}
    </Navigator>
  )
}
