import { StyleSheet, Text, View } from 'react-native';
import { CurrentWeather, windDirectionLabel } from '../lib/openMeteo';
import { describeWeatherCode } from '../lib/weatherCodes';
import { colors } from '../constants/theme';

export function WeatherCard({ current }: { current: CurrentWeather }) {
  const info = describeWeatherCode(current.weatherCode);

  return (
    <View style={styles.container}>
      <View style={styles.mainRow}>
        <Text style={styles.emoji}>{info.emoji}</Text>
        <View>
          <Text style={styles.temp}>{Math.round(current.temperature)}°</Text>
          <Text style={styles.desc}>{info.text}</Text>
        </View>
      </View>
      <Text style={styles.feelsLike}>Känns som {Math.round(current.apparentTemperature)}°</Text>

      <View style={styles.grid}>
        <Stat label="Vind" value={`${Math.round(current.windSpeed)} m/s`} />
        <Stat label="Byar" value={`${Math.round(current.windGusts)} m/s`} />
        <Stat label="Riktning" value={windDirectionLabel(current.windDirection)} />
        <Stat label="Nederbörd" value={`${current.precipitation.toFixed(1)} mm/h`} />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  emoji: {
    fontSize: 56,
  },
  temp: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
  },
  desc: {
    fontSize: 16,
    color: colors.textMuted,
  },
  feelsLike: {
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  stat: {
    flexBasis: '47%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
  },
  statValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});
