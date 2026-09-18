import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import { AREA_TYPES, AreaType, addArea } from '../lib/storage';
import { colors } from '../constants/theme';

export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

export function SaveLocationModal({
  coordinate,
  onClose,
  onSaved,
}: {
  coordinate: MapCoordinate | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<AreaType>('annan');

  useEffect(() => {
    if (!coordinate) return;
    setName('');
    setType('annan');
    Location.reverseGeocodeAsync(coordinate)
      .then((places) => {
        const place = places[0];
        if (place) setName(place.city || place.subregion || place.region || '');
      })
      .catch(() => {});
  }, [coordinate]);

  const handleSave = async () => {
    if (!coordinate) return;
    await addArea({
      name: name.trim() || `${coordinate.latitude.toFixed(2)}, ${coordinate.longitude.toFixed(2)}`,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      type,
    });
    onSaved();
    onClose();
  };

  return (
    <Modal visible={!!coordinate} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Spara plats</Text>
          {coordinate && (
            <Text style={styles.coords}>
              {coordinate.latitude.toFixed(4)}, {coordinate.longitude.toFixed(4)}
            </Text>
          )}

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Namn på platsen"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

          <View style={styles.typeRow}>
            {AREA_TYPES.map((t) => (
              <Pressable
                key={t.value}
                style={[styles.typeChip, type === t.value && styles.typeChipActive]}
                onPress={() => setType(t.value)}
              >
                <Text style={styles.typeChipText}>
                  {t.emoji} {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>Spara som bevakat område</Text>
          </Pressable>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Avbryt</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  coords: {
    color: colors.textMuted,
    marginBottom: 14,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
    marginBottom: 14,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  typeChip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typeChipActive: {
    backgroundColor: colors.accent,
  },
  typeChipText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: {
    color: colors.text,
    fontWeight: '700',
  },
  closeButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  closeText: {
    color: colors.textMuted,
  },
});
