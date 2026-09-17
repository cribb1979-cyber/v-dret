import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRadarFrames } from '../../hooks/useRadarFrames';
import { radarTileUrlTemplate, formatFrameTime } from '../../lib/radar';
import { RadarLegend } from '../../components/RadarLegend';
import { getAreas, Area } from '../../lib/storage';
import { getCurrentDeviceLocation } from '../../lib/location';
import { colors } from '../../constants/theme';

const SWEDEN_CENTER = { latitude: 62.5, longitude: 15.5, latitudeDelta: 12, longitudeDelta: 12 };

export default function RadarScreen() {
  const { host, frames, frame, frameIndex, setFrameIndex, error } = useRadarFrames();
  const [areas, setAreas] = useState<Area[]>([]);
  const [region, setRegion] = useState(SWEDEN_CENTER);

  useEffect(() => {
    getAreas().then(setAreas);
    getCurrentDeviceLocation()
      .then((loc) =>
        setRegion({ latitude: loc.latitude, longitude: loc.longitude, latitudeDelta: 3, longitudeDelta: 3 })
      )
      .catch(() => {});
  }, []);

  const tileTemplate = host && frame ? radarTileUrlTemplate(host, frame) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Väderradar</Text>
      <View style={styles.mapWrap}>
        <MapView provider={PROVIDER_DEFAULT} style={StyleSheet.absoluteFill} initialRegion={region} region={region}>
          {tileTemplate && (
            <UrlTile urlTemplate={tileTemplate} minimumZ={0} maximumZ={19} tileSize={256} zIndex={1} />
          )}
          {areas.map((a) => (
            <Marker key={a.id} coordinate={{ latitude: a.latitude, longitude: a.longitude }} title={a.name} />
          ))}
        </MapView>
      </View>

      <View style={styles.controls}>
        <Pressable
          style={styles.stepButton}
          onPress={() => setFrameIndex((i) => Math.max(0, i - 1))}
          disabled={frameIndex <= 0}
        >
          <Text style={styles.stepText}>◀︎</Text>
        </Pressable>
        <Text style={styles.frameTime}>{frame ? formatFrameTime(frame) : '—'}</Text>
        <Pressable
          style={styles.stepButton}
          onPress={() => setFrameIndex((i) => Math.min(frames.length - 1, i + 1))}
          disabled={frameIndex >= frames.length - 1}
        >
          <Text style={styles.stepText}>▶︎</Text>
        </Pressable>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.legendWrap}>
        <RadarLegend />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  mapWrap: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 14,
  },
  stepButton: {
    backgroundColor: colors.surfaceAlt,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    color: colors.text,
    fontSize: 16,
  },
  frameTime: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
    minWidth: 60,
    textAlign: 'center',
  },
  error: {
    color: colors.severe,
    textAlign: 'center',
    marginBottom: 8,
  },
  legendWrap: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
});
