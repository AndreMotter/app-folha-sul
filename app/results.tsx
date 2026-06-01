import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { analyzeLeafImage } from '../src/services/aiService';
import { fetchAllAnalyses, HistoryItem, saveAnalysis } from '../src/services/database';

export default function ResultsScreen() {
  const { imageUri } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<HistoryItem[]>([]);
  const [expandedId, setExpandedId] = useState<string>('');
  const [latestId, setLatestId] = useState<string>(''); // 👈 novo

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const history = await fetchAllAnalyses();

      if (imageUri) {
        const aiResult = await analyzeLeafImage(imageUri as string);
        if (cancelled) return;

        const saved = await saveAnalysis({
          date: new Date().toISOString(), // 👈 agora é ISO
          disease: aiResult.disease,
          confidence: aiResult.confidence,
          recommendation: aiResult.recommendation,
          image: imageUri as string,
        });

        if (cancelled) return;

        setAnalyses([saved, ...history]);
        setExpandedId(saved.id);
        setLatestId(saved.id); // 👈 define o mais recente
      } else {
        setAnalyses([
          {
            id: '-1',
            date: 'Sem data',
            disease: 'Nenhuma foto carregada',
            confidence: '-',
            recommendation:
              'Volte e tire uma foto ou escolha da galeria para analisar.',
            image: null,
          },
          ...history,
        ]);
        setExpandedId('-1');
      }

      setLoading(false);
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [imageUri]);

  if (loading) {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#F0F4F0',
            zIndex: 1000
          }
        ]}
      >
        <Stack.Screen options={{ title: 'Analisando...' }} />
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={{ marginTop: 20, color: '#2E7D32', fontWeight: 'bold' }}>
          IA está analisando a folha...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Stack.Screen
        options={{
          title: '🌱 FolhaSul',
          headerStyle: { backgroundColor: '#2E7D32' },
          headerTintColor: '#fff',
          headerShadowVisible: false
        }}
      />

      {analyses.map((item) => {
        const isExpanded = expandedId === item.id;

        // 🔽 CARD RETRAÍDO
        if (!isExpanded) {
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.collapsedCard}
              onPress={() => setExpandedId(item.id)}
            >
              <View style={styles.collapsedInfo}>
                <Text style={styles.collapsedDate}>{item.date}</Text>
                <Text style={styles.collapsedDisease}>{item.disease}</Text>
              </View>
              <Text style={styles.expandIcon}>▼</Text>
            </TouchableOpacity>
          );
        }

        // 🔼 CARD EXPANDIDO
        return (
          <View key={item.id} style={styles.expandedContainer}>
            <View style={styles.imageContainer}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.image} />
              ) : (
                <View
                  style={[
                    styles.image,
                    {
                      backgroundColor: '#DDD',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }
                  ]}
                >
                  <Text style={{ color: '#666' }}>Imagem arquivada</Text>
                </View>
              )}
            </View>

            <View style={styles.resultCard}>
              <View style={styles.headerRow}>
                <Text style={styles.statusBadge}>
                  {item.id === latestId ? 'Nova Análise' : item.date}
                </Text>

                <TouchableOpacity onPress={() => setExpandedId('')}>
                  <Text style={styles.closeIcon}>▲</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.diseaseName}>{item.disease}</Text>
              <Text style={styles.probability}>
                Confiança: {item.confidence}
              </Text>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Recomendação:</Text>
              <Text style={styles.description}>
                {item.recommendation}
              </Text>

              {item.id === latestId && (
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => router.replace('/')}
                >
                  <Text style={styles.doneButtonText}>Nova Consulta</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F0' },

  collapsedCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 20,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },

  collapsedInfo: { flex: 1 },

  collapsedDate: { fontSize: 12, color: '#666', marginBottom: 4 },

  collapsedDisease: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },

  expandIcon: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: 'bold'
  },

  closeIcon: { fontSize: 20, color: '#999', padding: 5 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  expandedContainer: { marginBottom: 10 },

  imageContainer: { width: '100%', height: 300 },

  image: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30
  },

  resultCard: {
    padding: 25,
    marginTop: -30,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginHorizontal: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10
  },

  statusBadge: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: 'bold'
  },

  diseaseName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333'
  },

  probability: { color: '#666', fontSize: 14 },

  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 20 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20'
  },

  description: {
    color: '#555',
    lineHeight: 22,
    marginTop: 5
  },

  doneButton: {
    backgroundColor: '#2E7D32',
    padding: 18,
    borderRadius: 15,
    marginTop: 30,
    alignItems: 'center'
  },

  doneButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16
  }
});