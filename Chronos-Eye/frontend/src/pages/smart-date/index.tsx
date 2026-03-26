/**
 * 智能日期查询主页 - 混合方案实现
 * 本地计算 + 接口获取精确数据
 */
import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import dayjs from 'dayjs'
import CalendarSwitcher from '../../components/CalendarSwitcher'
import TermEncyclopedia from '../../components/TermEncyclopedia'
import { CalendarService, generateMonthView } from '../../services/calendar'
import './index.css'

interface CalendarData {
  solar: any
  lunar: any
  ganzhi: any
  islamic: any
  term?: any
}

interface HolidayTermLink {
  type: string
  name: string
  message: string
  custom?: string
}

export default function Index() {
  // 当前选中的历法
  const [activeCalendar, setActiveCalendar] = useState<'solar' | 'lunar' | 'ganzhi' | 'islamic'>('solar')

  // 日期数据
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null)
  const [currentDate, setCurrentDate] = useState('')

  // 节气/节假日联动信息
  const [linkInfo, setLinkInfo] = useState<HolidayTermLink[]>([])

  // 节气百科弹窗
  const [showTermModal, setShowTermModal] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState<any>(null)

  // 倒计时数据
  const [countdowns, setCountdowns] = useState<any[]>([])

  // 加载数据
  useEffect(() => {
    loadCalendarInfo()
    loadLinkInfo()
    loadCountdowns()
  }, [])

  const loadCalendarInfo = async () => {
    const now = new Date()
    setCurrentDate(dayjs(now).format('YYYY 年 MM 月 DD 日 dddd'))

    const data = await CalendarService.getCalendarInfo()
    if (data) {
      setCalendarData(data)
    }
  }

  const loadLinkInfo = async () => {
    const data = await CalendarService.getHolidayTermLink()
    if (data?.links) {
      setLinkInfo(data.links)
    }
  }

  const loadCountdowns = async () => {
    // 从本地或接口加载倒计时
    setCountdowns([
      { id: 1, name: '春节', days_left: 15 },
      { id: 2, name: '清明节', days_left: 28 }
    ])
  }

  // 处理节气点击
  const handleTermClick = async (termName: string) => {
    try {
      const detail = await CalendarService.getTermDetail(termName)
      if (detail) {
        setSelectedTerm(detail)
        setShowTermModal(true)
      }
    } catch (error) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  // 渲染联动信息
  const renderLinkInfo = () => {
    if (linkInfo.length === 0) return null

    return (
      <View className="link-info-section">
        {linkInfo.map((link, index) => (
          <View
            key={index}
            className={`link-info-item ${link.type === 'term' ? 'term-link' : ''}`}
            onClick={() => link.type === 'term' && handleTermClick(link.name)}
          >
            <Text className="link-info-message">{link.message}</Text>
            {link.type === 'term' && <Text className="link-info-more">查看详情 ›</Text>}
          </View>
        ))}
      </View>
    )
  }

  // 渲染当前历法内容
  const renderCalendarContent = () => {
    if (!calendarData) return <Text className="loading">加载中...</Text>

    switch (activeCalendar) {
      case 'solar':
        return (
          <View className="calendar-content">
            <Text className="calendar-main-date">{calendarData.solar.date}</Text>
            <Text className="calendar-weekday">{calendarData.solar.weekday}</Text>
          </View>
        )

      case 'lunar':
        return (
          <View className="calendar-content">
            <Text className="calendar-main-date">{calendarData.lunar.date}</Text>
            {calendarData.lunar.isLeap && <Text className="calendar-label">闰月</Text>}
          </View>
        )

      case 'ganzhi':
        return (
          <View className="calendar-content">
            <Text className="calendar-main-date">{calendarData.ganzhi.year}</Text>
            <Text className="calendar-sub-date">生肖：{calendarData.ganzhi.zodiac}</Text>
          </View>
        )

      case 'islamic':
        return (
          <View className="calendar-content">
            <Text className="calendar-main-date">{calendarData.islamic.date}</Text>
          </View>
        )

      default:
        return null
    }
  }

  return (
    <ScrollView className="container" scrollY>
      {/* 历法切换器 */}
      <CalendarSwitcher
        activeCalendar={activeCalendar}
        onCalendarChange={setActiveCalendar}
      />

      {/* 日期展示卡片 */}
      <View className="date-card">
        <Text className="date-weekday">{currentDate}</Text>
        {renderCalendarContent()}
      </View>

      {/* 节气/节假日联动信息 */}
      {renderLinkInfo()}

      {/* 倒计时卡片 */}
      <View className="countdown-section">
        <Text className="section-title">我的倒计时</Text>
        {countdowns.map(item => (
          <View key={item.id} className="countdown-card">
            <Text className="countdown-name">{item.name}</Text>
            <Text className="countdown-days">{item.days_left}天</Text>
          </View>
        ))}
      </View>

      {/* 节气百科弹窗 */}
      <TermEncyclopedia
        visible={showTermModal}
        onClose={() => setShowTermModal(false)}
        termData={selectedTerm}
      />
    </ScrollView>
  )
}
