import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { HourlyPoint } from '../lib/openMeteo';
import { describeWeatherCode } from '../lib/weatherCodes';
import { colors } from '../constants/theme';

export function HourlyStrip({ hours }: { hours: HourlyPoint[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {hours.map((h) => {
        const info = describeWeatherCode(h.weatherCode);
        const time = new Date(h.time).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
        return (
          <View key={h.time} style={[styles.item, info.isThunder && styles.thunderItem]}>
            <Text style={styles.time}>{time}</Text>
            <Text style={styles.emoji}>{info.emoji}</Text>
            <Text style={styles.temp}>{Math.round(h.temperature)}°</Text>
            <Text style={styles.wind}>{Math.round(h.windGusts)} m/s</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 10,
    paddingVertical: 4,
  },
  item: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    minWidth: 66,
  },
  thunderItem: {
    borderColor: colors.severe,
  },
  time: {
    color: colors.textMuted,
    fontSize: 12,
  },
  emoji: {
    fontSize: 22,
    marginVertical: 6,
  },
  temp: {
    color: colors.text,
    fontWeight: '700',
  },
  wind: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
});
