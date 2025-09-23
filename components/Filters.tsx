import React, { useState } from 'react';
import { View } from 'react-native';
import { Chip, Divider, IconButton, Menu, SegmentedButtons, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useFilters } from '../context/FiltersContext';

const AGE_BUTTONS = [
  { value: '0-5', label: '0-5' },
  { value: '5+', label: '5+' },
];

const ENVIRONMENT_OPTIONS = [
  { value: 'any', label: 'Qualquer' },
  { value: 'indoor', label: 'Fechado' },
  { value: 'outdoor', label: 'Aberto' },
  { value: 'mixed', label: 'Misto' },
];

const AMENITY_OPTIONS = [
  { value: 'playroom', label: 'Playroom' },
  { value: 'playground', label: 'Playground' },
  { value: 'monitors', label: 'Monitores' },
  { value: 'changing_table', label: 'Trocador' },
  { value: 'accessibility', label: 'Acessibilidade' },
  { value: 'fenced_area', label: 'Area cercada' },
  { value: 'parking', label: 'Estacionamento' },
  { value: 'pet_friendly', label: 'Pet friendly' },
  { value: 'kids_menu', label: 'Cardapio kids' },
];

export const FiltersPanel: React.FC = () => {
  const router = useRouter();
  const { filters, setAge, setEnvironment, toggleAmenity } = useFilters();
  const [menuVisible, setMenuVisible] = useState(false);

  const selectedAmenities = filters.amenities ?? [];
  const ageButtons = AGE_BUTTONS.map((item) => ({ ...item, style: { flex: 1 } }));
  const environmentButtons = ENVIRONMENT_OPTIONS.map((item) => ({ ...item, style: { flex: 1 } }));

  const handleNavigate = (path: string) => {
    setMenuVisible(false);
    router.push(path);
  };

  return (
    <View style={{ paddingVertical: 8, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <SegmentedButtons
            value={filters.childrenAge}
            onValueChange={(value: string) => setAge(value as any)}
            buttons={ageButtons}
          />
        </View>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-horizontal"
              accessibilityLabel="Abrir mais opcoes"
              onPress={() => setMenuVisible(true)}
            />
          }
          contentStyle={{ paddingHorizontal: 0, paddingVertical: 0, minWidth: 280 }}
        >
          <Menu.Item
            title="Favoritos"
            leadingIcon="heart"
            onPress={() => handleNavigate('/favorites')}
          />
          <Menu.Item
            title="Eventos"
            leadingIcon="calendar"
            onPress={() => handleNavigate('/events')}
          />
          <Divider />
          <View style={{ paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
            <Text variant="labelLarge">Ambiente</Text>
            <SegmentedButtons
              value={filters.environment}
              onValueChange={(value: string) => setEnvironment(value as any)}
              buttons={environmentButtons}
            />
            <Text variant="labelLarge">Amenities</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {AMENITY_OPTIONS.map((option) => {
                const selected = selectedAmenities.includes(option.value as any);
                return (
                  <Chip
                    key={option.value}
                    selected={selected}
                    compact
                    onPress={() => toggleAmenity(option.value as any)}
                  >
                    {option.label}
                  </Chip>
                );
              })}
            </View>
          </View>
        </Menu>
      </View>
    </View>
  );
};
