import React, { useEffect, useRef } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { View, Dimensions } from 'react-native';
import type { LocalPlace } from '../types/models';

const DEFAULT_DELTA = 0.05;

export const MapWithMarkers: React.FC<{
  places: LocalPlace[];
  center: { latitude: number; longitude: number };
  onMarkerPress?: (id: string) => void;
}> = ({ places, center, onMarkerPress }) => {
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
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

  return (
    <View style={{ width: '100%', height: Dimensions.get('window').height * 0.40 }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
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
    </View>
  );
};
