import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_BASE_URL } from "../../constants/api";

export default function Propriedade() {
  const [propriedades, setPropriedades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState<"lista" | "novo" | "editar">("lista");

  const [descricao, setDescricao] = useState("");
  const [endereco, setEndereco] = useState("");
  const [pro_codigo, setPro_codigo] = useState<number | null>(null);

  async function ListarPropriedades() {
    try {
      const token = await AsyncStorage.getItem("token");
      const resp = await fetch(API_BASE_URL + "/fsu-propriedade/ListarTodos", {
        headers: { Authorization: "Bearer " + token },
      });

      if (resp.status === 401) {
        Alert.alert("Sessão Expirada", "Por favor, faça login novamente.");
        await AsyncStorage.removeItem("token");
        router.replace("/auth/login");
        return;
      }

      const data = await resp.json();
      setPropriedades(data);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível carregar propriedades.");
    } finally {
      setLoading(false);
    }
  }

  function AbrirEditarPropriedade(item: any) {
    setPro_codigo(item.pro_codigo);
    setDescricao(item.pro_descricao ?? "");
    setEndereco(item.pro_endereco ?? "");
    setModo("editar");
  }

  function AbrirIncluirPropriedade() {
    LimparPropriedade();
    setModo("novo");
  }

  function LimparPropriedade() {
    setPro_codigo(null);
    setDescricao("");
    setEndereco("");
  }

  function Voltar() {
    router.replace("/");
  }
  
  async function SalvarPropriedade() {
    if (!descricao.trim()) {
      Alert.alert("Atenção", "A descrição é obrigatória!");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      if (modo === "editar") {
        const resp = await fetch(
          API_BASE_URL + `/fsu-propriedade/Alterar/${pro_codigo}`,
          {
            method: "PATCH",
            headers: { 
              "Content-Type": "application/json", 
              Authorization: "Bearer " + token  
            },
            body: JSON.stringify({
              pro_descricao: descricao,
              pro_endereco: endereco || null,
            }),
          }
        );

        if (!resp.ok) {
          Alert.alert("Erro", "Não foi possível alterar a propriedade.");
          return;
        }
      } else {
        const resp = await fetch(API_BASE_URL + "/fsu-propriedade/Salvar", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            Authorization: "Bearer " + token  
          },
          body: JSON.stringify({
            pro_descricao: descricao,
            pro_endereco: endereco || null,
          }),
        });

        if (!resp.ok) {
          Alert.alert("Erro", "Não foi possível salvar a propriedade.");
          return;
        }
      }

      LimparPropriedade();
      setModo("lista");
      ListarPropriedades();
    } catch (e) {
      Alert.alert("Erro", "Não foi possível salvar a propriedade.");
    }
  }

  async function ExcluirPropriedade(id: number) {
    Alert.alert(
      "Confirmar Exclusão",
      "Deseja realmente excluir esta propriedade?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const token = await AsyncStorage.getItem("token");
            try {
              const resp = await fetch(
                API_BASE_URL + `/fsu-propriedade/Excluir/${id}`,
                {
                  method: "DELETE",
                  headers: { Authorization: "Bearer " + token },
                }
              );

              if (!resp.ok) {
                Alert.alert("Erro", "Não foi possível excluir a propriedade.");
              }

              ListarPropriedades();
            } catch (e) {
              Alert.alert("Erro", "Não foi possível excluir a propriedade.");
            }
          }
        }
      ]
    );
  }

  useEffect(() => {
    ListarPropriedades();
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: modo === "lista" ? "🏡 Propriedades" : modo === "editar" ? "✏️ Editar Propriedade" : "➕ Incluir Propriedade",
          headerStyle: { backgroundColor: '#2E7D32' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      {modo === "lista" ? (
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.botaoIncluir} onPress={() => AbrirIncluirPropriedade()} >
            <Text style={styles.txtBtnIncluir}>
              <FontAwesome name="plus" size={16} /> Incluir Propriedade
            </Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={propriedades}
              keyExtractor={(item) => item.pro_codigo.toString()}
              renderItem={({ item }) => (
                <View style={styles.item}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitulo}>
                      ID: {item.pro_codigo}
                    </Text>
                    <Text style={styles.itemSubtitulo}>
                      {item.pro_descricao}
                    </Text>
                    {item.pro_endereco ? (
                      <Text style={styles.itemEndereco}>
                        📍 {item.pro_endereco}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.itemBotoes}>
                    <TouchableOpacity onPress={() => AbrirEditarPropriedade(item)} style={styles.acaoBotao}>
                      <FontAwesome name="edit" size={20} color="#2E7D32" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => ExcluirPropriedade(item.pro_codigo)} style={styles.acaoBotao}>
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
            {modo === "editar" ? "Editar" : "Cadastrar"} Propriedade
          </Text>

          <Text style={styles.label}>Descrição:</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ex: Fazenda Sul Novo" 
            value={descricao} 
            onChangeText={setDescricao} 
          />

          <Text style={styles.label}>Endereço (opcional):</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ex: Rodovia BR-163, Km 45" 
            value={endereco} 
            onChangeText={setEndereco} 
          />

          <TouchableOpacity style={styles.botaoSalvar} onPress={SalvarPropriedade}>
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

  itemTitulo: { fontWeight: "bold", fontSize: 13, color: "#999" },
  itemSubtitulo: { fontSize: 18, fontWeight: "bold", color: "#333", marginTop: 2 },
  itemEndereco: { fontSize: 14, color: "#666", marginTop: 4 },

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
