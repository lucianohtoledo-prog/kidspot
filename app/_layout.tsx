import React from 'react';
import { Tabs } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from '../context/AuthContext';
import { FiltersProvider } from '../context/FiltersContext';
import { PlacesProvider } from '../context/PlacesContext';

export default function RootLayout() {
  return (
    <PaperProvider>
      <AuthProvider>
        <FiltersProvider>
          <PlacesProvider defaultCenter={{ lat: -23.55052, lng: -46.633308 }}>
            <Tabs screenOptions={{ headerShown: false }}>
              <Tabs.Screen name="(tabs)" options={{ href: null }} />
              <Tabs.Screen name="local/[id]" options={{ href: null }} />
              <Tabs.Screen name="auth/login" options={{ href: null }} />
              <Tabs.Screen name="auth/register" options={{ href: null }} />
              <Tabs.Screen name="partner/index" options={{ href: null }} />
              <Tabs.Screen name="admin/index" options={{ href: null }} />
              <Tabs.Screen name="settings" options={{ href: null }} />
            </Tabs>
          </PlacesProvider>
        </FiltersProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
