import OpenAI from "openai";
import { 
  enhanceWithIndonesianAcademicContext, 
  generateIndonesianResearchQuestions,
  generateIndonesianKeywords,
  INDONESIAN_ACADEMIC_CONTEXT_ENHANCER 
} from "./indonesian-academic-prompts";
import { storage } from "./storage";

// Using free model that supports basic features
const DEFAULT_MODEL = "meta-llama/llama-3.2-3b-instruct:free";

async function getOpenRouterKey(): Promise<string> {
  // Priority 1: Database setting (secure and admin-configurable)
  try {
    const setting = await storage.getSystemSetting("api_keys", "openrouter_api_key");
    if (setting?.value && setting.value !== "configured" && setting.value.trim()) {
      return setting.value;
    }
  } catch (error) {
    console.error("Error getting system setting for OpenRouter key:", error);
  }
  
  // Priority 2: Admin settings as fallback
  try {
    const setting = await storage.getAdminSetting("openrouter_key");
    if (setting?.value && setting.value !== "configured" && setting.value.trim()) {
      return setting.value;
    }
  } catch (error) {
    console.error("Admin settings not available:", error);
  }
  
  // Priority 3: Environment variable as last resort
  if (process.env.OPENROUTER_API_KEY) {
    return process.env.OPENROUTER_API_KEY;
  }
  
  throw new Error("OpenRouter API key not configured in database. Please set it in Admin > API Keys.");
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
  mode: "riset" | "create" | "edit",
  modelId?: string
): Promise<string> {
  try {
    const openai = await getOpenRouterClient();
    
    // Get system prompt based on mode
    const systemPrompt = getSystemPrompt(mode);
    
    const response = await openai.chat.completions.create({
      model: modelId || DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "Maaf, saya tidak dapat memberikan respons saat ini.";
  } catch (error) {
    console.error("Error generating AI response:", error);
    
    // Fallback response when API is unavailable
    if (error.message?.includes("402") || error.message?.includes("credits") || error.message?.includes("404")) {
      return generateFallbackResponse(mode, messages[messages.length - 1]?.content || "");
    }
    
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
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 600,
      temperature: 0.7,
      response_format: { type: "json_object" }
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
  const basePrompt = `Anda adalah Mitra AI menggunakan Google Gemma. Berikan respons dalam bahasa Indonesia yang jelas, terstruktur, dan ringkas.`;

  switch (mode) {
    case "riset":
      return `${basePrompt}

Mode Riset - Bantu dengan:
- Analisis literatur dan metodologi penelitian
- Saran desain penelitian kualitatif/kuantitatif  
- Formulasi pertanyaan dan hipotesis penelitian
- Referensi jurnal akademik kredibel
- Interpretasi data dan temuan

Berikan jawaban terstruktur dengan subheading dan saran praktis.`;
      
    case "create":
      return `${basePrompt}

Mode Pembuatan Dokumen - Bantu dengan:
- Outline dan struktur dokumen akademik
- Penulisan bagian dokumen (abstrak, pendahuluan, metodologi, hasil, pembahasan)
- Format citation APA/MLA/IEEE
- Template sesuai standar jurnal
- Pengembangan argumen yang kuat

Pastikan konten sesuai kaidah penulisan ilmiah.`;
      
    case "edit":
      return `${basePrompt}

Mode Edit Dokumen - Bantu dengan:
- Review struktur dan alur dokumen
- Perbaikan koherensi dan clarity
- Konsistensi format dan referensi
- Saran perbaikan metodologi
- Fact-checking dan verifikasi

Berikan feedback konstruktif dan spesifik.`;
      
    default:
      return `${basePrompt} Bantu dengan tugas akademik.`;
  }
}

function generateFallbackResponse(mode: "riset" | "create" | "edit", userInput: string): string {
  const responses = {
    riset: `# Metodologi Penelitian Kualitatif

## Pengertian
Penelitian kualitatif adalah pendekatan penelitian yang bertujuan memahami fenomena sosial dari perspektif partisipan penelitian. Pendekatan ini menggunakan metode pengumpulan data non-numerik.

## Karakteristik Utama
- **Naturalistik**: Dilakukan dalam setting alami
- **Deskriptif**: Menghasilkan data deskriptif berupa kata-kata
- **Induktif**: Membangun teori dari data yang dikumpulkan
- **Holistik**: Memandang objek penelitian secara menyeluruh

## Metode Pengumpulan Data
1. **Observasi Partisipan**
2. **Wawancara Mendalam**
3. **Studi Dokumen**
4. **Focus Group Discussion**

## Langkah-langkah Penelitian
1. Identifikasi masalah
2. Studi literatur
3. Penentuan subjek penelitian
4. Pengumpulan data
5. Analisis data
6. Penarikan kesimpulan

**Catatan**: Respons ini menggunakan fallback system. Untuk analisis yang lebih mendalam, pastikan OpenRouter API key memiliki kredit yang cukup.`,

    create: `# Panduan Pembuatan Dokumen Akademik

## Struktur Dokumen Akademik
1. **Judul** - Jelas dan deskriptif
2. **Abstrak** - Ringkasan maksimal 250 kata
3. **Pendahuluan** - Latar belakang dan tujuan
4. **Tinjauan Pustaka** - Review literatur terkait
5. **Metodologi** - Cara penelitian dilakukan
6. **Hasil dan Pembahasan** - Temuan dan analisis
7. **Kesimpulan** - Ringkasan dan rekomendasi
8. **Daftar Pustaka** - Referensi yang digunakan

## Tips Penulisan
- Gunakan bahasa formal dan objektif
- Sertakan data dan fakta yang valid
- Gunakan format citation yang konsisten (APA/MLA)
- Pastikan alur logis antar bagian

**Catatan**: Untuk bantuan penulisan yang lebih spesifik, pastikan OpenRouter API tersedia.`,

    edit: `# Panduan Edit Dokumen Akademik

## Aspek yang Perlu Diedit
1. **Struktur dan Organisasi**
   - Urutan logis paragraf
   - Transisi antar bagian
   - Koherensi keseluruhan

2. **Bahasa dan Gaya**
   - Tata bahasa yang benar
   - Penggunaan istilah akademik
   - Konsistensi gaya penulisan

3. **Konten**
   - Relevansi dengan topik
   - Kedalaman analisis
   - Dukungan data dan referensi

4. **Format**
   - Konsistensi citation
   - Format heading dan subheading
   - Tabel dan gambar

## Tahap Editing
1. **Content Edit** - Substansi dan struktur
2. **Copy Edit** - Bahasa dan gaya
3. **Proofreading** - Kesalahan teknis

**Catatan**: Untuk review mendalam dokumen Anda, pastikan OpenRouter API aktif dengan kredit yang cukup.`
  };

  return responses[mode] || "Maaf, layanan AI sedang tidak tersedia. Silakan coba lagi nanti.";
}
