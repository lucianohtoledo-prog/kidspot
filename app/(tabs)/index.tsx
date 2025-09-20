import React, { useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { ActivityIndicator, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MapWithMarkers } from '../../components/MapWithMarkers';
import { PlaceCard } from '../../components/PlaceCard';
import { FiltersPanel } from '../../components/Filters';
import { usePlaces } from '../../context/PlacesContext';
import { getUserLocation } from '../../services/location';

export default function HomeScreen() {
  const router = useRouter();
  const [center, setCenter] = useState<{latitude:number,longitude:number}>({ latitude: -23.55052, longitude: -46.633308 });
  const { places, loading, refresh } = usePlaces();

  useEffect(() => {
    (async () => {
      const loc = await getUserLocation();
      setCenter(loc);
      await refresh({ lat: loc.latitude, lng: loc.longitude } as any);
    })();
  }, []);

  return (
    <ScrollView style={{ paddingHorizontal: 12 }}>
      <MapWithMarkers
        places={places}
        center={center}
        onMarkerPress={(id) => router.push(`/local/${id}`)}
      />
      <FiltersPanel />
      <View style={{ paddingVertical: 8 }}>
        <Button mode="outlined" onPress={() => refresh({ lat: center.latitude, lng: center.longitude } as any)}>
          Atualizar
        </Button>
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 16 }} /> : null}
      <View style={{ marginTop: 12 }}>
        {places.map(p => <PlaceCard key={p.id} place={p} />)}
      </View>
    </ScrollView>
  );
}
