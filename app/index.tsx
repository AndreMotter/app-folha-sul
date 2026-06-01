import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { copyImageToPermanent } from '../src/services/database';

export default function Index() {
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace("/auth/login");
      } else {
        setCheckingAuth(false);
      }
    }
    checkAuth();
  }, []);

  const pickImage = async () => {
    console.log("clicou na galeria");
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const permanentUri = await copyImageToPermanent(result.assets[0].uri);
      router.push({
        pathname: '/results',
        params: { imageUri: permanentUri },
      });
    }
  };

  async function handleSair() {
    Alert.alert(
      "Sair",
      "Deseja realmente sair da sua conta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem("token");
            router.replace("/auth/login");
          }
        }
      ]
    );
  }

  if (checkingAuth) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: '🌱 FolhaSul',
          headerStyle: { backgroundColor: '#2E7D32' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold', fontSize: 22 },
          headerShadowVisible: false,
        }} 
      />

      <View style={styles.header}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Análise de Safra</Text>
          <Text style={styles.cardText}>
            Identifique doenças em soja, milho e trigo usando IA.
          </Text>
        </View>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity 
          style={styles.mainButton} 
          onPress={() => router.push('/camera')}
        >
          <Text style={styles.buttonEmoji}>📸</Text>
          <Text style={styles.mainButtonText}>Nova Análise</Text>
          <Text style={styles.buttonSubText}>Usar câmera em tempo real</Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
            <Text style={styles.secondaryButtonText}>🖼️ Galeria</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/results')}>
            <Text style={styles.secondaryButtonText}>📊 Histórico</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Gerenciamento </Text>

        <View style={styles.row}>
          <TouchableOpacity 
            style={styles.crudButton} 
            onPress={() => router.push('/usuario/fsu_usuario')}
          >
            <Text style={styles.crudButtonEmoji}>👥</Text>
            <Text style={styles.crudButtonText}>Usuários</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.crudButton} 
            onPress={() => router.push('/propriedade/fsu_propriedade')}
          >
            <Text style={styles.crudButtonEmoji}>🏡</Text>
            <Text style={styles.crudButtonText}>Propriedades</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity 
            style={styles.crudButton} 
            onPress={() => router.push('/talhao/fsu_talhao')}
          >
            <Text style={styles.crudButtonEmoji}>🌾</Text>
            <Text style={styles.crudButtonText}>Talhões</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.crudButton} 
            onPress={() => router.push('/safra/fsu_safra')}
          >
            <Text style={styles.crudButtonEmoji}>📅</Text>
            <Text style={styles.crudButtonText}>Safras</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.fullCrudButton} 
          onPress={() => router.push('/analise_tecnica/fsu_analise_tecnica')}
        >
          <Text style={styles.crudButtonEmoji}>📋</Text>
          <Text style={styles.crudButtonText}>Análises Técnicas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sairButton} onPress={handleSair}>
          <Text style={styles.sairButtonText}>🚪 Sair da Conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F0', padding: 20 },
  header: { marginBottom: 25 },
  card: { 
    backgroundColor: '#FFF', 
    padding: 20, 
    borderRadius: 20, 
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  cardText: { fontSize: 14, color: '#666', marginTop: 5, lineHeight: 20 },
  menu: { gap: 15 },
  mainButton: { 
    backgroundColor: '#2E7D32', 
    padding: 25, 
    borderRadius: 20, 
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8
  },
  buttonEmoji: { fontSize: 32, marginBottom: 5 },
  mainButtonText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  buttonSubText: { color: '#A5D6A7', fontSize: 12 },
  row: { flexDirection: 'row', gap: 15 },
  secondaryButton: { 
    flex: 1, 
    backgroundColor: '#FFF', 
    padding: 15, 
    borderRadius: 15, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  secondaryButtonText: { color: '#333', fontWeight: '600', fontSize: 16 },
  divider: { height: 1, backgroundColor: '#DDD', marginVertical: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#555', marginBottom: 5 },
  crudButton: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  fullCrudButton: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 5,
  },
  crudButtonEmoji: { fontSize: 18 },
  crudButtonText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 16 },
  sairButton: {
    backgroundColor: '#E53935',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  sairButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});