import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_BASE_URL } from "../../constants/api";

export default function Talhao() {
  const [talhoes, setTalhoes] = useState<any[]>([]);
  const [propriedades, setPropriedades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState<"lista" | "novo" | "editar">("lista");

  const [tal_codigo, setTal_codigo] = useState<number | null>(null);
  const [pro_codigo, setPro_codigo] = useState<number | null>(null);
  const [pro_descricao, setPro_descricao] = useState("Selecione uma Propriedade");
  const [descricao, setDescricao] = useState("");
  const [area, setArea] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [modalVisible, setModalVisible] = useState(false);

  async function ListarTalhoes() {
    try {
      const token = await AsyncStorage.getItem("token");
      const resp = await fetch(API_BASE_URL + "/fsu-talhao/ListarTodos", {
        headers: { Authorization: "Bearer " + token },
      });

      if (resp.status === 401) {
        Alert.alert("Sessão Expirada", "Por favor, faça login novamente.");
        await AsyncStorage.removeItem("token");
        router.replace("/auth/login");
        return;
      }

      const data = await resp.json();
      setTalhoes(data);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível carregar talhões.");
    } finally {
      setLoading(false);
    }
  }

  async function ListarPropriedades() {
    try {
      const token = await AsyncStorage.getItem("token");
      const resp = await fetch(API_BASE_URL + "/fsu-propriedade/ListarTodos", {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await resp.json();
      setPropriedades(data);
    } catch (e) {
      console.error("Erro ao carregar propriedades:", e);
    }
  }

  function SelecionarPropriedade(prop: any) {
    setPro_codigo(prop.pro_codigo);
    setPro_descricao(prop.pro_descricao);
    setModalVisible(false);
  }

  function AbrirEditarTalhao(item: any) {
    setTal_codigo(item.tal_codigo);
    setPro_codigo(item.pro_codigo);
    setPro_descricao(item.propriedade?.pro_descricao || `ID: ${item.pro_codigo}`);
    setDescricao(item.tal_descricao ?? "");
    setArea(item.tal_area_hectares != null ? String(item.tal_area_hectares) : "");
    setLatitude(item.tal_latitude != null ? String(item.tal_latitude) : "");
    setLongitude(item.tal_longitude != null ? String(item.tal_longitude) : "");
    setModo("editar");
  }

  function AbrirIncluirTalhao() {
    LimparTalhao();
    setModo("novo");
  }

  function LimparTalhao() {
    setTal_codigo(null);
    setPro_codigo(null);
    setPro_descricao("Selecione uma Propriedade");
    setDescricao("");
    setArea("");
    setLatitude("");
    setLongitude("");
  }

  function Voltar() {
    router.replace("/");
  }
  
  async function SalvarTalhao() {
    if (!pro_codigo) {
      Alert.alert("Atenção", "Selecione uma propriedade!");
      return;
    }
    if (!descricao.trim()) {
      Alert.alert("Atenção", "A descrição do talhão é obrigatória!");
      return;
    }
    if (!area.trim() || isNaN(parseFloat(area))) {
      Alert.alert("Atenção", "A área em hectares deve ser um número válido!");
      return;
    }

    const payload = {
      pro_codigo: Number(pro_codigo),
      tal_descricao: descricao,
      tal_area_hectares: parseFloat(area),
      tal_latitude: latitude.trim() ? parseFloat(latitude) : null,
      tal_longitude: longitude.trim() ? parseFloat(longitude) : null,
    };

    try {
      const token = await AsyncStorage.getItem("token");
      if (modo === "editar") {
        const resp = await fetch(
          API_BASE_URL + `/fsu-talhao/Alterar/${tal_codigo}`,
          {
            method: "PATCH",
            headers: { 
              "Content-Type": "application/json", 
              Authorization: "Bearer " + token  
            },
            body: JSON.stringify(payload),
          }
        );

        if (!resp.ok) {
          Alert.alert("Erro", "Não foi possível alterar o talhão.");
          return;
        }
      } else {
        const resp = await fetch(API_BASE_URL + "/fsu-talhao/Salvar", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            Authorization: "Bearer " + token  
          },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          Alert.alert("Erro", "Não foi possível salvar o talhão.");
          return;
        }
      }

      LimparTalhao();
      setModo("lista");
      ListarTalhoes();
    } catch (e) {
      Alert.alert("Erro", "Não foi possível salvar o talhão.");
    }
  }

  async function ExcluirTalhao(id: number) {
    Alert.alert(
      "Confirmar Exclusão",
      "Deseja realmente excluir este talhão?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const token = await AsyncStorage.getItem("token");
            try {
              const resp = await fetch(
                API_BASE_URL + `/fsu-talhao/Excluir/${id}`,
                {
                  method: "DELETE",
                  headers: { Authorization: "Bearer " + token },
                }
              );

              if (!resp.ok) {
                Alert.alert("Erro", "Não foi possível excluir o talhão.");
              }

              ListarTalhoes();
            } catch (e) {
              Alert.alert("Erro", "Não foi possível excluir.");
            }
          }
        }
      ]
    );
  }

  useEffect(() => {
    ListarTalhoes();
    ListarPropriedades();
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: modo === "lista" ? "🌾 Talões" : modo === "editar" ? "✏️ Editar Talhão" : "➕ Incluir Talhão",
          headerStyle: { backgroundColor: '#2E7D32' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      {modo === "lista" ? (
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.botaoIncluir} onPress={() => AbrirIncluirTalhao()} >
            <Text style={styles.txtBtnIncluir}>
              <FontAwesome name="plus" size={16} /> Incluir Talhão
            </Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={talhoes}
              keyExtractor={(item) => item.tal_codigo.toString()}
              renderItem={({ item }) => (
                <View style={styles.item}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitulo}>
                      ID: {item.tal_codigo} • Propriedade: {item.propriedade?.pro_descricao || `ID: ${item.pro_codigo}`}
                    </Text>
                    <Text style={styles.itemSubtitulo}>
                      {item.tal_descricao}
                    </Text>
                    <Text style={styles.itemMeta}>
                      🌾 {item.tal_area_hectares} ha
                      {item.tal_latitude && item.tal_longitude ? ` • 📍 Lat: ${item.tal_latitude}, Lon: ${item.tal_longitude}` : ""}
                    </Text>
                  </View>

                  <View style={styles.itemBotoes}>
                    <TouchableOpacity onPress={() => AbrirEditarTalhao(item)} style={styles.acaoBotao}>
                      <FontAwesome name="edit" size={20} color="#2E7D32" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => ExcluirTalhao(item.tal_codigo)} style={styles.acaoBotao}>
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
            {modo === "editar" ? "Editar" : "Cadastrar"} Talhão
          </Text>

          <Text style={styles.label}>Propriedade Vinculada:</Text>
          <TouchableOpacity style={styles.selector} onPress={() => setModalVisible(true)}>
            <Text style={pro_codigo ? styles.selectorTextSelected : styles.selectorTextPlaceholder}>
              {pro_descricao}
            </Text>
            <FontAwesome name="caret-down" size={18} color="#666" />
          </TouchableOpacity>

          <Text style={styles.label}>Descrição do Talhão:</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ex: Talhão Sul Soja" 
            value={descricao} 
            onChangeText={setDescricao} 
          />

          <Text style={styles.label}>Área (Hectares):</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ex: 45.8" 
            keyboardType="numeric"
            value={area} 
            onChangeText={setArea} 
          />

          <View style={styles.rowInput}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Latitude (opcional):</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Ex: -23.456" 
                keyboardType="numeric"
                value={latitude} 
                onChangeText={setLatitude} 
              />
            </View>
            <View style={{ width: 15 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Longitude (opcional):</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Ex: -51.789" 
                keyboardType="numeric"
                value={longitude} 
                onChangeText={setLongitude} 
              />
            </View>
          </View>

          <TouchableOpacity style={styles.botaoSalvar} onPress={SalvarTalhao}>
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

      {/* MODAL DE SELEÇÃO DE PROPRIEDADE */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Selecione uma Propriedade</Text>
            <FlatList
              data={propriedades}
              keyExtractor={(item) => item.pro_codigo.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalItem} 
                  onPress={() => SelecionarPropriedade(item)}
                >
                  <Text style={styles.modalItemText}>{item.pro_descricao}</Text>
                  {item.pro_endereco ? <Text style={styles.modalItemSub}>{item.pro_endereco}</Text> : null}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
            />
            <TouchableOpacity 
              style={styles.modalFecharBtn} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalFecharText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  itemTitulo: { fontWeight: "bold", fontSize: 12, color: "#888" },
  itemSubtitulo: { fontSize: 18, fontWeight: "bold", color: "#333", marginTop: 2 },
  itemMeta: { fontSize: 13, color: "#666", marginTop: 4 },

  itemBotoes: { flexDirection: "row", gap: 15 },
  acaoBotao: { padding: 8 },

  formTitulo: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#2E7D32"
  },

  label: {
    fontWeight: "bold",
    marginBottom: 6,
    color: "#333",
    fontSize: 14
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 11,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#FFF",
    fontSize: 16
  },

  selector: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#FFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectorTextPlaceholder: { color: "#999", fontSize: 16 },
  selectorTextSelected: { color: "#333", fontSize: 16, fontWeight: "600" },

  rowInput: { flexDirection: "row" },

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

  /* ESTILOS DO MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 15,
    textAlign: "center",
  },
  modalItem: {
    paddingVertical: 15,
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  modalItemSub: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },
  modalSeparator: {
    height: 1,
    backgroundColor: "#EEE",
  },
  modalFecharBtn: {
    backgroundColor: "#757575",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  modalFecharText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
