import React from 'react';
import { Tabs } from 'expo-router';
import { Appbar } from 'react-native-paper';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        header: (props) => <Header {...props} />,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'KidSpot' }} />
      <Tabs.Screen name="events" options={{ title: 'Eventos', href: null }} />
      <Tabs.Screen name="favorites" options={{ title: 'Favoritos', href: null }} />
    </Tabs>
  );
}

function Header({ options }: any) {
  return (
    <Appbar.Header>
      <Appbar.Content title={options.title || 'KidSpot'} />
    </Appbar.Header>
  );
}
