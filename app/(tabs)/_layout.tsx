import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Appbar } from 'react-native-paper';
import { View } from 'react-native';

export default function TabsLayout() {
  const { user } = useAuth();
  return (
    <Tabs screenOptions={{ header: (props) => <Header {...props} /> }}>
      <Tabs.Screen name="index" options={{ title: 'KidSpot' }} />
      <Tabs.Screen name="events" options={{ title: 'Eventos' }} />
      <Tabs.Screen name="favorites" options={{ title: 'Favoritos' }} />
    </Tabs>
  );
}

function Header({ navigation, options }: any) {
  return (
    <Appbar.Header>
      <Appbar.Content title={options.title || 'KidSpot'} />
    </Appbar.Header>
  );
}
