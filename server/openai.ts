import OpenAI from "openai";
import { storage } from "./storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = "gpt-4o";

async function getOpenRouterKey(): Promise<string> {
  // Use environment variable directly
  if (process.env.OPENROUTER_API_KEY) {
    return process.env.OPENROUTER_API_KEY;
  }
  
  // Try admin settings as fallback
  try {
    const setting = await storage.getAdminSetting("openrouter_key");
    if (setting?.value && setting.value !== "configured") {
      return setting.value;
    }
  } catch (error) {
    console.error("Admin settings not available:", error);
  }
  
  throw new Error("OpenRouter API key not configured. Please contact administrator.");
}

async function getOpenRouterClient(): Promise<OpenAI> {
  const apiKey = await getOpenRouterKey();
  return new OpenAI({ 
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": process.env.REPLIT_DOMAINS || "http://localhost:5000",
      "X-Title": "Mitra AI - Academic Document Creator"
    }
  });
}

export async function generateAIResponse(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  mode: "riset" | "create" | "edit"
): Promise<string> {
  try {
    const openai = await getOpenRouterClient();
    
    // Get system prompt based on mode
    const systemPrompt = getSystemPrompt(mode);
    
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o", // OpenRouter format for model specification
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "Maaf, saya tidak dapat memberikan respons saat ini.";
  } catch (error) {
    console.error("Error generating AI response:", error);
    throw new Error("Gagal menghasilkan respons AI. Silakan coba lagi.");
  }
}

export async function generateDocumentContent(
  prompt: string,
  existingContent?: string
): Promise<{
  title: string;
  content: string;
  excerpt: string;
  wordCount: number;
  pageCount: number;
  referenceCount: number;
}> {
  try {
    const openai = await getOpenRouterClient();
    
    const systemPrompt = `Anda adalah asisten AI yang ahli dalam pembuatan dokumen akademik. 
    Tugas Anda adalah membantu membuat atau mengedit dokumen akademik yang berkualitas tinggi.
    
    Berikan respons dalam format JSON dengan struktur berikut:
    {
      "title": "Judul dokumen yang sesuai",
      "content": "Konten lengkap dokumen dalam format markdown",
      "excerpt": "Ringkasan singkat dokumen (maksimal 200 karakter)",
      "wordCount": "Perkiraan jumlah kata",
      "pageCount": "Perkiraan jumlah halaman",
      "referenceCount": "Jumlah referensi yang disertakan"
    }
    
    Pastikan dokumen mengikuti standar akademik dengan struktur yang jelas, referensi yang tepat, dan bahasa yang formal.`;

    const userPrompt = existingContent 
      ? `Edit dokumen berikut berdasarkan instruksi: ${prompt}\n\nDokumen saat ini:\n${existingContent}`
      : `Buat dokumen akademik berdasarkan permintaan: ${prompt}`;

    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o", // OpenRouter format for model specification
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000,
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      title: result.title || "Dokumen Tanpa Judul",
      content: result.content || "",
      excerpt: result.excerpt || "",
      wordCount: result.wordCount || 0,
      pageCount: result.pageCount || 1,
      referenceCount: result.referenceCount || 0,
    };
  } catch (error) {
    console.error("Error generating document content:", error);
    throw new Error("Gagal menghasilkan konten dokumen. Silakan coba lagi.");
  }
}

function getSystemPrompt(mode: "riset" | "create" | "edit"): string {
  switch (mode) {
    case "riset":
      return `Anda adalah asisten penelitian AI yang ahli dalam membantu penelitian akademik. 
      Anda dapat membantu:
      - Mencari dan menganalisis literatur terkait
      - Memberikan saran metodologi penelitian
      - Membantu mengidentifikasi gap penelitian
      - Memberikan referensi dan sumber yang relevan
      - Membantu merancang kerangka teoritis
      
      Berikan respons yang informatif, akurat, dan berbasis bukti ilmiah.`;
      
    case "create":
      return `Anda adalah asisten penulisan akademik yang membantu membuat dokumen akademik berkualitas tinggi.
      Anda dapat membantu:
      - Membuat outline dan struktur dokumen
      - Mengembangkan argumen dan analisis
      - Menyusun abstrak, pendahuluan, metodologi, hasil, dan kesimpulan
      - Memberikan saran format dan gaya penulisan akademik
      - Membantu mengintegrasikan referensi dan kutipan
      
      Pastikan semua konten mengikuti standar akademik dan etika penulisan.`;
      
    case "edit":
      return `Anda adalah editor akademik profesional yang membantu memperbaiki dan meningkatkan kualitas dokumen akademik.
      Anda dapat membantu:
      - Memperbaiki struktur dan alur argumen
      - Meningkatkan kejelasan dan kohesi tulisan
      - Memperbaiki tata bahasa dan gaya penulisan
      - Memberikan saran untuk memperkuat argumen
      - Membantu konsistensi format dan referensi
      
      Berikan saran perbaikan yang konstruktif dan spesifik.`;
      
    default:
      return "Anda adalah asisten AI yang membantu dalam pembuatan dokumen akademik.";
  }
}
