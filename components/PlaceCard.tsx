import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Chip } from 'react-native-paper';
import { RatingStars } from './RatingStars';
import type { LocalPlace } from '../types/models';

type PlaceWithHighlights = LocalPlace & {
  kidScore?: number;
  featureChips?: string[];
};

export const PlaceCard: React.FC<{ place: PlaceWithHighlights }> = ({ place }) => {
  const router = useRouter();
  const kidScore = typeof place.kidScore === 'number' && Number.isFinite(place.kidScore)
    ? Math.round(place.kidScore)
    : null;
  const featureChips = Array.isArray(place.featureChips) ? place.featureChips : [];
  const categoriesLabel = (place.categories || []).join(', ');

  return (
    <TouchableOpacity onPress={() => router.push(`/local/${place.id}`)}>
      <Card style={{ marginBottom: 12 }}>
        <Card.Title title={place.name} subtitle={place.address || ''} />
        <Card.Content>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <RatingStars value={place.googleRating || place.kidspotRating} />
            {kidScore !== null ? (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 12, color: '#2e7d32', fontWeight: '600' }}>KidScore</Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#1b5e20' }}>{kidScore}/100</Text>
              </View>
            ) : null}
          </View>
          {categoriesLabel ? <Text style={{ color: '#666', marginTop: 4 }}>{categoriesLabel}</Text> : null}
          {place.description ? <Text style={{ marginTop: 8 }}>{place.description}</Text> : null}
          {featureChips.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
              {featureChips.map((chip) => (
                <Chip key={chip} compact style={{ backgroundColor: '#eef5ff', marginRight: 6, marginBottom: 6 }} textStyle={{ fontSize: 12 }}>
                  {chip}
                </Chip>
              ))}
            </View>
          ) : null}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};
