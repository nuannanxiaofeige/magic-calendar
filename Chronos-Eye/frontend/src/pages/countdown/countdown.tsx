import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import CountdownCard from '../../components/CountdownCard'
import NextHolidayCard from '../../components/NextHolidayCard'
import { holidayApi } from '../../services/api'
import './countdown.css'

interface Holiday {
  id: number
  name: string
  date: string
  type: 'festival' | 'solar' | 'lunar' | 'custom'
  daysLeft: number
  is_recurring?: number
  reminder_days?: number
}

interface NextHoliday {
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

export default function Index() {
  const [countdowns, setCountdowns] = useState<Holiday[]>([])
  const [nextHoliday, setNextHoliday] = useState<NextHoliday | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadNextHoliday()
    loadCountdowns()
  }, [])

  const loadNextHoliday = async () => {
    try {
      const res = await holidayApi.getNextHoliday()
      if (res.success && res.data) {
        setNextHoliday(res.data)
      }
    } catch (error) {
      console.error('加载下一个节假日失败:', error)
    }
  }

  const loadCountdowns = async () => {
    try {
      const res = await holidayApi.getCountdownList(1)
      if (res.success && res.data) {
        setCountdowns(res.data)
      }
    } catch (error) {
      console.error('加载倒计时失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  const handleAddCountdown = () => {
    Taro.navigateTo({
      url: '/pages/countdown/add'
    })
  }

  return (
    <ScrollView className="countdown-container" scrollY>
      <View className="countdown-header">
        <Text className="header-title">我的倒计时</Text>
        <Text className="header-subtitle">记录每一个重要时刻</Text>
      </View>

      {/* 下一个节假日卡片 */}
      {nextHoliday && (
        <View className="next-holiday-section">
          <NextHolidayCard holiday={nextHoliday} />
        </View>
      )}

      <View className="countdown-list">
        <Text className="section-title">我的倒计时</Text>
        {countdowns.map(item => (
          <CountdownCard key={item.id} holiday={item} />
        ))}
      </View>

      <View className="add-button-wrapper">
        <Button className="add-button" onClick={handleAddCountdown}>
          + 添加倒计时
        </Button>
      </View>
    </ScrollView>
  )
}
