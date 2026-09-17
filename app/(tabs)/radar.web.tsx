import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRadarFrames } from '../../hooks/useRadarFrames';
import { radarTileUrlTemplate, formatFrameTime } from '../../lib/radar';
import { RadarLegend } from '../../components/RadarLegend';
import { getAreas, Area } from '../../lib/storage';
import { getCurrentDeviceLocation } from '../../lib/location';
import { colors } from '../../constants/theme';

const SWEDEN_CENTER: [number, number] = [62.5, 15.5];

const areaIcon = divIcon({
  html: '<div style="font-size:22px">📍</div>',
  className: '',
  iconSize: [22, 22],
});

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function RadarScreenWeb() {
  const { host, frames, frame, frameIndex, setFrameIndex, error } = useRadarFrames();
  const [areas, setAreas] = useState<Area[]>([]);
  const [center, setCenter] = useState<[number, number]>(SWEDEN_CENTER);

  useEffect(() => {
    getAreas().then(setAreas);
    getCurrentDeviceLocation()
      .then((loc) => setCenter([loc.latitude, loc.longitude]))
      .catch(() => {});
  }, []);

  const tileTemplate = host && frame ? radarTileUrlTemplate(host, frame) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Väderradar</Text>
      <View style={styles.mapWrap}>
        <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }}>
          <Recenter center={center} />
          <TileLayer
            attribution='&copy; OpenStreetMap-bidragsgivare'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {tileTemplate && <TileLayer url={tileTemplate} opacity={0.7} />}
          {areas.map((a) => (
            <Marker key={a.id} position={[a.latitude, a.longitude]} icon={areaIcon}>
              <Popup>{a.name}</Popup>
            </Marker>
          ))}
        </MapContainer>
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
