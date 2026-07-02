import * as FileSystem from 'expo-file-system/legacy';

// Adicionamos a tipagem que estava faltando
export type AiResult = {
  severity: string, 
  disease: string;
  confidence: string;
  recommendation: string;
};

const GROQ_API_KEY = '';
const GROQ_URL = '';

export async function analyzeLeafImage(imageUri: string): Promise<AiResult> {
  console.log("🚀 Iniciando análise via Groq Cloud...");

  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // IMPORTANTE: Manter o modelo vision para fotos
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Você é um avaliador de severidade foliar. Analise a imagem da folha e foque principalmente em estimar o percentual de severidade, ou seja, a porcentagem aproximada da área visível da folha afetada por sintomas como manchas, necrose, ferrugem, amarelamento, queima, lesões ou deformações. Identifique também a possível doença ou informe se a folha está saudável. Retorne APENAS um JSON válido neste formato: {\"severity\": \"XX%\", \"disease\": \"nome ou saudável\", \"confidence\": \"XX%\", \"recommendation\": \"dica curta\"}"
              },
              { 
                type: "image_url", 
                image_url: { url: `data:image/jpeg;base64,${base64}` } 
              }
            ]
          }
        ],
        // Não usamos stream: true aqui para recebermos o JSON de uma vez só
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("FALHA NA GROQ:", data);
      throw new Error(data.error?.message || "Erro na Groq");
    }

    const content = data.choices[0].message.content;
    console.log("✅ Resposta da Groq:", content);
    
    return JSON.parse(content);

  } catch (error) {
    console.error("❌ Erro no aiService (Groq):", error);
    return {
      severity: '-',
      disease: 'Erro na análise',
      confidence: '-',
      recommendation: 'Falha ao conectar com a API da Groq. Verifique sua chave ou conexão.'
    };
  }
}