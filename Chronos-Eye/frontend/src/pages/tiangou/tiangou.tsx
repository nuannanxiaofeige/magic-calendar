import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { tiangouApi } from '../../services/api'
import './tiangou.css'

interface Diary {
  id: number
  content: string
  date?: string
  created_at: string
}

export default function Tiangou() {
  const [todayDiary, setTodayDiary] = useState<Diary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadTodayDiary()
  }, [])

  const loadTodayDiary = async () => {
    try {
      setLoading(true)
      const res = await tiangouApi.getDailyDiary()
      if (res.success && res.data) {
        setTodayDiary(res.data)
      }
    } catch (error) {
      console.error('加载舔狗日记失败:', error)
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
    <ScrollView className="tiangou-container" scrollY>
      {/* 头部 */}
      <View className="tiangou-header">
        <View className="header-left" onClick={goBack}>
          <Text className="back-icon">{'<'}</Text>
        </View>
        <Text className="header-title">舔狗日记</Text>
        <View className="header-right" onClick={handleRefresh}>
          <Text className={`refresh-icon ${refreshing ? 'rotating' : ''}`}>🔄</Text>
        </View>
      </View>

      {/* 主要内容 */}
      <View className="tiangou-content">
        {loading ? (
          <View className="loading-state">
            <Text className="loading-text">加载中...</Text>
          </View>
        ) : todayDiary ? (
          <View className="diary-card">
            <View className="diary-date">
              <Text className="date-label">今日 {todayDiary.date}</Text>
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
            舔狗日记每天更新一条，同一日期看到的是同一条内容哦~
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}
