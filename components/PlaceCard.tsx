import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from 'react-native-paper';
import { RatingStars } from './RatingStars';
import type { LocalPlace } from '../types/models';

export const PlaceCard: React.FC<{ place: LocalPlace }> = ({ place }) => {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push(`/local/${place.id}`)}>
      <Card style={{ marginBottom: 12 }}>
        <Card.Title title={place.name} subtitle={place.address || ''} />
        {/* Optional photo if available later */}
        <Card.Content>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <RatingStars value={place.googleRating || place.kidspotRating} />
            <Text style={{ color: '#666' }}>{(place.categories||[]).join(', ')}</Text>
          </View>
          {place.description ? <Text style={{ marginTop: 8 }}>{place.description}</Text> : null}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};
