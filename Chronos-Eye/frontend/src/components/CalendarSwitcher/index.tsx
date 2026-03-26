/**
 * 历法切换组件
 * 支持公历、农历、干支历、伊斯兰历切换显示
 */
import { View, Text } from '@tarojs/components'
import './index.css'

interface CalendarSwitcherProps {
  activeCalendar: 'solar' | 'lunar' | 'ganzhi' | 'islamic'
  onCalendarChange: (calendar: 'solar' | 'lunar' | 'ganzhi' | 'islamic') => void
  disabled?: boolean
}

const calendarOptions = [
  { key: 'solar', label: '公历', icon: '🌞' },
  { key: 'lunar', label: '农历', icon: '🌙' },
  { key: 'ganzhi', label: '干支', icon: '📅' },
  { key: 'islamic', label: '伊斯兰历', icon: '☪️' }
] as const

export default function CalendarSwitcher(props: CalendarSwitcherProps) {
  const { activeCalendar, onCalendarChange, disabled = false } = props

  return (
    <View className="calendar-switcher">
      {calendarOptions.map((option) => (
        <View
          key={option.key}
          className={`calendar-option ${activeCalendar === option.key ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={() => !disabled && onCalendarChange(option.key)}
        >
          <View className="calendar-icon">{option.icon}</View>
          <View className="calendar-label">{option.label}</View>
        </View>
      ))}
    </View>
  )
}
