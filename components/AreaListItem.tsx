import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Area, AREA_TYPES, Settings, effectiveThresholds } from '../lib/storage';
import { useWeather } from '../hooks/useWeather';
import { describeWeatherCode } from '../lib/weatherCodes';
import { colors, noticeColors } from '../constants/theme';

export function AreaListItem({
  area,
  settings,
  onPress,
  onDelete,
}: {
  area: Area;
  settings: Settings;
  onPress: () => void;
  onDelete: () => void;
}) {
  const thresholds = effectiveThresholds(settings, area);
  const { report, notices } = useWeather(area.latitude, area.longitude, thresholds);
  const info = report ? describeWeatherCode(report.current.weatherCode) : null;
  const worst = notices.sort((a, b) => severityRank(b.level) - severityRank(a.level))[0];
  const typeEmoji = AREA_TYPES.find((t) => t.value === area.type)?.emoji ?? '📍';

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.left}>
        <Text style={styles.emoji}>{info?.emoji ?? '🌍'}</Text>
      </View>
      <View style={styles.middle}>
        <Text style={styles.name}>
          {typeEmoji} {area.name}
        </Text>
        {worst ? (
          <Text style={[styles.notice, { color: noticeColors[worst.level] }]} numberOfLines={1}>
            {worst.title}
          </Text>
        ) : (
          <Text style={styles.notice} numberOfLines={1}>
            {info?.text ?? 'Hämtar väder…'}
          </Text>
        )}
      </View>
      <View style={styles.right}>
        {report && <Text style={styles.temp}>{Math.round(report.current.temperature)}°</Text>}
        <Pressable hitSlop={10} onPress={onDelete} style={styles.deleteButton}>
          <Text style={styles.deleteText}>Ta bort</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function severityRank(level: 'info' | 'warning' | 'severe') {
  return { info: 0, warning: 1, severe: 2 }[level];
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  left: {
    width: 44,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  middle: {
    flex: 1,
    marginLeft: 8,
  },
  name: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  notice: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  temp: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 18,
  },
  deleteButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  deleteText: {
    color: colors.textMuted,
    fontSize: 11,
  },
});
