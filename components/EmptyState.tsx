import React from 'react';
import { View, Text } from 'react-native';

export const EmptyState: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <View style={{ padding: 16, alignItems: 'center' }}>
    <Text style={{ fontSize: 18, fontWeight: '600' }}>{title}</Text>
    {subtitle ? <Text style={{ color: '#666', marginTop: 4, textAlign: 'center' }}>{subtitle}</Text> : null}
  </View>
);
