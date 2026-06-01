import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_BASE_URL } from "../../constants/api";

export default function Safra() {
  const [safras, setSafras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState<"lista" | "novo" | "editar">("lista");

  const [saf_codigo, setSaf_codigo] = useState<number | null>(null);
  const [descricao, setDescricao] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [status, setStatus] = useState<number>(1); // 1 = Ativa, 0 = Inativa

  async function ListarSafras() {
    try {
      const token = await AsyncStorage.getItem("token");
      const resp = await fetch(API_BASE_URL + "/fsu-safra/ListarTodos", {
        headers: { Authorization: "Bearer " + token },
      });

      if (resp.status === 401) {
        Alert.alert("Sessão Expirada", "Por favor, faça login novamente.");
        await AsyncStorage.removeItem("token");
        router.replace("/auth/login");
        return;
      }

      const data = await resp.json();
      setSafras(data);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível carregar safras.");
    } finally {
      setLoading(false);
    }
  }

  function formatarDataParaExibicao(isoString: string | null): string {
    if (!isoString) return "-";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("pt-BR");
  }

  function formatarDataParaInput(isoString: string | null): string {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  }

  function AbrirEditarSafra(item: any) {
    setSaf_codigo(item.saf_codigo);
    setDescricao(item.saf_descricao ?? "");
    setDataInicio(formatarDataParaInput(item.saf_data_inicio));
    setDataFim(formatarDataParaInput(item.saf_data_fim));
    setStatus(item.saf_status ?? 1);
    setModo("editar");
  }

  function AbrirIncluirSafra() {
    LimparSafra();
    setModo("novo");
  }

  function LimparSafra() {
    setSaf_codigo(null);
    setDescricao("");
    // Inicia com a data de hoje formatada YYYY-MM-DD
    setDataInicio(new Date().toISOString().split("T")[0]);
    setDataFim("");
    setStatus(1);
  }

  function Voltar() {
    router.replace("/");
  }
  
  async function SalvarSafra() {
    if (!descricao.trim()) {
      Alert.alert("Atenção", "A descrição da safra é obrigatória!");
      return;
    }
    if (!dataInicio.trim()) {
      Alert.alert("Atenção", "A data de início é obrigatória!");
      return;
    }

    const payload = {
      saf_descricao: descricao,
      saf_data_inicio: dataInicio,
      saf_data_fim: dataFim.trim() ? dataFim : null,
      saf_status: Number(status),
    };

    try {
      const token = await AsyncStorage.getItem("token");
      if (modo === "editar") {
        const resp = await fetch(
          API_BASE_URL + `/fsu-safra/Alterar/${saf_codigo}`,
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
          Alert.alert("Erro", "Não foi possível alterar a safra.");
          return;
        }
      } else {
        const resp = await fetch(API_BASE_URL + "/fsu-safra/Salvar", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            Authorization: "Bearer " + token  
          },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          Alert.alert("Erro", "Não foi possível salvar a safra.");
          return;
        }
      }

      LimparSafra();
      setModo("lista");
      ListarSafras();
    } catch (e) {
      Alert.alert("Erro", "Não foi possível salvar a safra.");
    }
  }

  async function ExcluirSafra(id: number) {
    Alert.alert(
      "Confirmar Exclusão",
      "Deseja realmente excluir esta safra?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const token = await AsyncStorage.getItem("token");
            try {
              const resp = await fetch(
                API_BASE_URL + `/fsu-safra/Excluir/${id}`,
                {
                  method: "DELETE",
                  headers: { Authorization: "Bearer " + token },
                }
              );

              if (!resp.ok) {
                Alert.alert("Erro", "Não foi possível excluir a safra.");
              }

              ListarSafras();
            } catch (e) {
              Alert.alert("Erro", "Não foi possível excluir.");
            }
          }
        }
      ]
    );
  }

  useEffect(() => {
    ListarSafras();
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: modo === "lista" ? "📅 Safras" : modo === "editar" ? "✏️ Editar Safra" : "➕ Incluir Safra",
          headerStyle: { backgroundColor: '#2E7D32' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      {modo === "lista" ? (
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.botaoIncluir} onPress={() => AbrirIncluirSafra()} >
            <Text style={styles.txtBtnIncluir}>
              <FontAwesome name="plus" size={16} /> Incluir Safra
            </Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={safras}
              keyExtractor={(item) => item.saf_codigo.toString()}
              renderItem={({ item }) => (
                <View style={styles.item}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Text style={styles.itemSubtitulo}>{item.saf_descricao}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: item.saf_status === 1 ? "#E8F5E9" : "#FFEBEE" }]}>
                        <Text style={[styles.statusText, { color: item.saf_status === 1 ? "#2E7D32" : "#C62828" }]}>
                          {item.saf_status === 1 ? "Ativa" : "Inativa"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.itemMeta}>
                      📅 Início: {formatarDataParaExibicao(item.saf_data_inicio)}
                      {item.saf_data_fim ? ` • Fim: ${formatarDataParaExibicao(item.saf_data_fim)}` : ""}
                    </Text>
                  </View>

                  <View style={styles.itemBotoes}>
                    <TouchableOpacity onPress={() => AbrirEditarSafra(item)} style={styles.acaoBotao}>
                      <FontAwesome name="edit" size={20} color="#2E7D32" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => ExcluirSafra(item.saf_codigo)} style={styles.acaoBotao}>
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
            {modo === "editar" ? "Editar" : "Cadastrar"} Safra
          </Text>

          <Text style={styles.label}>Descrição de Safra:</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ex: Safra de Soja 2026/2027" 
            value={descricao} 
            onChangeText={setDescricao} 
          />

          <Text style={styles.label}>Data de Início (AAAA-MM-DD):</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ex: 2026-10-15" 
            value={dataInicio} 
            onChangeText={setDataInicio} 
          />

          <Text style={styles.label}>Data de Término (opcional, AAAA-MM-DD):</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ex: 2027-03-20" 
            value={dataFim} 
            onChangeText={setDataFim} 
          />

          <Text style={styles.label}>Status da Safra:</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity 
              style={[styles.toggleBtn, status === 1 ? styles.toggleBtnActive : styles.toggleBtnInactive]}
              onPress={() => setStatus(1)}
            >
              <Text style={status === 1 ? styles.toggleTextActive : styles.toggleTextInactive}>Ativa</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.toggleBtn, status === 0 ? styles.toggleBtnActive : styles.toggleBtnInactive]}
              onPress={() => setStatus(0)}
            >
              <Text style={status === 0 ? styles.toggleTextActive : styles.toggleTextInactive}>Inativa</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.botaoSalvar} onPress={SalvarSafra}>
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

  itemSubtitulo: { fontSize: 18, fontWeight: "bold", color: "#333" },
  itemMeta: { fontSize: 13, color: "#666", marginTop: 6 },

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
});
