import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { PlaceResult, searchPlaces } from '../lib/geocoding';
import { colors } from '../constants/theme';

export function LocationSearch({ onSelect }: { onSelect: (place: PlaceResult) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timeout = setTimeout(() => {
      searchPlaces(query, controller.signal)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Sök en plats, t.ex. Göteborg"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoCorrect={false}
      />
      {loading && <ActivityIndicator style={styles.spinner} color={colors.accent} />}
      {results.map((place) => (
        <Pressable
          key={place.id}
          style={styles.resultRow}
          onPress={() => {
            onSelect(place);
            setQuery('');
            setResults([]);
          }}
        >
          <Text style={styles.resultName}>{place.name}</Text>
          <Text style={styles.resultDetail}>
            {[place.admin1, place.country].filter(Boolean).join(', ')}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  spinner: {
    marginTop: 8,
  },
  resultRow: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  resultDetail: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});
