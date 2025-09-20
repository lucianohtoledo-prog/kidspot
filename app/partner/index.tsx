import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, Text, TextInput, SegmentedButtons } from 'react-native-paper';
import demoPlaces from '../../data/demo/locals.json';

export default function PartnerDashboard() {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('restaurant');

  return (
    <ScrollView style={{ padding: 12 }}>
      <Text style={{ fontWeight: '700', marginBottom: 8 }}>Cadastro de Local (DEMO)</Text>
      <TextInput label="Nome" value={name} onChangeText={setName} style={{ marginBottom: 8 }} />
      <TextInput label="Descrição" value={desc} onChangeText={setDesc} style={{ marginBottom: 8 }} multiline />
      <SegmentedButtons
        value={category} onValueChange={setCategory}
        buttons={[
          { value: 'restaurant', label: 'Restaurante' },
          { value: 'park', label: 'Parque' },
          { value: 'mall', label: 'Shopping' },
          { value: 'playroom', label: 'Brinquedoteca' },
        ]}
      />
      <Button mode="contained" style={{ marginTop: 8 }} onPress={() => alert('No demo, os dados não são persistidos. Integre ao Firebase para salvar.')}>
        Salvar
      </Button>

      <View style={{ marginTop: 24 }}>
        <Text style={{ fontWeight: '700', marginBottom: 8 }}>Meus Locais (DEMO)</Text>
        {demoPlaces.map(p => (
          <Card key={p.id} style={{ marginBottom: 8 }}>
            <Card.Title title={p.name} subtitle={p.categories.join(', ')} />
            <Card.Content><Text>{p.description}</Text></Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}
