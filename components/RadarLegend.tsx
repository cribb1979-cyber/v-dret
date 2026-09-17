import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

const STOPS = [
  { color: '#5BB8FF', label: 'Lätt' },
  { color: '#3D8CFF', label: 'Måttlig' },
  { color: '#F5A623', label: 'Kraftig' },
  { color: '#E5484D', label: 'Mycket kraftig' },
];

export function RadarLegend() {
  return (
    <View style={styles.container}>
      {STOPS.map((s) => (
        <View key={s.label} style={styles.item}>
          <View style={[styles.swatch, { backgroundColor: s.color }]} />
          <Text style={styles.label}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
