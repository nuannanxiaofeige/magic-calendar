/**
 * 节气百科弹窗组件
 */
import { View, Text } from '@tarojs/components'
import './index.css'

interface TermEncyclopediaProps {
  visible: boolean
  onClose: () => void
  termData: {
    term_name: string
    origin: string
    phenology: string
    customs: string
    health_tips: string
    poetry: string
  } | null
}

export default function TermEncyclopedia(props: TermEncyclopediaProps) {
  const { visible, onClose, termData } = props

  if (!visible || !termData) {
    return null
  }

  return (
    <View className="term-encyclopedia-overlay" onClick={onClose}>
      <View className="term-encyclopedia-content" onClick={(e) => e.stopPropagation()}>
        <View className="term-header">
          <Text className="term-title">{termData.term_name}</Text>
          <Text className="term-close" onClick={onClose}>✕</Text>
        </View>

        <View className="term-body">
          <View className="term-section">
            <Text className="term-section-title">📖 节气起源</Text>
            <Text className="term-section-content">{termData.origin}</Text>
          </View>

          <View className="term-section">
            <Text className="term-section-title">🌱 物候特征</Text>
            <Text className="term-section-content">{termData.phenology}</Text>
          </View>

          <View className="term-section">
            <Text className="term-section-title">🏮 传统习俗</Text>
            <Text className="term-section-content">{termData.customs}</Text>
          </View>

          <View className="term-section">
            <Text className="term-section-title">💊 养生建议</Text>
            <Text className="term-section-content">{termData.health_tips}</Text>
          </View>

          {termData.poetry && (
            <View className="term-section">
              <Text className="term-section-title">📜 相关诗词</Text>
              <Text className="term-section-content term-poetry">{termData.poetry}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
