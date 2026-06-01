# SPEC - FolhaSul 🌿

## 1. Objetivo
App mobile para diagnóstico de pragas em soja, milho e trigo via Visão Computacional, focado no uso em campo (offline-first).

## 2. Stack Tecnológica
- **Framework:** React Native + Expo (Managed Workflow).
- **Linguagem:** TypeScript (Tipagem estrita para modelos de dados).
- **Persistência:** Expo-SQLite (Histórico local).
- **IA (Vision):** Híbrida (Gemini Vision API / Ollama Local).
- **Localização:** Expo-Location (Coordenadas das amostras).

## 3. Interfaces e Fluxos
- **Home (index.tsx):** Menu principal com acesso rápido à captura.
- **Resultados (results.tsx):** - Exibição em lista expandível (Accordion).
  - Item [0]: Análise atual com loading simulado de 2s.
  - Itens [1..n]: Histórico carregado do SQLite.

## 4. Próximas Implementações (Roadmap)
- [ ] **Banco de Dados:** Criar `database.ts` para gerenciar o SQLite (CRUD de análises).
- [ ] **Integração IA:** Trocar o `MOCK_HISTORY` por chamadas reais de Vision.
- [ ] **Geolocalização:** Adicionar latitude/longitude em cada nova análise.
- [ ] **Exportação:** Gerar PDF simples para compartilhamento.

## 5. Modelos de Dados (TypeScript)
```typescript
type HistoryItem = {
  id: string;
  date: string;
  disease: string;
  confidence: string;
  recommendation: string;
  image: string | null;
  latitude?: number;
  longitude?: number;
};
