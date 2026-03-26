import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { workerDiaryApi } from '../../services/api'
import './oil.css'

// 省份列表
const PROVINCES = [
  { code: 'beijing', name: '北京' },
  { code: 'shanghai', name: '上海' },
  { code: 'tianjin', name: '天津' },
  { code: 'chongqing', name: '重庆' },
  { code: 'guangdong', name: '广东' },
  { code: 'jiangsu', name: '江苏' },
  { code: 'zhejiang', name: '浙江' },
  { code: 'shandong', name: '山东' },
  { code: 'henan', name: '河南' },
  { code: 'hebei', name: '河北' },
  { code: 'hunan', name: '湖南' },
  { code: 'hubei', name: '湖北' },
  { code: 'sichuan', name: '四川' },
  { code: 'shaanxi', name: '陕西' },
  { code: 'anhui', name: '安徽' },
  { code: 'fujian', name: '福建' },
  { code: 'jiangxi', name: '江西' },
  { code: 'liaoning', name: '辽宁' },
  { code: 'heilongjiang', name: '黑龙江' },
  { code: 'jilin', name: '吉林' },
  { code: 'shanxi', name: '山西' },
  { code: 'hainan', name: '海南' },
  { code: 'guizhou', name: '贵州' },
  { code: 'yunnan', name: '云南' },
  { code: 'gansu', name: '甘肃' },
  { code: 'qinghai', name: '青海' },
  { code: 'neimenggu', name: '内蒙古' },
  { code: 'guangxi', name: '广西' },
  { code: 'ningxia', name: '宁夏' },
  { code: 'xinjiang', name: '新疆' },
  { code: 'xizang', name: '西藏' },
]

interface OilPrice {
  province: string
  province_code: string
  '92'?: string
  '95'?: string
  '98'?: string
  '0'?: string
  change_92?: string
  change_95?: string
  change_98?: string
  change_0?: string
  update_time?: string
  source?: string
}

export default function Oil() {
  const [selectedProvince, setSelectedProvince] = useState('beijing')
  const [oilData, setOilData] = useState<OilPrice | null>(null)
  const [loading, setLoading] = useState(true)
  const [updateTime, setUpdateTime] = useState('')

  useEffect(() => {
    loadOilPrice(selectedProvince)
  }, [selectedProvince])

  const loadOilPrice = async (provinceCode: string) => {
    try {
      setLoading(true)
      const res = await Taro.request({
        url: 'http://47.102.152.82:3000/api/oil-price/' + provinceCode,
        method: 'GET'
      })

      if (res.data.success && res.data.data) {
        setOilData(res.data.data)
        // 格式化更新时间
        const updateTime = res.data.data.update_time
        if (updateTime) {
          try {
            // 处理 ISO 格式或日期字符串
            const date = updateTime.includes('T')
              ? new Date(updateTime)
              : new Date(updateTime.replace(/-/g, '/'))

            if (!isNaN(date.getTime())) {
              const month = date.getMonth() + 1
              const day = date.getDate()
              const hours = date.getHours().toString().padStart(2, '0')
              const minutes = date.getMinutes().toString().padStart(2, '0')
              setUpdateTime(`${month}月${day}日 ${hours}:${minutes}`)
            } else {
              setUpdateTime(updateTime)
            }
          } catch (e) {
            setUpdateTime(updateTime)
          }
        }
      }
    } catch (error) {
      console.error('加载油价数据失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleProvinceChange = (e: any) => {
    const newProvince = PROVINCES[e.detail.value].code
    setSelectedProvince(newProvince)
  }

  const goBack = () => {
    Taro.navigateBack()
  }

  return (
    <ScrollView className="oil-container" scrollY>
      {/* 头部 */}
      <View className="oil-header">
        <View className="header-left" onClick={goBack}>
          <Text className="back-icon">{'<'}</Text>
        </View>
        <Text className="header-title">全国油价</Text>
        <View className="header-right">
          <Text className="refresh-icon">⛽</Text>
        </View>
      </View>

      {/* 省份选择器 */}
      <View className="province-selector">
        <Picker
          range={PROVINCES}
          rangeKey="name"
          value={PROVINCES.findIndex(p => p.code === selectedProvince)}
          onChange={handleProvinceChange}
        >
          <View className="province-btn">
            <Text className="province-text">
              {PROVINCES.find(p => p.code === selectedProvince)?.name || '选择省份'}
            </Text>
            <Text className="arrow-icon">▼</Text>
          </View>
        </Picker>
      </View>

      {/* 更新时间提示 */}
      <View className="update-time-box">
        <Text className="update-label">数据更新时间</Text>
        <Text className="update-time">{updateTime || '加载中...'}</Text>
      </View>

      {/* 油价卡片 */}
      {loading ? (
        <View className="loading-state">
          <Text className="loading-text">加载中...</Text>
        </View>
      ) : oilData ? (
        <View className="price-content">
          {/* 92 号汽油 */}
          <View className="price-card">
            <View className="price-type">
              <Text className="type-label">92 号汽油</Text>
              <View className={`price-change ${oilData.change_92?.includes('+') ? 'up' : 'down'}`}>
                <Text className="change-value">{oilData.change_92 || '--'}</Text>
              </View>
            </View>
            <View className="price-value">
              <Text className="value-num">{oilData['92'] || '--'}</Text>
              <Text className="value-unit">元/升</Text>
            </View>
          </View>

          {/* 95 号汽油 */}
          <View className="price-card">
            <View className="price-type">
              <Text className="type-label">95 号汽油</Text>
              <View className={`price-change ${oilData.change_95?.includes('+') ? 'up' : 'down'}`}>
                <Text className="change-value">{oilData.change_95 || '--'}</Text>
              </View>
            </View>
            <View className="price-value">
              <Text className="value-num">{oilData['95'] || '--'}</Text>
              <Text className="value-unit">元/升</Text>
            </View>
          </View>

          {/* 98 号汽油 */}
          <View className="price-card">
            <View className="price-type">
              <Text className="type-label">98 号汽油</Text>
              <View className={`price-change ${oilData.change_98?.includes('+') ? 'up' : 'down'}`}>
                <Text className="change-value">{oilData.change_98 || '--'}</Text>
              </View>
            </View>
            <View className="price-value">
              <Text className="value-num">{oilData['98'] || '--'}</Text>
              <Text className="value-unit">元/升</Text>
            </View>
          </View>

          {/* 0 号柴油 */}
          <View className="price-card">
            <View className="price-type">
              <Text className="type-label">0 号柴油</Text>
              <View className={`price-change ${oilData.change_0?.includes('+') ? 'up' : 'down'}`}>
                <Text className="change-value">{oilData.change_0 || '--'}</Text>
              </View>
            </View>
            <View className="price-value">
              <Text className="value-num">{oilData['0'] || '--'}</Text>
              <Text className="value-unit">元/升</Text>
            </View>
          </View>

          {/* 数据来源说明 */}
          <View className="source-tip">
            <Text className="tip-title">💡 温馨提示</Text>
            <Text className="tip-content">
              实际价格以当地加油站为准
            </Text>
          </View>
        </View>
      ) : (
        <View className="empty-state">
          <Text className="empty-icon">⛽</Text>
          <Text className="empty-text">暂无油价数据</Text>
        </View>
      )}
    </ScrollView>
  )
}
