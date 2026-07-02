import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Image as RNImage,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../../constants/api";
import { analyzeLeafImage } from "../../src/services/aiService";

export default function AnaliseTecnica() {
  const [analises, setAnalises] = useState<any[]>([]);
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [safras, setSafras] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState<"lista" | "novo" | "editar">("lista");

  const [ant_codigo, setAnt_codigo] = useState<number | null>(null);

  const [par_codigo, setPar_codigo] = useState<number | null>(null);
  const [par_descricao, setPar_descricao] = useState("Selecione uma Parcela");

  const [saf_codigo, setSaf_codigo] = useState<number | null>(null);
  const [saf_descricao, setSaf_descricao] = useState("Selecione uma Safra");

  const [usu_codigo, setUsu_codigo] = useState<number | null>(null);
  const [usu_login, setUsu_login] = useState("Selecione um Usuário/Técnico");

  const [observacao, setObservacao] = useState("");
  const [status, setStatus] = useState<number>(1); // 1 = Finalizado, 0 = Pendente

  const [imagensSelecionadas, setImagensSelecionadas] = useState<
    Array<{
      uri: string;
      base64: string;
      disease: string;
      confidence: string;
      severity: string;
      recommendation: string;
    }>
  >([]);
  const [analisandoIA, setAnalisandoIA] = useState(false);

  const [modalType, setModalType] = useState<
    "parcela" | "safra" | "usuario" | null
  >(null);
  const [modalVisible, setModalVisible] = useState(false);

  async function TirarFoto() {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permissão necessária",
        "Precisamos de permissão para acessar a câmera!",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      processarImagem(result.assets[0].uri);
    }
  }

  async function EscolherGaleria() {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permissão necessária",
        "Precisamos de permissão para acessar suas fotos!",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      processarImagem(result.assets[0].uri);
    }
  }

  async function processarImagem(uri: string) {
    try {
      setAnalisandoIA(true);

      // Reduz e comprime a imagem antes de enviar, evitando estourar o limite de payload do servidor
      const imagemTratada = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        {
          compress: 0.6,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        },
      );

      const aiResult = await analyzeLeafImage(imagemTratada.uri);

      const novaImagem = {
        uri: imagemTratada.uri,
        base64: imagemTratada.base64 ?? "",
        disease: aiResult.disease,
        confidence: aiResult.confidence,
        severity: aiResult.severity,
        recommendation: aiResult.recommendation,
      };

      setImagensSelecionadas((prev) => [...prev, novaImagem]);

      const numeroFolha = imagensSelecionadas.length + 1;
      const parecerTexto = `[Parecer IA - Folha #${numeroFolha}]
      - Severidade: ${aiResult.severity}
      - Diagnóstico: ${aiResult.disease} (Confiança: ${aiResult.confidence})
      - Sugestão: ${aiResult.recommendation}`;

      setObservacao((prev) =>
        prev ? `${prev}\n\n${parecerTexto}` : parecerTexto,
      );
    } catch (e) {
      console.error("Erro ao analisar imagem com IA:", e);
      Alert.alert(
        "Erro de IA",
        "Não foi possível realizar o diagnóstico automático de imagem.",
      );
    } finally {
      setAnalisandoIA(false);
    }
  }

  async function ListarAnalises() {
    try {
      const token = await AsyncStorage.getItem("token");
      const resp = await fetch(
        API_BASE_URL + "/fsu-analise-tecnica/ListarTodos",
        {
          headers: { Authorization: "Bearer " + token },
        },
      );

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

      const [respParcela, respSafra, respUsuario] = await Promise.all([
        fetch(API_BASE_URL + "/fsu-parcela/ListarTodos", {
          headers: { Authorization: "Bearer " + token },
        }),
        fetch(API_BASE_URL + "/fsu-safra/ListarTodos", {
          headers: { Authorization: "Bearer " + token },
        }),
        fetch(API_BASE_URL + "/fsu-usuario/ListarTodos", {
          headers: { Authorization: "Bearer " + token },
        }),
      ]);

      const [dataParcela, dataSafra, dataUsuario] = await Promise.all([
        respParcela.json(),
        respSafra.json(),
        respUsuario.json(),
      ]);

      setParcelas(dataParcela);
      setSafras(dataSafra);
      setUsuarios(dataUsuario);
    } catch (e) {
      console.error("Erro ao carregar seletores:", e);
    }
  }

  function AbrirModal(type: "parcela" | "safra" | "usuario") {
    setModalType(type);
    setModalVisible(true);
  }

  function SelecionarItem(item: any) {
    if (modalType === "parcela") {
      setPar_codigo(item.par_codigo);
      setPar_descricao(item.par_descricao);
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
    return date.toLocaleString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function AbrirEditarAnalise(item: any) {
    setAnt_codigo(item.ant_codigo);
    setPar_codigo(item.par_codigo);
    setPar_descricao(item.parcela?.par_descricao || `ID: ${item.par_codigo}`);
    setSaf_codigo(item.saf_codigo);
    setSaf_descricao(item.safra?.saf_descricao || `ID: ${item.saf_codigo}`);
    setUsu_codigo(item.usu_codigo);
    setUsu_login(item.usuario?.usu_login || `ID: ${item.usu_codigo}`);
    setObservacao(item.ant_observacao ?? "");
    setStatus(item.ant_status ?? 1);

    if (item.imagens && item.imagens.length > 0) {
      setImagensSelecionadas(
        item.imagens.map((img: any) => ({
          uri: `data:image/jpeg;base64,${img.ati_imagem}`,
          base64: img.ati_imagem,
          disease: "Imagem Salva",
          confidence: "",
          recommendation: "",
        })),
      );
    } else {
      setImagensSelecionadas([]);
    }
    setAnalisandoIA(false);

    setModo("editar");
  }

  function AbrirIncluirAnalise() {
    LimparAnalise();
    setModo("novo");
  }

  function LimparAnalise() {
    setAnt_codigo(null);
    setPar_codigo(null);
    setPar_descricao("Selecione uma Parcela");
    setSaf_codigo(null);
    setSaf_descricao("Selecione uma Safra");
    setUsu_codigo(null);
    setUsu_login("Selecione um Usuário/Técnico");
    setObservacao("");
    setStatus(1);
    setImagensSelecionadas([]);
    setAnalisandoIA(false);
  }

  function Voltar() {
    router.replace("/");
  }

  async function SalvarAnalise() {
    if (!par_codigo) {
      Alert.alert("Atenção", "Selecione a Parcela!");
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

    const payload: any = {
      par_codigo: Number(par_codigo),
      saf_codigo: Number(saf_codigo),
      usu_codigo: Number(usu_codigo),
      ant_observacao: observacao.trim() ? observacao : null,
      ant_data_hora: new Date().toISOString(),
      ant_status: Number(status),
    };

    if (imagensSelecionadas.length > 0) {
      payload.imagens = imagensSelecionadas.map((img, idx) => ({
        ati_imagem: img.base64,
        ati_nome_arquivo: `analise_${par_codigo}_folha_${idx + 1}_${Date.now()}.jpg`,
        ati_tipo_arquivo: "image/jpeg",
      }));
    }

    try {
      const token = await AsyncStorage.getItem("token");
      if (modo === "editar") {
        const resp = await fetch(
          API_BASE_URL + `/fsu-analise-tecnica/Alterar/${ant_codigo}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + token,
            },
            body: JSON.stringify(payload),
          },
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
            Authorization: "Bearer " + token,
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
                },
              );

              if (!resp.ok) {
                Alert.alert(
                  "Erro",
                  "Não foi possível excluir a análise técnica.",
                );
              }

              ListarAnalises();
            } catch (e) {
              Alert.alert("Erro", "Não foi possível excluir.");
            }
          },
        },
      ],
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
          title:
            modo === "lista"
              ? "📋 Análises Técnicas"
              : modo === "editar"
                ? "✏️ Editar Análise"
                : "➕ Nova Análise",
          headerStyle: { backgroundColor: "#2E7D32" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />

      {modo === "lista" ? (
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={styles.botaoIncluir}
            onPress={() => AbrirIncluirAnalise()}
          >
            <Text style={styles.txtBtnIncluir}>
              <FontAwesome name="plus" size={16} /> Nova Análise Técnica
            </Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#2E7D32"
              style={{ marginTop: 20 }}
            />
          ) : (
            <FlatList
              data={analises}
              keyExtractor={(item) => item.ant_codigo.toString()}
              renderItem={({ item }) => (
                <View style={styles.item}>
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <Text style={styles.itemTitulo}>
                        ID: {item.ant_codigo}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              item.ant_status === 1 ? "#E8F5E9" : "#FFF8E1",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color:
                                item.ant_status === 1 ? "#2E7D32" : "#F57F17",
                            },
                          ]}
                        >
                          {item.ant_status === 1
                            ? "Finalizado"
                            : "Em Andamento"}
                        </Text>
                      </View>
                    </View>

                    <View style={{ marginTop: 8 }}>
                      <Text style={styles.itemSubtitulo}>
                        🌱{" "}
                        {item.parcela?.par_descricao ||
                          `Parcela ID: ${item.par_codigo}`}
                      </Text>
                      <Text style={styles.itemMeta}>
                        🌾 Talhão:{" "}
                        {item.parcela?.talhao?.tal_descricao || "-"}
                      </Text>
                      <Text style={styles.itemMeta}>
                        📅 Safra:{" "}
                        {item.safra?.saf_descricao ||
                          `Safra ID: ${item.saf_codigo}`}
                      </Text>
                      <Text style={styles.itemMeta}>
                        👤 Técnico:{" "}
                        {item.usuario?.usu_login ||
                          `Usuário ID: ${item.usu_codigo}`}
                      </Text>

                      {item.imagens && item.imagens.length > 0 ? (
                        <ScrollView
                          horizontal={true}
                          showsHorizontalScrollIndicator={false}
                          style={styles.carouselContainer}
                          contentContainerStyle={{ gap: 8 }}
                        >
                          {item.imagens.map((img: any, idx: number) => (
                            <RNImage
                              key={idx}
                              source={{
                                uri: `data:image/jpeg;base64,${img.ati_imagem}`,
                              }}
                              style={styles.itemThumbnailSmall}
                            />
                          ))}
                        </ScrollView>
                      ) : null}
                    </View>

                    {item.ant_observacao ? (
                      <Text style={styles.itemObs}>
                        💬 "{item.ant_observacao}"
                      </Text>
                    ) : null}
                    <Text style={styles.itemData}>
                      ⏰ Realizada em: {formatarData(item.ant_data_hora)}
                    </Text>
                  </View>

                  <View style={styles.itemBotoes}>
                    <TouchableOpacity
                      onPress={() => AbrirEditarAnalise(item)}
                      style={styles.acaoBotao}
                    >
                      <FontAwesome name="edit" size={20} color="#2E7D32" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => ExcluirAnalise(item.ant_codigo)}
                      style={styles.acaoBotao}
                    >
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          <Text style={styles.formTitulo}>
            {modo === "editar" ? "Editar" : "Lançar"} Análise Técnica
          </Text>

          <Text style={styles.label}>Parcela Vinculada:</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => AbrirModal("parcela")}
          >
            <Text
              style={
                par_codigo
                  ? styles.selectorTextSelected
                  : styles.selectorTextPlaceholder
              }
            >
              {par_descricao}
            </Text>
            <FontAwesome name="caret-down" size={18} color="#666" />
          </TouchableOpacity>

          <Text style={styles.label}>Safra Vinculada:</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => AbrirModal("safra")}
          >
            <Text
              style={
                saf_codigo
                  ? styles.selectorTextSelected
                  : styles.selectorTextPlaceholder
              }
            >
              {saf_descricao}
            </Text>
            <FontAwesome name="caret-down" size={18} color="#666" />
          </TouchableOpacity>

          <Text style={styles.label}>Técnico / Usuário Responsável:</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => AbrirModal("usuario")}
          >
            <Text
              style={
                usu_codigo
                  ? styles.selectorTextSelected
                  : styles.selectorTextPlaceholder
              }
            >
              {usu_login}
            </Text>
            <FontAwesome name="caret-down" size={18} color="#666" />
          </TouchableOpacity>

          <Text style={styles.label}>
            Foto da Folha para Análise de IA (opcional):
          </Text>
          <View style={styles.imagePickerContainer}>
            <TouchableOpacity style={styles.imagePickerBtn} onPress={TirarFoto}>
              <Text style={styles.imagePickerBtnText}>📸 Tirar Foto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imagePickerBtn}
              onPress={EscolherGaleria}
            >
              <Text style={styles.imagePickerBtnText}>🖼️ Galeria</Text>
            </TouchableOpacity>
          </View>

          {analisandoIA && (
            <View style={styles.iaLoadingContainer}>
              <ActivityIndicator size="small" color="#2E7D32" />
              <Text style={styles.iaLoadingText}>IA analisando a folha...</Text>
            </View>
          )}

          {imagensSelecionadas.length > 0 && (
            <View style={styles.imagensListContainer}>
              <Text style={styles.subLabel}>
                Imagens e Pareceres da IA ({imagensSelecionadas.length}):
              </Text>
              {imagensSelecionadas.map((img, index) => (
                <View key={index} style={styles.imageCard}>
                  <RNImage
                    source={{ uri: img.uri }}
                    style={styles.imageCardPreview}
                  />
                  <View style={styles.imageCardInfo}>
                    <Text style={styles.imageCardTitle}>
                      🍃 Folha #{index + 1}
                    </Text>
                    {img.disease !== "Imagem Salva" ? (
                      <>
                        <Text style={styles.imageCardText}>
                          <Text style={{ fontWeight: "bold" }}>
                            Sugestão Doença:{" "}
                          </Text>
                          {img.disease}
                        </Text>
                        <Text style={styles.imageCardText}>
                          <Text style={{ fontWeight: "bold" }}>
                            Severidade:{" "}
                          </Text>
                          {img.severity}
                        </Text>
                        <Text style={styles.imageCardText}>
                          <Text style={{ fontWeight: "bold" }}>
                            Confiança:{" "}
                          </Text>
                          {img.confidence}
                        </Text>
                        <Text style={styles.imageCardText}>
                          <Text style={{ fontWeight: "bold" }}>Sugestão: </Text>
                          {img.recommendation}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.imageCardText}>
                        Imagem salva no banco de dados.
                      </Text>
                    )}
                    <TouchableOpacity
                      style={styles.removerCardBtn}
                      onPress={() => {
                        setImagensSelecionadas((prev) =>
                          prev.filter((_, i) => i !== index),
                        );
                      }}
                    >
                      <Text style={styles.removerCardBtnText}>🗑️ Remover</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.label}>Observações Técnicas (opcional):</Text>
          <TextInput
            style={[styles.input, { height: 120, textAlignVertical: "top" }]}
            placeholder="Digite detalhes observados no campo ou aguarde a análise de IA"
            multiline
            numberOfLines={4}
            value={observacao}
            onChangeText={setObservacao}
          />

          <Text style={styles.label}>Status da Análise:</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                status === 1
                  ? styles.toggleBtnActive
                  : styles.toggleBtnInactive,
              ]}
              onPress={() => setStatus(1)}
            >
              <Text
                style={
                  status === 1
                    ? styles.toggleTextActive
                    : styles.toggleTextInactive
                }
              >
                Finalizado
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleBtn,
                status === 0
                  ? styles.toggleBtnActive
                  : styles.toggleBtnInactive,
              ]}
              onPress={() => setStatus(0)}
            >
              <Text
                style={
                  status === 0
                    ? styles.toggleTextActive
                    : styles.toggleTextInactive
                }
              >
                Em Andamento
              </Text>
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
        </ScrollView>
      )}

      {/* MODAL DE SELEÇÃO DINÂMICA */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>
              {modalType === "parcela"
                ? "Selecione a Parcela"
                : modalType === "safra"
                  ? "Selecione a Safra"
                  : "Selecione o Técnico"}
            </Text>

            {modalType === "parcela" && (
              <FlatList
                data={parcelas}
                keyExtractor={(item) => item.par_codigo.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => SelecionarItem(item)}
                  >
                    <Text style={styles.modalItemText}>
                      {item.par_descricao}
                    </Text>
                    <Text style={styles.modalItemSub}>
                      Talhão: {item.talhao?.tal_descricao || `ID: ${item.tal_codigo}`} •{" "}
                      {item.par_area_hectares} ha
                    </Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => (
                  <View style={styles.modalSeparator} />
                )}
              />
            )}

            {modalType === "safra" && (
              <FlatList
                data={safras}
                keyExtractor={(item) => item.saf_codigo.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => SelecionarItem(item)}
                  >
                    <Text style={styles.modalItemText}>
                      {item.saf_descricao}
                    </Text>
                    <Text style={styles.modalItemSub}>
                      Status: {item.saf_status === 1 ? "Ativa" : "Inativa"}
                    </Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => (
                  <View style={styles.modalSeparator} />
                )}
              />
            )}

            {modalType === "usuario" && (
              <FlatList
                data={usuarios}
                keyExtractor={(item) => item.usu_codigo.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => SelecionarItem(item)}
                  >
                    <Text style={styles.modalItemText}>{item.usu_login}</Text>
                    <Text style={styles.modalItemSub}>
                      Usuário ID: {item.usu_codigo}
                    </Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => (
                  <View style={styles.modalSeparator} />
                )}
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
  itemSubtitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 2,
    marginBottom: 4,
  },
  itemMeta: { fontSize: 13, color: "#666", marginTop: 2 },
  itemObs: {
    fontSize: 14,
    color: "#444",
    fontStyle: "italic",
    marginTop: 6,
    backgroundColor: "#F5F5F5",
    padding: 8,
    borderRadius: 6,
  },
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
    color: "#2E7D32",
  },

  label: {
    fontWeight: "bold",
    marginBottom: 6,
    color: "#333",
    fontSize: 14,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 11,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#FFF",
    fontSize: 16,
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
  imagePickerContainer: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 12,
  },
  imagePickerBtn: {
    flex: 1,
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#A5D6A7",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  imagePickerBtnText: {
    color: "#2E7D32",
    fontWeight: "bold",
    fontSize: 14,
  },
  iaLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#E8F5E9",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  iaLoadingText: {
    color: "#2E7D32",
    fontWeight: "bold",
    fontSize: 14,
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#FFF",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  imagePreview: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    resizeMode: "cover",
  },
  removeImageBtn: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#FFEBEE",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  removeImageBtnText: {
    color: "#C62828",
    fontSize: 13,
    fontWeight: "bold",
  },
  itemThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#DDD",
    alignSelf: "center",
  },
  carouselContainer: {
    marginTop: 8,
    flexDirection: "row",
  },
  itemThumbnailSmall: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: "#DDD",
  },
  imagensListContainer: {
    marginBottom: 15,
  },
  subLabel: {
    fontWeight: "bold",
    color: "#555",
    fontSize: 13,
    marginBottom: 8,
  },
  imageCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 12,
    alignItems: "center",
  },
  imageCardPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    resizeMode: "cover",
  },
  imageCardInfo: {
    flex: 1,
    gap: 2,
  },
  imageCardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 2,
  },
  imageCardText: {
    fontSize: 13,
    color: "#333",
  },
  removerCardBtn: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "#FFEBEE",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  removerCardBtnText: {
    color: "#C62828",
    fontSize: 12,
    fontWeight: "bold",
  },
});
