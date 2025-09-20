import React from 'react';
import { View } from 'react-native';
import { Chip } from 'react-native-paper';
import type { Amenity } from '../types/models';

const LABELS: Record<Amenity, string> = {
  playroom: 'Brinquedoteca',
  playground: 'Parquinho',
  monitors: 'Monitores',
  changing_table: 'Fraldário',
  accessibility: 'Acessibilidade',
  fenced_area: 'Área cercada',
  parking: 'Estacionamento',
  pet_friendly: 'Pet-friendly',
  kids_menu: 'Menu kids',
  outdoor: 'Aberto',
  indoor: 'Fechado',
  mixed: 'Misto',
};

export const AmenityChips: React.FC<{ items: Amenity[] }> = ({ items }) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
    {items.map((a) => (
      <Chip key={a} compact>{LABELS[a]}</Chip>
    ))}
  </View>
);
