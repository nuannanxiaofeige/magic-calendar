import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { scheduleApi } from '../../services/api'
import './schedule.css'

interface Schedule {
  id: number
  title: string
  start_time: string
  end_time?: string
  is_all_day: number
  priority: 'low' | 'normal' | 'high'
  status: 'pending' | 'completed' | 'cancelled'
  color: string
}

export default function Index() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [stats, setStats] = useState({ total: 0, completed: 0, completion_rate: 0 })
  const userId = 1 // TODO: 从登录状态获取

  useEffect(() => {
    loadSchedules()
    loadStats()
  }, [])

  const loadSchedules = async () => {
    try {
      const res = await scheduleApi.getSchedules({ user_id: userId })
      if (res.success && res.data) {
        setSchedules(res.data)
      }
    } catch (error) {
      console.error('加载日程失败:', error)
    }
  }

  const loadStats = async () => {
    try {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const res = await scheduleApi.getMonthStats(userId, year, month)
      if (res.success && res.data) {
        setStats(res.data)
      }
    } catch (error) {
      console.error('加载统计失败:', error)
    }
  }

  const handleAddSchedule = () => {
    Taro.navigateTo({
      url: '/pages/schedule/add'
    })
  }

  const toggleScheduleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    try {
      const res = await scheduleApi.updateSchedule(id, { status: newStatus })
      if (res.success) {
        setSchedules(schedules.map(s =>
          s.id === id ? { ...s, status: newStatus as any } : s
        ))
        loadStats() // 重新加载统计
      }
    } catch (error) {
      console.error('更新状态失败:', error)
      Taro.showToast({ title: '更新失败', icon: 'none' })
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '高'
      case 'normal': return '中'
      case 'low': return '低'
      default: return ''
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${month}月${day}日 ${hour}:${minute}`
  }

  return (
    <ScrollView className="schedule-container" scrollY>
      {/* 统计卡片 */}
      <View className="stats-card">
        <View className="stats-item">
          <Text className="stats-value">{stats.total}</Text>
          <Text className="stats-label">总日程</Text>
        </View>
        <View className="stats-divider" />
        <View className="stats-item">
          <Text className="stats-value">{stats.completed}</Text>
          <Text className="stats-label">已完成</Text>
        </View>
        <View className="stats-divider" />
        <View className="stats-item">
          <Text className="stats-value">{stats.completion_rate}%</Text>
          <Text className="stats-label">完成率</Text>
        </View>
      </View>

      {/* 日程列表 */}
      <View className="schedule-list">
        <View className="list-header">
          <Text className="list-title">今日日程</Text>
          <Button className="add-schedule-btn" onClick={handleAddSchedule}>+</Button>
        </View>

        {schedules.map(item => (
          <View
            key={item.id}
            className={`schedule-item ${item.status === 'completed' ? 'completed' : ''}`}
            onClick={() => toggleScheduleStatus(item.id, item.status)}
          >
            <View
              className="schedule-dot"
              style={{ backgroundColor: item.color }}
            />
            <View className="schedule-content">
              <Text className="schedule-title">{item.title}</Text>
              <Text className="schedule-time">{formatDate(item.start_time)}</Text>
            </View>
            <View className="schedule-priority">
              <Text className={`priority-tag priority-${item.priority}`}>
                {getPriorityText(item.priority)}
              </Text>
            </View>
            <View className={`schedule-checkbox ${item.status === 'completed' ? 'checked' : ''}`}>
              ✓
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}
