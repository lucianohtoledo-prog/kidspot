import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const { login, setRole } = useAuth();
  const [email, setEmail] = useState('demo@kidspot.app');
  const [password, setPassword] = useState('demo123');

  return (
    <View style={{ padding: 16, gap: 8 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>Login</Text>
      <TextInput label="Email" value={email} onChangeText={setEmail} />
      <TextInput label="Senha" value={password} onChangeText={setPassword} secureTextEntry />
      <Button mode="contained" onPress={() => login(email, password)}>Entrar</Button>

      <Text style={{ marginTop: 16, fontWeight: '700' }}>Modo demo: trocar de perfil</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button onPress={() => setRole('user')}>User</Button>
        <Button onPress={() => setRole('partner')}>Partner</Button>
        <Button onPress={() => setRole('admin')}>Admin</Button>
      </View>
    </View>
  );
}
