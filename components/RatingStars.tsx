import React from 'react';
import { View, Text } from 'react-native';

export const RatingStars: React.FC<{ value?: number }> = ({ value }) => {
  const v = Math.round((value || 0) * 2) / 2;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ fontWeight: '600' }}>{v || '-'}</Text>
      <Text style={{ marginLeft: 4, color: '#666' }}>★</Text>
    </View>
  );
};
