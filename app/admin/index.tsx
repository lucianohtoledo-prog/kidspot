import React from 'react';
import { ScrollView } from 'react-native';
import { Card, Button, Text } from 'react-native-paper';
import demoPlaces from '../../data/demo/locals.json';
import demoEvents from '../../data/demo/events.json';

export default function AdminDashboard() {
  return (
    <ScrollView style={{ padding: 12 }}>
      <Text style={{ fontWeight: '700', marginBottom: 8 }}>Pendentes (DEMO)</Text>
      {demoPlaces.filter(p => p.status !== 'approved').map(p => (
        <Card key={p.id} style={{ marginBottom: 8 }}>
          <Card.Title title={p.name} />
          <Card.Actions>
            <Button onPress={() => alert('Aprovar (somente com backend)')}>Aprovar</Button>
            <Button onPress={() => alert('Rejeitar (somente com backend)')}>Rejeitar</Button>
            <Button onPress={() => alert('Impulsionar por 30 dias (somente com backend)')}>Impulsionar 30d</Button>
          </Card.Actions>
        </Card>
      ))}
      <Text style={{ fontWeight: '700', marginVertical: 8 }}>Eventos</Text>
      {demoEvents.filter(e => e.status !== 'approved').map(e => (
        <Card key={e.id} style={{ marginBottom: 8 }}>
          <Card.Title title={e.title} />
          <Card.Actions>
            <Button onPress={() => alert('Aprovar (somente com backend)')}>Aprovar</Button>
            <Button onPress={() => alert('Rejeitar (somente com backend)')}>Rejeitar</Button>
          </Card.Actions>
        </Card>
      ))}
    </ScrollView>
  );
}
