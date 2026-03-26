import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import RecentFestivalCard from '../../components/RecentFestivalCard'
import { holidayApi, almanacApi, termApi, lunarFestivalApi, tiangouApi, workerDiaryApi } from '../../services/api'
import './index.css'

interface Festival {
  id: number
  name: string
  date: string
  date_full?: string
  type: string
  days_left: number
  is_official?: number
}

interface Almanac {
  date: string
  lunar_year: number
  lunar_month: number
  lunar_day: number
  yi: string
  ji: string
}

interface TermInfo {
  current: {
    name: string
    date: string
    isToday: boolean
  }
  next: {
    name: string
    date: string
    daysLeft: number
  }
  detail?: {
    description: string
    customs: string
  }
}

interface LunarFestival {
  id: number
  name: string
  type: string
  description: string
  customs: string
  isToday: boolean
  daysLeft?: number
}

interface Diary {
  id: number
  content: string
  date?: string
}

interface WorkerDiary {
  id: number
  content: string
  date?: string
  isWorkday?: boolean
}

export default function Index() {
  const [currentDate, setCurrentDate] = useState('')
  const [lunarDate, setLunarDate] = useState('')
  const [almanac, setAlmanac] = useState<Almanac | null>(null)
  const [festivals, setFestivals] = useState<Festival[]>([])
  const [currentTerm, setCurrentTerm] = useState<TermInfo | null>(null)
  const [todayLunarFestival, setTodayLunarFestival] = useState<LunarFestival | null>(null)
  const [todayDiary, setTodayDiary] = useState<Diary | null>(null)
  const [todayWorkerDiary, setTodayWorkerDiary] = useState<WorkerDiary | null>(null)
  const [isWorkday, setIsWorkday] = useState<boolean>(false)

  useEffect(() => {
    const now = new Date()
    setCurrentDate(`${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`)
    loadAlmanac()
    loadRecentFestivals()
    loadCurrentTerm()
    loadTodayLunarFestival()
    loadTodayDiary()
    loadWorkerDiary()
  }, [])

  const loadAlmanac = async () => {
    const res = await almanacApi.getTodayAlmanac()
    if (res.success && res.data) {
      setAlmanac(res.data)
      setLunarDate(`农历${res.data.lunar_year}年${res.data.lunar_month}月${res.data.lunar_day}`)
    } else {
      setLunarDate('农历加载失败')
    }
  }

  const loadRecentFestivals = async () => {
    const res = await holidayApi.getRecentFestivals(5)
    if (res.success && res.data) {
      setFestivals(res.data)
    }
  }

  const loadCurrentTerm = async () => {
    const res = await termApi.getCurrentTerm()
    if (res.success && res.data) {
      setCurrentTerm(res.data)
    }
  }

  const loadTodayLunarFestival = async () => {
    const res = await lunarFestivalApi.getTodayLunarFestival()
    if (res.success && res.data) {
      setTodayLunarFestival(res.data)
    }
  }

  const loadTodayDiary = async () => {
    try {
      const res = await tiangouApi.getDailyDiary()
      console.log('舔狗日记 API 响应:', res)
      if (res.success && res.data) {
        setTodayDiary(res.data)
      }
    } catch (err) {
      console.error('加载舔狗日记失败:', err)
    }
  }

  const loadWorkerDiary = async () => {
    try {
      const res = await workerDiaryApi.getDailyDiary()
      console.log('打工者日记 API 响应:', res)
      if (res.success) {
        setIsWorkday(res.data?.isWorkday || false)
        if (res.data && res.data.isWorkday) {
          setTodayWorkerDiary(res.data)
        }
      }
    } catch (err) {
      console.error('加载打工者日记失败:', err)
    }
  }

  const goToCountdown = () => {
    Taro.navigateTo({ url: '/pages/countdown/countdown' })
  }

  const goToSchedule = () => {
    Taro.navigateTo({ url: '/pages/schedule/schedule' })
  }

  const goToTiangou = () => {
    Taro.navigateTo({ url: '/pages/tiangou/tiangou' })
  }

  const goToWorker = () => {
    Taro.navigateTo({ url: '/pages/worker/worker' })
  }

  const goToOil = () => {
    Taro.navigateTo({ url: '/pages/oil/oil' })
  }

  return (
    <ScrollView className="container" scrollY>
      {/* 头部综合信息卡片 */}
      <View className="header-card">
        {/* 日期区域 */}
        <View className="date-section">
          <Text className="solar-date">{currentDate}</Text>
          <Text className="lunar-date">{lunarDate}</Text>
        </View>

        {/* 黄历宜忌区域 */}
        <View className="almanac-section">
          <Text className="almanac-label">宜</Text>
          <Text className="almanac-content">{almanac?.yi || '开光 出行 嫁娶 动土 安葬'}</Text>
        </View>
        <View className="almanac-section">
          <Text className="almanac-label">忌</Text>
          <Text className="almanac-content">{almanac?.ji || '开市 交易'}</Text>
        </View>

        {/* 分隔线 */}
        <View className="divider" />

        {/* 今日农历节日 */}
        {todayLunarFestival && (
          <View className="info-row">
            <View className="info-label">
              <Text className="info-icon">🌙</Text>
              <Text className="info-title">今日</Text>
            </View>
            <View className="info-content">
              <View className="info-content-inner">
                <View className="info-main">
                  <Text className="info-name">{todayLunarFestival.name}</Text>
                  <Text className="info-subtitle">{todayLunarFestival.description}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 下一个节气 */}
        {currentTerm && currentTerm.next && (
          <View className="info-row">
            <View className="info-label">
              <Text className="info-icon">🌿</Text>
              <Text className="info-title">下一个节气</Text>
            </View>
            <View className="info-content">
              <View className="info-content-inner">
                <View className="info-main">
                  <Text className="info-name">{currentTerm.next.name}</Text>
                  <Text className="info-subtitle">{currentTerm.next.date}</Text>
                </View>
                <View className="days-badge">
                  <Text className="days-number">{currentTerm.next.daysLeft}</Text>
                  <Text className="days-unit">天</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 今日舔狗日记 */}
        {todayDiary && (
          <View className="info-row" onTap={goToTiangou}>
            <View className="info-label">
              <Text className="info-icon">🐶</Text>
              <Text className="info-title">舔狗</Text>
            </View>
            <View className="info-content tiangou-content">
              <Text className="tiangou-text">{todayDiary.content?.substring(0, 50)}...</Text>
            </View>
          </View>
        )}

        {/* 今日打工者日记（仅工作日） */}
        {isWorkday && todayWorkerDiary && (
          <View className="info-row" onTap={goToWorker}>
            <View className="info-label">
              <Text className="info-icon">💼</Text>
              <Text className="info-title">打工</Text>
            </View>
            <View className="info-content worker-content">
              <Text className="worker-text">{todayWorkerDiary.content?.substring(0, 50)}...</Text>
            </View>
          </View>
        )}
      </View>

      {/* 最近节日列表区域 */}
      <View className="countdown-section">
        <View className="section-header">
          <Text className="section-title">最近节日</Text>
          <Text className="section-more" onTap={goToCountdown}>更多 {'>'}</Text>
        </View>
        <View className="countdown-list">
          {festivals.map(item => (
            <RecentFestivalCard key={item.id} festival={item} />
          ))}
        </View>
      </View>

      {/* 快捷功能入口 */}
      <View className="quick-access">
        <View className="access-item" onTap={goToSchedule}>
          <View className="access-icon">📅</View>
          <Text className="access-text">日程管理</Text>
        </View>
        <View className="access-item" onTap={goToOil}>
          <View className="access-icon">⛽</View>
          <Text className="access-text">全国油价</Text>
        </View>
        <View className="access-item">
          <View className="access-icon">📜</View>
          <Text className="access-text">历史上的今天</Text>
        </View>
        <View className="access-item">
          <View className="access-icon">🎊</View>
          <Text className="access-text">节日大全</Text>
        </View>
        <View className="access-item">
          <View className="access-icon">✨</View>
          <Text className="access-text">吉日查询</Text>
        </View>
      </View>
    </ScrollView>
  )
}
