import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={{ padding: 16, gap: 8 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>Criar conta</Text>
      <TextInput label="Nome" value={name} onChangeText={setName} />
      <TextInput label="Email" value={email} onChangeText={setEmail} />
      <TextInput label="Senha" value={password} onChangeText={setPassword} secureTextEntry />
      <Button mode="contained" onPress={() => register(name, email, password)}>Cadastrar</Button>
    </View>
  );
}
