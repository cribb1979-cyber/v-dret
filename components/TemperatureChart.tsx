import { Fragment } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { HourlyPoint } from '../lib/openMeteo';
import { colors } from '../constants/theme';

const HEIGHT = 130;
const PADDING_X = 24;
const PADDING_Y = 24;

export function TemperatureChart({ hours }: { hours: HourlyPoint[] }) {
  if (hours.length < 2) return null;

  const temps = hours.map((h) => h.temperature);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const range = Math.max(max - min, 1);

  const width = Math.max(hours.length * 44, 280);
  const innerWidth = width - PADDING_X * 2;
  const innerHeight = HEIGHT - PADDING_Y * 2;

  const points = hours.map((h, i) => {
    const x = PADDING_X + (i / (hours.length - 1)) * innerWidth;
    const y = PADDING_Y + innerHeight - ((h.temperature - min) / range) * innerHeight;
    return { x, y, temp: h.temperature, time: h.time };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${HEIGHT - PADDING_Y} L ${points[0].x} ${HEIGHT - PADDING_Y} Z`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Temperaturtrend</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={width} height={HEIGHT}>
          <Path d={areaPath} fill={colors.accent} fillOpacity={0.15} />
          <Path d={linePath} stroke={colors.accent} strokeWidth={2.5} fill="none" />
          {points.map((p, i) => {
            const showLabel = i === 0 || i === points.length - 1 || i % 4 === 0;
            const time = new Date(p.time).toLocaleTimeString('sv-SE', { hour: '2-digit' });
            return (
              <Fragment key={p.time}>
                <Circle cx={p.x} cy={p.y} r={3} fill={colors.accent} />
                {showLabel && (
                  <SvgText x={p.x} y={HEIGHT - 6} fontSize={10} fill={colors.textMuted} textAnchor="middle">
                    {time}
                  </SvgText>
                )}
              </Fragment>
            );
          })}
          <Line x1={PADDING_X} y1={PADDING_Y} x2={PADDING_X} y2={HEIGHT - PADDING_Y} stroke="transparent" />
        </Svg>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
});
