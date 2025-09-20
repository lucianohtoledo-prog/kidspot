import React from 'react';
import { Card, Chip } from 'react-native-paper';
import { View, Text } from 'react-native';
import type { EventItem } from '../types/models';

export const EventCard: React.FC<{ ev: EventItem, placeName?: string }> = ({ ev, placeName }) => {
  return (
    <Card style={{ marginBottom: 12 }}>
      <Card.Title title={ev.title} subtitle={placeName || ''} />
      <Card.Content>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Chip compact>{ev.date}{ev.time ? ' ' + ev.time : ''}</Chip>
          {ev.category ? <Chip compact>{ev.category}</Chip> : null}
          {ev.price ? <Chip compact>{ev.price}</Chip> : null}
        </View>
        {ev.description ? <Text style={{ marginTop: 8 }}>{ev.description}</Text> : null}
      </Card.Content>
    </Card>
  );
};
