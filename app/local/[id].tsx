import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import demoPlaces from '../../data/demo/locals.json';
import demoReviews from '../../data/demo/reviews.json';
import { ScrollView, View } from 'react-native';
import { Appbar, Button, Card, Chip, Divider, Text } from 'react-native-paper';
import { AmenityChips } from '../../components/AmenityChips';
import { RatingStars } from '../../components/RatingStars';

export default function LocalDetail() {
  const { id } = useLocalSearchParams<{id: string}>();
  const place = demoPlaces.find(p => p.id === id);
  const reviews = demoReviews.filter(r => r.placeId === id);

  if (!place) return <Text>Local não encontrado.</Text>;

  return (
    <ScrollView>
      <Card>
        <Card.Title title={place.name} subtitle={place.address} />
        <Card.Content>
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            <Text>Google</Text><RatingStars value={place.googleRating} />
            <Text>KidSpot</Text><RatingStars value={place.kidspotRating} />
          </View>
          <View style={{ marginTop: 8 }}>
            <AmenityChips items={place.amenities as any} />
          </View>
          {place.description ? <Text style={{ marginTop: 8 }}>{place.description}</Text> : null}
          <Divider style={{ marginVertical: 12 }} />
          <Text style={{ fontWeight: '700' }}>Horários</Text>
          {place.openingHours?.map((h, idx) => <Text key={idx}>{h}</Text>)}
        </Card.Content>
      </Card>

      <View style={{ padding: 12 }}>
        <Text style={{ fontWeight: '700', marginBottom: 8 }}>Avaliações KidSpot</Text>
        {reviews.map((r) => (
          <Card key={r.id} style={{ marginBottom: 8 }}>
            <Card.Content>
              <Text style={{ fontWeight: '600' }}>{r.comment || 'Sem comentário'}</Text>
              <Text style={{ color: '#666', marginTop: 4 }}>
                Estrutura {r.ratings.structure} • Higiene {r.ratings.hygiene} • Família {r.ratings.familyService} • Segurança {r.ratings.safety} • Valor {r.ratings.value}
              </Text>
            </Card.Content>
          </Card>
        ))}
        {!reviews.length ? <Text>Seja o primeiro a avaliar.</Text> : null}
      </View>
    </ScrollView>
  );
}
