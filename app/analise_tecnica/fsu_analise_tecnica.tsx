import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_BASE_URL } from "../../constants/api";

export default function AnaliseTecnica() {
  const [analises, setAnalises] = useState<any[]>([]);
  const [talhoes, setTalhoes] = useState<any[]>([]);
  const [safras, setSafras] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState<"lista" | "novo" | "editar">("lista");

  const [ant_codigo, setAnt_codigo] = useState<number | null>(null);
  
  const [tal_codigo, setTal_codigo] = useState<number | null>(null);
  const [tal_descricao, setTal_descricao] = useState("Selecione um Talhão");

  const [saf_codigo, setSaf_codigo] = useState<number | null>(null);
  const [saf_descricao, setSaf_descricao] = useState("Selecione uma Safra");

  const [usu_codigo, setUsu_codigo] = useState<number | null>(null);
  const [usu_login, setUsu_login] = useState("Selecione um Usuário/Técnico");

  const [observacao, setObservacao] = useState("");
  const [status, setStatus] = useState<number>(1); // 1 = Finalizado, 0 = Pendente

  const [modalType, setModalType] = useState<"talhao" | "safra" | "usuario" | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  async function ListarAnalises() {
    try {
      const token = await AsyncStorage.getItem("token");
      const resp = await fetch(API_BASE_URL + "/fsu-analise-tecnica/ListarTodos", {
        headers: { Authorization: "Bearer " + token },
      });

      if (resp.status === 401) {
        Alert.alert("Sessão Expirada", "Por favor, faça login novamente.");
        await AsyncStorage.removeItem("token");
        router.replace("/auth/login");
        return;
      }

      const data = await resp.json();
      setAnalises(data);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível carregar análises técnicas.");
    } finally {
      setLoading(false);
    }
  }

  async function ListarSeletores() {
    try {
      const token = await AsyncStorage.getItem("token");
      
      const [respTalhao, respSafra, respUsuario] = await Promise.all([
        fetch(API_BASE_URL + "/fsu-talhao/ListarTodos", { headers: { Authorization: "Bearer " + token } }),
        fetch(API_BASE_URL + "/fsu-safra/ListarTodos", { headers: { Authorization: "Bearer " + token } }),
        fetch(API_BASE_URL + "/fsu-usuario/ListarTodos", { headers: { Authorization: "Bearer " + token } }),
      ]);

      const [dataTalhao, dataSafra, dataUsuario] = await Promise.all([
        respTalhao.json(),
        respSafra.json(),
        respUsuario.json(),
      ]);

      setTalhoes(dataTalhao);
      setSafras(dataSafra);
      setUsuarios(dataUsuario);
    } catch (e) {
      console.error("Erro ao carregar seletores:", e);
    }
  }

  function AbrirModal(type: "talhao" | "safra" | "usuario") {
    setModalType(type);
    setModalVisible(true);
  }

  function SelecionarItem(item: any) {
    if (modalType === "talhao") {
      setTal_codigo(item.tal_codigo);
      setTal_descricao(item.tal_descricao);
    } else if (modalType === "safra") {
      setSaf_codigo(item.saf_codigo);
      setSaf_descricao(item.saf_descricao);
    } else if (modalType === "usuario") {
      setUsu_codigo(item.usu_codigo);
      setUsu_login(item.usu_login);
    }
    setModalVisible(false);
  }

  function formatarData(isoString: string | null): string {
    if (!isoString) return "-";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function AbrirEditarAnalise(item: any) {
    setAnt_codigo(item.ant_codigo);
    setTal_codigo(item.tal_codigo);
    setTal_descricao(item.talhao?.tal_descricao || `ID: ${item.tal_codigo}`);
    setSaf_codigo(item.saf_codigo);
    setSaf_descricao(item.safra?.saf_descricao || `ID: ${item.saf_codigo}`);
    setUsu_codigo(item.usu_codigo);
    setUsu_login(item.usuario?.usu_login || `ID: ${item.usu_codigo}`);
    setObservacao(item.ant_observacao ?? "");
    setStatus(item.ant_status ?? 1);
    setModo("editar");
  }

  function AbrirIncluirAnalise() {
    LimparAnalise();
    setModo("novo");
  }

  function LimparAnalise() {
    setAnt_codigo(null);
    setTal_codigo(null);
    setTal_descricao("Selecione um Talhão");
    setSaf_codigo(null);
    setSaf_descricao("Selecione uma Safra");
    setUsu_codigo(null);
    setUsu_login("Selecione um Usuário/Técnico");
    setObservacao("");
    setStatus(1);
  }

  function Voltar() {
    router.replace("/");
  }
  
  async function SalvarAnalise() {
    if (!tal_codigo) {
      Alert.alert("Atenção", "Selecione o Talhão!");
      return;
    }
    if (!saf_codigo) {
      Alert.alert("Atenção", "Selecione a Safra!");
      return;
    }
    if (!usu_codigo) {
      Alert.alert("Atenção", "Selecione o Usuário/Técnico!");
      return;
    }

    const payload = {
      tal_codigo: Number(tal_codigo),
      saf_codigo: Number(saf_codigo),
      usu_codigo: Number(usu_codigo),
      ant_observacao: observacao.trim() ? observacao : null,
      ant_data_hora: new Date().toISOString(),
      ant_status: Number(status),
    };

    try {
      const token = await AsyncStorage.getItem("token");
      if (modo === "editar") {
        const resp = await fetch(
          API_BASE_URL + `/fsu-analise-tecnica/Alterar/${ant_codigo}`,
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
          Alert.alert("Erro", "Não foi possível alterar a análise técnica.");
          return;
        }
      } else {
        const resp = await fetch(API_BASE_URL + "/fsu-analise-tecnica/Salvar", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            Authorization: "Bearer " + token  
          },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          Alert.alert("Erro", "Não foi possível salvar a análise técnica.");
          return;
        }
      }

      LimparAnalise();
      setModo("lista");
      ListarAnalises();
    } catch (e) {
      Alert.alert("Erro", "Não foi possível salvar a análise técnica.");
    }
  }

  async function ExcluirAnalise(id: number) {
    Alert.alert(
      "Confirmar Exclusão",
      "Deseja realmente excluir esta análise técnica?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const token = await AsyncStorage.getItem("token");
            try {
              const resp = await fetch(
                API_BASE_URL + `/fsu-analise-tecnica/Excluir/${id}`,
                {
                  method: "DELETE",
                  headers: { Authorization: "Bearer " + token },
                }
              );

              if (!resp.ok) {
                Alert.alert("Erro", "Não foi possível excluir a análise técnica.");
              }

              ListarAnalises();
            } catch (e) {
              Alert.alert("Erro", "Não foi possível excluir.");
            }
          }
        }
      ]
    );
  }

  useEffect(() => {
    ListarAnalises();
    ListarSeletores();
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: modo === "lista" ? "📋 Análises Técnicas" : modo === "editar" ? "✏️ Editar Análise" : "➕ Nova Análise",
          headerStyle: { backgroundColor: '#2E7D32' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      {modo === "lista" ? (
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.botaoIncluir} onPress={() => AbrirIncluirAnalise()} >
            <Text style={styles.txtBtnIncluir}>
              <FontAwesome name="plus" size={16} /> Nova Análise Técnica
            </Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={analises}
              keyExtractor={(item) => item.ant_codigo.toString()}
              renderItem={({ item }) => (
                <View style={styles.item}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Text style={styles.itemTitulo}>ID: {item.ant_codigo}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: item.ant_status === 1 ? "#E8F5E9" : "#FFF8E1" }]}>
                        <Text style={[styles.statusText, { color: item.ant_status === 1 ? "#2E7D32" : "#F57F17" }]}>
                          {item.ant_status === 1 ? "Finalizado" : "Em Andamento"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.itemSubtitulo}>🌾 {item.talhao?.tal_descricao || `Talhão ID: ${item.tal_codigo}`}</Text>
                    <Text style={styles.itemMeta}>📅 Safra: {item.safra?.saf_descricao || `Safra ID: ${item.saf_codigo}`}</Text>
                    <Text style={styles.itemMeta}>👤 Técnico: {item.usuario?.usu_login || `Usuário ID: ${item.usu_codigo}`}</Text>
                    {item.ant_observacao ? (
                      <Text style={styles.itemObs}>💬 "{item.ant_observacao}"</Text>
                    ) : null}
                    <Text style={styles.itemData}>⏰ Realizada em: {formatarData(item.ant_data_hora)}</Text>
                  </View>

                  <View style={styles.itemBotoes}>
                    <TouchableOpacity onPress={() => AbrirEditarAnalise(item)} style={styles.acaoBotao}>
                      <FontAwesome name="edit" size={20} color="#2E7D32" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => ExcluirAnalise(item.ant_codigo)} style={styles.acaoBotao}>
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
            {modo === "editar" ? "Editar" : "Lançar"} Análise Técnica
          </Text>

          <Text style={styles.label}>Talhão Vinculado:</Text>
          <TouchableOpacity style={styles.selector} onPress={() => AbrirModal("talhao")}>
            <Text style={tal_codigo ? styles.selectorTextSelected : styles.selectorTextPlaceholder}>
              {tal_descricao}
            </Text>
            <FontAwesome name="caret-down" size={18} color="#666" />
          </TouchableOpacity>

          <Text style={styles.label}>Safra Vinculada:</Text>
          <TouchableOpacity style={styles.selector} onPress={() => AbrirModal("safra")}>
            <Text style={saf_codigo ? styles.selectorTextSelected : styles.selectorTextPlaceholder}>
              {saf_descricao}
            </Text>
            <FontAwesome name="caret-down" size={18} color="#666" />
          </TouchableOpacity>

          <Text style={styles.label}>Técnico / Usuário Responsável:</Text>
          <TouchableOpacity style={styles.selector} onPress={() => AbrirModal("usuario")}>
            <Text style={usu_codigo ? styles.selectorTextSelected : styles.selectorTextPlaceholder}>
              {usu_login}
            </Text>
            <FontAwesome name="caret-down" size={18} color="#666" />
          </TouchableOpacity>

          <Text style={styles.label}>Observações Técnicas (opcional):</Text>
          <TextInput 
            style={[styles.input, { height: 80, textAlignVertical: "top" }]} 
            placeholder="Digite detalhes observados no campo (ex: presença de manchas foliares)" 
            multiline
            numberOfLines={3}
            value={observacao} 
            onChangeText={setObservacao} 
          />

          <Text style={styles.label}>Status da Análise:</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity 
              style={[styles.toggleBtn, status === 1 ? styles.toggleBtnActive : styles.toggleBtnInactive]}
              onPress={() => setStatus(1)}
            >
              <Text style={status === 1 ? styles.toggleTextActive : styles.toggleTextInactive}>Finalizado</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.toggleBtn, status === 0 ? styles.toggleBtnActive : styles.toggleBtnInactive]}
              onPress={() => setStatus(0)}
            >
              <Text style={status === 0 ? styles.toggleTextActive : styles.toggleTextInactive}>Em Andamento</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.botaoSalvar} onPress={SalvarAnalise}>
            <Text style={styles.txtBtn}>Salvar Análise</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoVoltarForm}
            onPress={() => setModo("lista")}
          >
            <Text style={styles.txtBtn}>Voltar para Lista</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MODAL DE SELEÇÃO DINÂMICA */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>
              {modalType === "talhao" ? "Selecione o Talhão" : modalType === "safra" ? "Selecione a Safra" : "Selecione o Técnico"}
            </Text>
            
            {modalType === "talhao" && (
              <FlatList
                data={talhoes}
                keyExtractor={(item) => item.tal_codigo.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalItem} onPress={() => SelecionarItem(item)}>
                    <Text style={styles.modalItemText}>{item.tal_descricao}</Text>
                    <Text style={styles.modalItemSub}>Propriedade ID: {item.pro_codigo} • {item.tal_area_hectares} ha</Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
              />
            )}

            {modalType === "safra" && (
              <FlatList
                data={safras}
                keyExtractor={(item) => item.saf_codigo.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalItem} onPress={() => SelecionarItem(item)}>
                    <Text style={styles.modalItemText}>{item.saf_descricao}</Text>
                    <Text style={styles.modalItemSub}>Status: {item.saf_status === 1 ? "Ativa" : "Inativa"}</Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
              />
            )}

            {modalType === "usuario" && (
              <FlatList
                data={usuarios}
                keyExtractor={(item) => item.usu_codigo.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalItem} onPress={() => SelecionarItem(item)}>
                    <Text style={styles.modalItemText}>{item.usu_login}</Text>
                    <Text style={styles.modalItemSub}>Usuário ID: {item.usu_codigo}</Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
              />
            )}

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
    marginBottom: 12,
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

  itemTitulo: { fontWeight: "bold", fontSize: 13, color: "#888" },
  itemSubtitulo: { fontSize: 18, fontWeight: "bold", color: "#333", marginTop: 2, marginBottom: 4 },
  itemMeta: { fontSize: 13, color: "#666", marginTop: 2 },
  itemObs: { fontSize: 14, color: "#444", fontStyle: "italic", marginTop: 6, backgroundColor: "#F5F5F5", padding: 8, borderRadius: 6 },
  itemData: { fontSize: 11, color: "#999", marginTop: 8 },

  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "bold",
  },

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

  toggleRow: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  toggleBtnActive: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  toggleBtnInactive: {
    backgroundColor: "#FFF",
    borderColor: "#ccc",
  },
  toggleTextActive: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  toggleTextInactive: {
    color: "#555",
    fontSize: 15,
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
