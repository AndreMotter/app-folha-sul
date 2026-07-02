import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_BASE_URL } from "../../constants/api";

export default function Parcela() {
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [talhoes, setTalhoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState<"lista" | "novo" | "editar">("lista");

  const [par_codigo, setPar_codigo] = useState<number | null>(null);
  const [tal_codigo, setTal_codigo] = useState<number | null>(null);
  const [tal_descricao, setTal_descricao] = useState("Selecione um Talhão");
  const [descricao, setDescricao] = useState("");
  const [area, setArea] = useState("");

  const [modalVisible, setModalVisible] = useState(false);

  async function ListarParcelas() {
    try {
      const token = await AsyncStorage.getItem("token");
      const resp = await fetch(API_BASE_URL + "/fsu-parcela/ListarTodos", {
        headers: { Authorization: "Bearer " + token },
      });

      if (resp.status === 401) {
        Alert.alert("Sessão Expirada", "Por favor, faça login novamente.");
        await AsyncStorage.removeItem("token");
        router.replace("/auth/login");
        return;
      }

      const data = await resp.json();
      setParcelas(data);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível carregar parcelas.");
    } finally {
      setLoading(false);
    }
  }

  async function ListarTalhoes() {
    try {
      const token = await AsyncStorage.getItem("token");
      const resp = await fetch(API_BASE_URL + "/fsu-talhao/ListarTodos", {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await resp.json();
      setTalhoes(data);
    } catch (e) {
      console.error("Erro ao carregar talhões:", e);
    }
  }

  function SelecionarTalhao(talhao: any) {
    setTal_codigo(talhao.tal_codigo);
    setTal_descricao(talhao.tal_descricao);
    setModalVisible(false);
  }

  function AbrirEditarParcela(item: any) {
    setPar_codigo(item.par_codigo);
    setTal_codigo(item.tal_codigo);
    setTal_descricao(item.talhao?.tal_descricao || `ID: ${item.tal_codigo}`);
    setDescricao(item.par_descricao ?? "");
    setArea(item.par_area_hectares != null ? String(item.par_area_hectares) : "");
    setModo("editar");
  }

  function AbrirIncluirParcela() {
    LimparParcela();
    setModo("novo");
  }

  function LimparParcela() {
    setPar_codigo(null);
    setTal_codigo(null);
    setTal_descricao("Selecione um Talhão");
    setDescricao("");
    setArea("");
  }

  function Voltar() {
    router.replace("/");
  }

  async function SalvarParcela() {
    if (!tal_codigo) {
      Alert.alert("Atenção", "Selecione um talhão!");
      return;
    }
    if (!descricao.trim()) {
      Alert.alert("Atenção", "A descrição da parcela é obrigatória!");
      return;
    }
    if (!area.trim() || isNaN(parseFloat(area))) {
      Alert.alert("Atenção", "A área em hectares deve ser um número válido!");
      return;
    }

    const payload = {
      tal_codigo: Number(tal_codigo),
      par_descricao: descricao,
      par_area_hectares: parseFloat(area),
    };

    try {
      const token = await AsyncStorage.getItem("token");
      if (modo === "editar") {
        const resp = await fetch(
          API_BASE_URL + `/fsu-parcela/Alterar/${par_codigo}`,
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
          Alert.alert("Erro", "Não foi possível alterar a parcela.");
          return;
        }
      } else {
        const resp = await fetch(API_BASE_URL + "/fsu-parcela/Salvar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
          },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          Alert.alert("Erro", "Não foi possível salvar a parcela.");
          return;
        }
      }

      LimparParcela();
      setModo("lista");
      ListarParcelas();
    } catch (e) {
      Alert.alert("Erro", "Não foi possível salvar a parcela.");
    }
  }

  async function ExcluirParcela(id: number) {
    Alert.alert(
      "Confirmar Exclusão",
      "Deseja realmente excluir esta parcela?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const token = await AsyncStorage.getItem("token");
            try {
              const resp = await fetch(
                API_BASE_URL + `/fsu-parcela/Excluir/${id}`,
                {
                  method: "DELETE",
                  headers: { Authorization: "Bearer " + token },
                }
              );

              if (!resp.ok) {
                Alert.alert("Erro", "Não foi possível excluir a parcela.");
              }

              ListarParcelas();
            } catch (e) {
              Alert.alert("Erro", "Não foi possível excluir.");
            }
          }
        }
      ]
    );
  }

  useEffect(() => {
    ListarParcelas();
    ListarTalhoes();
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: modo === "lista" ? "🌱 Parcelas" : modo === "editar" ? "✏️ Editar Parcela" : "➕ Incluir Parcela",
          headerStyle: { backgroundColor: '#2E7D32' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      {modo === "lista" ? (
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.botaoIncluir} onPress={() => AbrirIncluirParcela()} >
            <Text style={styles.txtBtnIncluir}>
              <FontAwesome name="plus" size={16} /> Incluir Parcela
            </Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={parcelas}
              keyExtractor={(item) => item.par_codigo.toString()}
              renderItem={({ item }) => (
                <View style={styles.item}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitulo}>
                      ID: {item.par_codigo} • Talhão: {item.talhao?.tal_descricao || `ID: ${item.tal_codigo}`}
                    </Text>
                    <Text style={styles.itemSubtitulo}>
                      {item.par_descricao}
                    </Text>
                    <Text style={styles.itemMeta}>
                      🌾 {item.par_area_hectares} ha
                    </Text>
                  </View>

                  <View style={styles.itemBotoes}>
                    <TouchableOpacity onPress={() => AbrirEditarParcela(item)} style={styles.acaoBotao}>
                      <FontAwesome name="edit" size={20} color="#2E7D32" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => ExcluirParcela(item.par_codigo)} style={styles.acaoBotao}>
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
            {modo === "editar" ? "Editar" : "Cadastrar"} Parcela
          </Text>

          <Text style={styles.label}>Talhão Vinculado:</Text>
          <TouchableOpacity style={styles.selector} onPress={() => setModalVisible(true)}>
            <Text style={tal_codigo ? styles.selectorTextSelected : styles.selectorTextPlaceholder}>
              {tal_descricao}
            </Text>
            <FontAwesome name="caret-down" size={18} color="#666" />
          </TouchableOpacity>

          <Text style={styles.label}>Descrição da Parcela:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Parcela Y"
            value={descricao}
            onChangeText={setDescricao}
          />

          <Text style={styles.label}>Área (Hectares):</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 12.5"
            keyboardType="numeric"
            value={area}
            onChangeText={setArea}
          />

          <TouchableOpacity style={styles.botaoSalvar} onPress={SalvarParcela}>
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

      {/* MODAL DE SELEÇÃO DE TALHÃO */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Selecione um Talhão</Text>
            <FlatList
              data={talhoes}
              keyExtractor={(item) => item.tal_codigo.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => SelecionarTalhao(item)}
                >
                  <Text style={styles.modalItemText}>{item.tal_descricao}</Text>
                  <Text style={styles.modalItemSub}>
                    Propriedade ID: {item.pro_codigo} • {item.tal_area_hectares} ha
                  </Text>
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
