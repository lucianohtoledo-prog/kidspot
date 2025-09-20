import React from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { View, Dimensions } from 'react-native';
import type { LocalPlace } from '../types/models';

export const MapWithMarkers: React.FC<{
  places: LocalPlace[];
  center: { latitude: number; longitude: number };
  onMarkerPress?: (id: string) => void;
}> = ({ places, center, onMarkerPress }) => {
  const initialRegion = {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={{ width: '100%', height: Dimensions.get('window').height * 0.40 }}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
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
