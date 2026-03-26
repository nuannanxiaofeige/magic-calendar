import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { workerDiaryApi } from '../../services/api'
import './worker.css'

interface Diary {
  id: number
  content: string
  date?: string
  created_at: string
  isWorkday?: boolean
}

export default function Worker() {
  const [todayDiary, setTodayDiary] = useState<Diary | null>(null)
  const [isWorkday, setIsWorkday] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadTodayDiary()
  }, [])

  const loadTodayDiary = async () => {
    try {
      setLoading(true)
      const res = await workerDiaryApi.getDailyDiary()
      if (res.success) {
        setIsWorkday(res.data?.isWorkday || false)
        if (res.data && res.data.isWorkday) {
          setTodayDiary(res.data)
        }
      }
    } catch (error) {
      console.error('加载打工者日记失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadTodayDiary()
    setRefreshing(false)
  }

  const handleShare = () => {
    if (todayDiary?.content) {
      Taro.setClipboardData({
        data: todayDiary.content,
        success: () => {
          Taro.showToast({ title: '已复制到剪贴板', icon: 'success' })
        }
      })
    }
  }

  const goBack = () => {
    Taro.navigateBack()
  }

  return (
    <ScrollView className="worker-container" scrollY>
      {/* 头部 */}
      <View className="worker-header">
        <View className="header-left" onClick={goBack}>
          <Text className="back-icon">{'<'}</Text>
        </View>
        <Text className="header-title">打工者日记</Text>
        <View className="header-right" onClick={handleRefresh}>
          <Text className={`refresh-icon ${refreshing ? 'rotating' : ''}`}>🔄</Text>
        </View>
      </View>

      {/* 主要内容 */}
      <View className="worker-content">
        {loading ? (
          <View className="loading-state">
            <Text className="loading-text">加载中...</Text>
          </View>
        ) : !isWorkday ? (
          <View className="rest-state">
            <View className="rest-icon">🎉</View>
            <Text className="rest-title">今日休息</Text>
            <Text className="rest-subtitle">无需打工，好好享受假期吧～</Text>
          </View>
        ) : todayDiary ? (
          <View className="diary-card">
            <View className="diary-date">
              <Text className="date-label">打工日 {todayDiary.date}</Text>
              <Text className="work-badge">工作日</Text>
            </View>
            <View className="diary-content">
              <Text className="diary-text">{todayDiary.content}</Text>
            </View>
            <View className="diary-footer">
              <Button className="share-btn" onClick={handleShare}>
                复制分享
              </Button>
            </View>
          </View>
        ) : (
          <View className="empty-state">
            <Text className="empty-icon">📝</Text>
            <Text className="empty-text">暂无日记</Text>
          </View>
        )}

        {/* 温馨提示 */}
        <View className="tip-section">
          <Text className="tip-title">💡 温馨提示</Text>
          <Text className="tip-content">
            打工者日记仅在工作日更新，周末和法定节假日不显示哦～
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}
