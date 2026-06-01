import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, Stack } from 'expo-router';
import React, { useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { copyImageToPermanent } from '../src/services/database';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: '🌱 FolhaSul', headerStyle: { backgroundColor: '#2E7D32' }, headerTintColor: '#fff' }} />
        <Text style={styles.message}>Precisamos de permissão para acessar a câmera</Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permButtonText}>Conceder Permissão</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function takePicture() {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      const permanentUri = await copyImageToPermanent(photo.uri);
      router.push({
        pathname: '/results',
        params: { imageUri: permanentUri }
      });
    }
  }

  return (
    <View style={styles.container}>
      {/* Esconde o cabeçalho para tela cheia */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Câmera agora fecha em si mesma (não tem filhos) */}
      <CameraView style={styles.camera} ref={cameraRef} />

      {/* Overlay flutuando por cima da câmera */}
      <View style={styles.overlay}>
        {/* Guia visual para o usuário enquadrar a folha */}
        <View style={styles.guideBox} />
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={{color: '#FFF'}}>Voltar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureInternal} />
          </TouchableOpacity>
          
          <View style={{width: 60}} /> 
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  message: { textAlign: 'center', color: '#FFF', paddingBottom: 10, marginTop: 50 },
  overlay: { 
    position: 'absolute', // Faz o overlay flutuar
    top: 0, bottom: 0, left: 0, right: 0, // Estica pela tela toda
    backgroundColor: 'transparent', 
    justifyContent: 'space-between', 
    padding: 40,
    paddingTop: 80, // Dá um espaço para não encostar no topo da tela do celular
  },
  guideBox: { 
    width: '100%', height: '60%', 
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', 
    borderRadius: 20, borderStyle: 'dashed' 
  },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  captureButton: { 
    width: 80, height: 80, borderRadius: 40, 
    backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' 
  },
  captureInternal: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF' },
  backButton: { width: 60 },
  permButton: { backgroundColor: '#2E7D32', padding: 15, borderRadius: 10, alignSelf: 'center' },
  permButtonText: { color: '#FFF', fontWeight: 'bold' }
});