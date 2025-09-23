import React, { useCallback, useEffect, useRef } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { View, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { LocalPlace } from '../types/models';

const DEFAULT_DELTA = 0.05;
const MAP_HEIGHT = Dimensions.get('window').height * 0.4;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: MAP_HEIGHT,
  },
  map: {
    flex: 1,
  },
  recenterButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    padding: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});

export const MapWithMarkers: React.FC<{
  places: LocalPlace[];
  center: { latitude: number; longitude: number };
  onMarkerPress?: (id: string) => void;
}> = ({ places, center, onMarkerPress }) => {
  const mapRef = useRef<MapView | null>(null);

  const animateToCenter = useCallback(() => {
    const region: Region = {
      latitude: center.latitude,
      longitude: center.longitude,
      latitudeDelta: DEFAULT_DELTA,
      longitudeDelta: DEFAULT_DELTA,
    };

    if (mapRef.current) {
      mapRef.current.animateToRegion(region, 600);
    }
  }, [center.latitude, center.longitude]);

  useEffect(() => {
    animateToCenter();
  }, [animateToCenter]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: center.latitude,
          longitude: center.longitude,
          latitudeDelta: DEFAULT_DELTA,
          longitudeDelta: DEFAULT_DELTA,
        }}
        showsUserLocation
      >
        {places.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.coords.lat, longitude: p.coords.lng }}
            title={p.name}
            description={p.address}
            onPress={() => onMarkerPress && onMarkerPress(p.id)}
          />
        ))}
      </MapView>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Recentralizar mapa"
        onPress={animateToCenter}
        style={styles.recenterButton}
      >
        <MaterialIcons name="my-location" size={22} color="#333" />
      </TouchableOpacity>
    </View>
  );
};
