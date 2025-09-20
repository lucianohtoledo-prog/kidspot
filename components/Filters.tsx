import React from 'react';
import { View } from 'react-native';
import { Chip, SegmentedButtons } from 'react-native-paper';
import { useFilters } from '../context/FiltersContext';

export const FiltersPanel: React.FC = () => {
  const { filters, setAge, setEnvironment, setOpenNow, toggleAmenity, setCategory } = useFilters();
  return (
    <View style={{ paddingVertical: 8, gap: 8 }}>
      <SegmentedButtons
        value={filters.childrenAge}
        onValueChange={(v: any) => setAge(v)}
        buttons={[
          { value: 'all', label: 'Todas idades' },
          { value: '0-5', label: '0–5' },
          { value: '5+', label: '5+' },
        ]}
      />
      <SegmentedButtons
        value={filters.environment}
        onValueChange={(v: any) => setEnvironment(v)}
        buttons={[
          { value: 'any', label: 'Qualquer' },
          { value: 'indoor', label: 'Fechado' },
          { value: 'outdoor', label: 'Aberto' },
          { value: 'mixed', label: 'Misto' },
        ]}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {['playroom','playground','monitors','changing_table','accessibility','fenced_area','parking','pet_friendly','kids_menu'].map((a) => (
          <Chip key={a} selected onPress={() => toggleAmenity(a as any)}>
            {a.replace('_',' ')}
          </Chip>
        ))}
      </View>
    </View>
  );
};
