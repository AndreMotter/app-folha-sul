import * as FileSystem from 'expo-file-system/legacy';

// Adicionamos a tipagem que estava faltando
export type AiResult = {
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
        model: "llama-3.2-11b-vision-preview", 
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Analise esta folha de plantação. Identifique a doença ou se está saudável. Retorne APENAS um JSON: {\"disease\": \"nome\", \"confidence\": \"XX%\", \"recommendation\": \"dica curta\"}" 
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
      disease: 'Erro na análise',
      confidence: '-',
      recommendation: 'Falha ao conectar com a API da Groq. Verifique sua chave ou conexão.'
    };
  }
}