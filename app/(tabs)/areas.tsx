import { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Area, addArea, getAreas, removeArea } from '../../lib/storage';
import { AreaListItem } from '../../components/AreaListItem';
import { LocationSearch } from '../../components/LocationSearch';
import { getCurrentDeviceLocation } from '../../lib/location';
import { colors } from '../../constants/theme';

export default function AreasScreen() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  const load = useCallback(() => {
    getAreas().then(setAreas);
  }, []);

  useFocusEffect(load);

  const handleDelete = (area: Area) => {
    Alert.alert('Ta bort område', `Sluta bevaka ${area.name}?`, [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Ta bort',
        style: 'destructive',
        onPress: async () => {
          await removeArea(area.id);
          load();
        },
      },
    ]);
  };

  const handleUseCurrentLocation = async () => {
    try {
      const loc = await getCurrentDeviceLocation();
      await addArea({ name: loc.name, latitude: loc.latitude, longitude: loc.longitude });
      setModalVisible(false);
      load();
    } catch (err) {
      Alert.alert('Kunde inte hämta plats', err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Bevakade områden</Text>
        <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Lägg till</Text>
        </Pressable>
      </View>

      <FlatList
        data={areas}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Inga bevakade områden ännu. Lägg till platser för att få väder-, åsk- och blåstnoteringar för flera
            platser samtidigt.
          </Text>
        }
        renderItem={({ item }) => (
          <AreaListItem
            area={item}
            onPress={() => router.push({ pathname: '/omrade/[id]', params: { id: item.id } })}
            onDelete={() => handleDelete(item)}
          />
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Lägg till område</Text>
            <Pressable style={styles.currentLocationButton} onPress={handleUseCurrentLocation}>
              <Text style={styles.currentLocationText}>Använd min nuvarande plats</Text>
            </Pressable>
            <LocationSearch
              onSelect={async (place) => {
                await addArea({ name: place.name, latitude: place.latitude, longitude: place.longitude });
                setModalVisible(false);
                load();
              }}
            />
            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Stäng</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    color: colors.text,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  currentLocationButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  currentLocationText: {
    color: colors.text,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  closeText: {
    color: colors.textMuted,
  },
});
