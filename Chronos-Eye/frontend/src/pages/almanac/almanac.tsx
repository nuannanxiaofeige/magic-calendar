import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { almanacApi } from '../../services/api'
import './almanac.css'

interface AlmanacData {
  date: string
  lunar_year?: number
  lunar_month?: number
  lunar_day?: number
  ganzhi_year?: string
  ganzhi_month?: string
  ganzhi_day?: string
  zodiac?: string
  yi?: string
  ji?: string
  shen_sha?: string
  lucky_time?: string
  conflict_zodiac?: string
  lucky_direction?: string
  lucky_color?: string
  lucky_number?: string
  rating?: number
}

export default function Index() {
  const [almanac, setAlmanac] = useState<AlmanacData | null>(null)
  const [currentDate, setCurrentDate] = useState('')

  useEffect(() => {
    loadAlmanac()
  }, [])

  const loadAlmanac = async () => {
    try {
      const res = await almanacApi.getTodayAlmanac()
      if (res.success && res.data) {
        setAlmanac(res.data)
        // 更新农历日期显示
        const now = new Date()
        const lunarStr = `农历 ${res.data.lunar_year}年${res.data.lunar_month}月${res.data.lunar_day}`
        setCurrentDate(`${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日\n${lunarStr}`)
      }
    } catch (error) {
      console.error('加载黄历失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  return (
    <ScrollView className="almanac-container" scrollY>
      <View className="almanac-header">
        <Text className="date-text">{currentDate}</Text>
        {almanac && (
          <Text className="lunar-text">
            农历 {almanac.lunar_year}年{almanac.lunar_month}月{almanac.lunar_day}
          </Text>
        )}
      </View>

      {almanac && (
        <>
          <View className="ganzhi-section">
            <View className="ganzhi-item">
              <Text className="ganzhi-label">干支</Text>
              <Text className="ganzhi-value">
                {almanac.ganzhi_year}年 {almanac.ganzhi_month}月 {almanac.ganzhi_day}日
              </Text>
            </View>
            <View className="ganzhi-item">
              <Text className="ganzhi-label">生肖</Text>
              <Text className="ganzhi-value">{almanac.zodiac}</Text>
            </View>
          </View>

          <View className="yiji-section">
            <View className="yi-item">
              <Text className="yi-label">宜</Text>
              <Text className="yi-ji-value">{almanac.yi}</Text>
            </View>
            <View className="ji-item">
              <Text className="ji-label">忌</Text>
              <Text className="yi-ji-value">{almanac.ji}</Text>
            </View>
          </View>

          <View className="detail-section">
            <View className="detail-item">
              <Text className="detail-label">神煞</Text>
              <Text className="detail-value">{almanac.shen_sha}</Text>
            </View>
            <View className="detail-item">
              <Text className="detail-label">吉时</Text>
              <Text className="detail-value">{almanac.lucky_time}</Text>
            </View>
            <View className="detail-item">
              <Text className="detail-label">相冲</Text>
              <Text className="detail-value">{almanac.conflict_zodiac}</Text>
            </View>
            <View className="detail-item">
              <Text className="detail-label">吉神方位</Text>
              <Text className="detail-value">{almanac.lucky_direction}</Text>
            </View>
            <View className="detail-item">
              <Text className="detail-label">幸运颜色</Text>
              <Text className="detail-value">{almanac.lucky_color}</Text>
            </View>
            <View className="detail-item">
              <Text className="detail-label">幸运数字</Text>
              <Text className="detail-value">{almanac.lucky_number}</Text>
            </View>
          </View>

          <View className="rating-section">
            <Text className="rating-label">今日运势</Text>
            <View className="rating-stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <Text
                  key={i}
                  className={`star ${i < (almanac.rating || 0) ? 'active' : ''}`}
                >
                  ★
                </Text>
              ))}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  )
}
