import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { ActivityIndicator, Button, Chip, Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MapWithMarkers } from '../../components/MapWithMarkers';
import { PlaceCard } from '../../components/PlaceCard';
import { FiltersPanel } from '../../components/Filters';
import { usePlaces } from '../../context/PlacesContext';
import { getUserLocation } from '../../services/location';

export default function HomeScreen() {
  const router = useRouter();
  const [center, setCenter] = useState<{latitude:number,longitude:number}>({ latitude: -23.55052, longitude: -46.633308 });
  const [searchQuery, setSearchQuery] = useState('');
  const shouldRecenterRef = useRef(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { places, loading, refresh } = usePlaces();

  useEffect(() => {
    (async () => {
      const loc = await getUserLocation();
      setCenter(loc);
      await refresh({ lat: loc.latitude, lng: loc.longitude });
    })();
  }, [refresh]);

  const handleSearch = useCallback(() => {
    shouldRecenterRef.current = true;
    const keyword = searchQuery.trim();
    refresh(
      { lat: center.latitude, lng: center.longitude },
      keyword ? { keyword } : undefined,
    );
  }, [center.latitude, center.longitude, refresh, searchQuery]);

  useEffect(() => {
    const keyword = searchQuery.trim();
    if (!keyword) {
      setSuggestions([]);
      return;
    }

    const normalized = keyword.toLowerCase();
    const unique: string[] = [];
    const seen = new Set<string>();

    const consider = (label: string | undefined) => {
      if (!label) {
        return;
      }
      const normalizedLabel = label.toLowerCase();
      if (!normalizedLabel.includes(normalized) || seen.has(normalizedLabel)) {
        return;
      }
      seen.add(normalizedLabel);
      unique.push(label);
    };

    places.forEach((place) => {
      consider(place.name);
      place.categories.forEach((category) => consider(category));
      consider(place.address);
    });

    setSuggestions(unique.slice(0, 6));
  }, [places, searchQuery]);

  useEffect(() => {
    if (!shouldRecenterRef.current) {
      return;
    }

    const keyword = searchQuery.trim();
    if (!keyword || places.length === 0) {
      shouldRecenterRef.current = false;
      return;
    }

    const target = places[0];
    setCenter((prev) => {
      if (Math.abs(prev.latitude - target.coords.lat) < 1e-6 && Math.abs(prev.longitude - target.coords.lng) < 1e-6) {
        return prev;
      }
      return { latitude: target.coords.lat, longitude: target.coords.lng };
    });
    shouldRecenterRef.current = false;
  }, [places, searchQuery]);

  return (
    <ScrollView style={{ paddingHorizontal: 12 }}>
      <View style={{ paddingTop: 12, paddingBottom: 16 }}>
        <Searchbar
          placeholder="Pesquise aqui"
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon="magnify"
          style={{ borderRadius: 12, elevation: 4 }}
          inputStyle={{ fontSize: 16 }}
          autoCorrect
          autoComplete="street-address"
          autoCapitalize="words"
          returnKeyType="search"
          onIconPress={handleSearch}
          onSubmitEditing={() => handleSearch()}
        />
        {suggestions.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
            {suggestions.map((suggestion) => (
              <Chip
                key={suggestion}
                style={{ marginRight: 8, marginBottom: 8 }}
                onPress={() => setSearchQuery(suggestion)}
              >
                {suggestion}
              </Chip>
            ))}
          </View>
        ) : null}
      </View>
      <MapWithMarkers
        places={places}
        center={center}
        onMarkerPress={(id) => router.push(`/local/${id}`)}
      />
      <FiltersPanel />
      <View style={{ paddingVertical: 8 }}>
        <Button
          mode="outlined"
          onPress={handleSearch}
        >
          Buscar
        </Button>
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 16 }} /> : null}
      {!loading && places.length === 0 ? (
        <Text style={{ marginTop: 16, textAlign: 'center', color: '#666' }}>
          Nenhum local encontrado para a busca.
        </Text>
      ) : null}
      <View style={{ marginTop: 12 }}>
        {places.map(p => <PlaceCard key={p.id} place={p} />)}
      </View>
    </ScrollView>
  );
}
