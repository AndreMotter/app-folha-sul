import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_BASE_URL } from "../../constants/api";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");

  async function handleEntrar() {
    if (!usuario || !senha) {
      Alert.alert("Atenção", "Informe login e senha.");
      return;
    }

    try {
      const resp = await fetch(API_BASE_URL + "/fsu-usuario/Login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: usuario,
          senha: senha,
        }),
      });

      if (!resp.ok) {
        Alert.alert("Erro", "Usuário ou senha inválidos.");
        return;
      }

      const data = await resp.json();
      await AsyncStorage.setItem("token", data.access_token);
      router.replace("/");
    } catch (e) {
      Alert.alert("Erro", "Falha ao conectar com o servidor.");
    }
  }

  return (
    <View style={styles.container}>    
      <Image source={require("../../assets/images/icon.png")} style={styles.logo} /> 
      <Text style={styles.title}>🌱 FolhaSul</Text>
      
      <Text style={styles.label}>Login:</Text>
      <TextInput
        style={styles.input}
        placeholder="Digite seu login"
        value={usuario}
        onChangeText={setUsuario}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Senha:</Text>
      <TextInput
        style={styles.input}
        placeholder="Digite sua senha"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.button} onPress={handleEntrar}>
        <Text style={styles.buttonText}>
          <FontAwesome name="sign-in" size={18} color="#fff" /> Entrar
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F4F0",
    paddingHorizontal: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 30,
  },
  label: {
    fontWeight: "bold",
    alignSelf: "flex-start",
    marginLeft: "10%",
    marginBottom: 4,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: "80%",
    marginBottom: 12,
    backgroundColor: "#FFF",
  },
  button: {
    backgroundColor: "#2E7D32",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    width: "80%",
    marginTop: 15,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    fontWeight: "bold",
    color: "#fff",
    fontSize: 16,
  },
});
