import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_BASE_URL } from "../../constants/api";

export default function Usuario() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState<"lista" | "novo" | "editar">("lista");

  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [usu_codigo, setUsu_codigo] = useState<number | null>(null);

  async function ListarUsuarios() {
    try {
      const token = await AsyncStorage.getItem("token");
      const resp = await fetch(API_BASE_URL + "/fsu-usuario/ListarTodos", {
        headers: { Authorization: "Bearer " + token },
      });

      if (resp.status === 401) {
        Alert.alert("Sessão Expirada", "Por favor, faça login novamente.");
        await AsyncStorage.removeItem("token");
        router.replace("/auth/login");
        return;
      }

      const data = await resp.json();
      setUsuarios(data);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível carregar usuários.");
    } finally {
      setLoading(false);
    }
  }

  function AbrirEditarUsuario(item: any) {
    setUsu_codigo(item.usu_codigo);
    setLogin(item.usu_login ?? "");
    setSenha("");
    setModo("editar");
  }

  function AbrirIncluirUsuario() {
    LimparUsuario();
    setModo("novo");
  }

  function LimparUsuario() {
    setUsu_codigo(null);
    setLogin("");
    setSenha("");
  }

  function Voltar() {
    router.replace("/");
  }
  
  async function SalvarUsuario() {
    if (!login.trim()) {
      Alert.alert("Atenção", "O login é obrigatório!");
      return;
    }
    if (modo === "novo" && !senha.trim()) {
      Alert.alert("Atenção", "A senha é obrigatória para novos usuários!");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      if (modo === "editar") {
        const resp = await fetch(
          API_BASE_URL + `/fsu-usuario/Alterar/${usu_codigo}`,
          {
            method: "PATCH",
            headers: { 
              "Content-Type": "application/json", 
              Authorization: "Bearer " + token  
            },
            body: JSON.stringify({
              usu_login: login,
              usu_senha: senha || undefined,
            }),
          }
        );

        if (!resp.ok) {
          Alert.alert("Erro", "Não foi possível alterar o usuário.");
          return;
        }
      } else {
        const resp = await fetch(API_BASE_URL + "/fsu-usuario/Salvar", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            Authorization: "Bearer " + token  
          },
          body: JSON.stringify({
            usu_login: login,
            usu_senha: senha,
          }),
        });

        if (!resp.ok) {
          Alert.alert("Erro", "Não foi possível salvar o usuário.");
          return;
        }
      }

      LimparUsuario();
      setModo("lista");
      ListarUsuarios();
    } catch (e) {
      Alert.alert("Erro", "Não foi possível salvar o usuário.");
    }
  }

  async function ExcluirUsuario(id: number) {
    Alert.alert(
      "Confirmar Exclusão",
      "Deseja realmente excluir este usuário?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const token = await AsyncStorage.getItem("token");
            try {
              const resp = await fetch(
                API_BASE_URL + `/fsu-usuario/Excluir/${id}`,
                {
                  method: "DELETE",
                  headers: { Authorization: "Bearer " + token },
                }
              );

              if (!resp.ok) {
                Alert.alert("Erro", "Não foi possível excluir.");
              }

              ListarUsuarios();
            } catch (e) {
              Alert.alert("Erro", "Não foi possível excluir.");
            }
          }
        }
      ]
    );
  }

  useEffect(() => {
    ListarUsuarios();
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: modo === "lista" ? "👥 Usuários" : modo === "editar" ? "✏️ Editar Usuário" : "➕ Incluir Usuário",
          headerStyle: { backgroundColor: '#2E7D32' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      {modo === "lista" ? (
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.botaoIncluir} onPress={() => AbrirIncluirUsuario()} >
            <Text style={styles.txtBtnIncluir}>
              <FontAwesome name="plus" size={16} /> Incluir Usuário
            </Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={usuarios}
              keyExtractor={(item) => item.usu_codigo.toString()}
              renderItem={({ item }) => (
                <View style={styles.item}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitulo}>
                      ID: {item.usu_codigo}
                    </Text>
                    <Text style={styles.itemSubtitulo}>
                      Login: {item.usu_login}
                    </Text>
                  </View>

                  <View style={styles.itemBotoes}>
                    <TouchableOpacity onPress={() => AbrirEditarUsuario(item)} style={styles.acaoBotao}>
                      <FontAwesome name="edit" size={20} color="#2E7D32" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => ExcluirUsuario(item.usu_codigo)} style={styles.acaoBotao}>
                      <FontAwesome name="trash" size={20} color="#D32F2F" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}

          <TouchableOpacity style={styles.botaoVoltar} onPress={Voltar}>
            <Text style={styles.txtBtn}>Voltar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text style={styles.formTitulo}>
            {modo === "editar" ? "Editar" : "Cadastrar"} Usuário
          </Text>

          <Text style={styles.label}>Login:</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Digite o login" 
            value={login} 
            onChangeText={setLogin} 
            autoCapitalize="none"
          />

          <Text style={styles.label}>Senha:</Text>
          <TextInput 
            style={styles.input} 
            placeholder={modo === "editar" ? "Deixe em branco para manter a mesma" : "Digite a senha"} 
            secureTextEntry 
            value={senha} 
            onChangeText={setSenha} 
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.botaoSalvar} onPress={SalvarUsuario}>
            <Text style={styles.txtBtn}>Salvar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoVoltarForm}
            onPress={() => setModo("lista")}
          >
            <Text style={styles.txtBtn}>Voltar para Lista</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F0F4F0" },

  botaoIncluir: {
    backgroundColor: "#2E7D32",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },

  txtBtnIncluir: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  item: {
    backgroundColor: "#FFF",
    padding: 16,
    marginBottom: 10,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },

  itemTitulo: { fontWeight: "bold", fontSize: 14, color: "#666" },
  itemSubtitulo: { fontSize: 18, fontWeight: "bold", color: "#333", marginTop: 2 },

  itemBotoes: { flexDirection: "row", gap: 15 },
  acaoBotao: { padding: 8 },

  formTitulo: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#2E7D32"
  },

  label: {
    fontWeight: "bold",
    marginBottom: 6,
    color: "#333",
    fontSize: 15
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#FFF",
    fontSize: 16
  },

  botaoSalvar: {
    backgroundColor: "#2E7D32",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
  },

  botaoVoltar: {
    backgroundColor: "#757575",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  botaoVoltarForm: {
    backgroundColor: "#757575",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },

  txtBtn: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
