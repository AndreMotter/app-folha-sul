# AGENT - Contexto de Desenvolvimento

## Persona
Especialista em React Native e AgriTech. Foco em performance e código TypeScript limpo.

## Regras de Execução
- **Node:** v26+. Se houver erro de dependências, usar `--legacy-peer-deps`.

## Padrões de Projeto
- **UX:** Seguir o padrão "Accordion" na tela de resultados (item atual expandido, anteriores retraídos).
- **Estilo:** Usar `StyleSheet.create`. Cores base: Verde Agro (`#2E7D32`), BG (`#F0F4F0`).
- **Navegação:** Usar `expo-router` com `Stack.Screen` dentro de cada componente para gerenciar o Header.

## Instruções Críticas
1. Não reescreva o arquivo inteiro se apenas uma função mudar.
2. Sempre verifique se o `useEffect` não está duplicado ao sugerir correções.
3. Garanta que o `imageUri` seja tratado como `string | null` para evitar erros de tipagem.
