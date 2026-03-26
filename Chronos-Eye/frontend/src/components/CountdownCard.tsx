import { View, Text, Navigator } from '@tarojs/components'
import './CountdownCard.css'

interface Holiday {
  id: number
  name: string
  date: string
  type: 'festival' | 'solar' | 'lunar'
  daysLeft: number
}

interface CountdownCardProps {
  holiday: Holiday
}

export default function CountdownCard({ holiday }: CountdownCardProps) {
  return (
    <Navigator
      className="countdown-card"
      url={`/pages/countdown/detail?id=${holiday.id}`}
      hoverClass="countdown-card-hover"
    >
      <View className="countdown-header">
        <Text>{holiday.name}</Text>
        <Text>{holiday.date}</Text>
      </View>
      <View className="countdown-body">
        <Text>{holiday.daysLeft}</Text>
        <Text>天</Text>
      </View>
      <View className="countdown-footer">
        <Text>
          {holiday.daysLeft > 0 ? `距离${holiday.name}还有` : `${holiday.name}已过`}
        </Text>
      </View>
    </Navigator>
  )
}
