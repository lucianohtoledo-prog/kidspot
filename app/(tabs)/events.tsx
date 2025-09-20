import React from 'react';
import { ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { EventCard } from '../../components/EventCard';
import demoEvents from '../../data/demo/events.json';
import demoPlaces from '../../data/demo/locals.json';

export default function EventsScreen() {
  return (
    <ScrollView style={{ padding: 12 }}>
      {demoEvents.map((ev) => {
        const p = demoPlaces.find((x) => x.id === ev.placeId);
        return <EventCard key={ev.id} ev={ev as any} placeName={p?.name} />;
      })}
    </ScrollView>
  );
}
