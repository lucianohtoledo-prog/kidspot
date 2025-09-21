import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { ActivityIndicator, Button, Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MapWithMarkers } from '../../components/MapWithMarkers';
import { PlaceCard } from '../../components/PlaceCard';
import { FiltersPanel } from '../../components/Filters';
import { usePlaces } from '../../context/PlacesContext';
import { getUserLocation } from '../../services/location';

const SEARCH_DEBOUNCE_MS = 400;

export default function HomeScreen() {
  const router = useRouter();
  const [center, setCenter] = useState<{latitude:number,longitude:number}>({ latitude: -23.55052, longitude: -46.633308 });
  const [searchQuery, setSearchQuery] = useState('');
  const hasRanSearch = useRef(false);
  const { places, loading, refresh } = usePlaces();

  useEffect(() => {
    (async () => {
      const loc = await getUserLocation();
      setCenter(loc);
      await refresh({ lat: loc.latitude, lng: loc.longitude });
    })();
  }, [refresh]);

  useEffect(() => {
    const keyword = searchQuery.trim();
    if (!keyword && !hasRanSearch.current) {
      return;
    }

    const handle = setTimeout(() => {
      refresh(
        { lat: center.latitude, lng: center.longitude },
        keyword ? { keyword } : undefined,
      );
      hasRanSearch.current = !!keyword;
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [searchQuery, center.latitude, center.longitude, refresh]);

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
        />
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
          onPress={() => refresh({ lat: center.latitude, lng: center.longitude }, searchQuery.trim() ? { keyword: searchQuery.trim() } : undefined)}
        >
          Atualizar
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
