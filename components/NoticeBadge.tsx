import { StyleSheet, Text, View } from 'react-native';
import { WeatherNotice } from '../lib/openMeteo';
import { colors, noticeColors } from '../constants/theme';

export function NoticeBadge({ notice }: { notice: WeatherNotice }) {
  const color = noticeColors[notice.level];
  return (
    <View style={[styles.container, { borderColor: color, backgroundColor: `${color}22` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color }]}>{notice.title}</Text>
        <Text style={styles.message}>{notice.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },
  message: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
