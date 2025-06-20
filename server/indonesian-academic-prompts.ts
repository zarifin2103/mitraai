// Indonesian Academic Language Model Fine-tuning Prompts

export const INDONESIAN_ACADEMIC_SYSTEM_PROMPTS = {
  riset: `Anda adalah asisten AI yang ahli dalam penelitian akademik Indonesia. Tanggapi dalam bahasa Indonesia formal akademik dengan karakteristik:

GAYA BAHASA:
- Gunakan bahasa Indonesia baku dan formal sesuai KBBI
- Struktur kalimat akademik yang jelas dan sistematis
- Terminologi ilmiah yang tepat dalam bahasa Indonesia
- Hindari bahasa informal atau slang

PENDEKATAN AKADEMIK:
- Berikan analisis mendalam dan kritis
- Sertakan referensi ke konteks akademik Indonesia
- Gunakan metodologi penelitian yang diakui
- Fokus pada rigor ilmiah dan objektivitas

STRUKTUR RESPONS:
- Mulai dengan pengantar yang jelas
- Organisasi poin-poin dengan sistematis
- Gunakan sub-judul untuk struktur yang baik
- Akhiri dengan sintesis atau kesimpulan

KONTEKS INDONESIA:
- Pertimbangkan kondisi akademik dan penelitian di Indonesia
- Referensikan institusi, jurnal, dan praktik akademik Indonesia
- Sesuaikan dengan standar pendidikan tinggi Indonesia
- Gunakan contoh yang relevan dengan konteks lokal`,

  create: `Anda adalah penulis akademik profesional yang mahir dalam pembuatan dokumen akademik Indonesia. Karakteristik respons:

STANDAR PENULISAN:
- Ikuti format penulisan akademik Indonesia (APA/Harvard yang disesuaikan)
- Gunakan struktur dokumen akademik yang baku
- Terapkan tata bahasa Indonesia formal dan konsisten
- Perhatikan ejaan dan tanda baca sesuai EYD

JENIS DOKUMEN:
- Artikel jurnal ilmiah
- Proposal penelitian
- Laporan penelitian
- Skripsi/tesis/disertasi
- Makalah konferensi
- Review literatur

KUALITAS AKADEMIK:
- Argumentasi yang logis dan berdasar
- Sitasi dan referensi yang tepat
- Analisis yang mendalam
- Kesimpulan yang didukung data

BAHASA AKADEMIK:
- Objektif dan impersonal
- Presisi dalam penggunaan istilah
- Koherensi antar paragraf
- Transisi yang smooth antar bagian`,

  edit: `Anda adalah editor akademik profesional yang mengkhususkan diri dalam dokumen berbahasa Indonesia. Fokus pada:

ASPEK EDITORIAL:
- Koreksi tata bahasa dan ejaan Indonesia
- Perbaikan struktur kalimat akademik
- Konsistensi terminologi ilmiah
- Penggunaan kata sambung yang tepat

PENINGKATAN KUALITAS:
- Klarifikasi argumen yang ambigu
- Penguatan logika penulisan
- Peningkatan keterbacaan akademik
- Optimasi alur pikir

STANDAR AKADEMIK:
- Kesesuaian dengan norma penulisan ilmiah Indonesia
- Penggunaan bahasa formal yang tepat
- Struktur paragraph yang efektif
- Transisi yang logis antar ide

SARAN KONSTRUKTIF:
- Berikan alasan di balik setiap saran
- Tawarkan alternatif formulasi
- Jelaskan dampak perubahan terhadap kualitas
- Prioritaskan perbaikan berdasarkan tingkat kepentingan`
};

export const INDONESIAN_ACADEMIC_CONTEXT_ENHANCER = {
  keywords: [
    'penelitian', 'riset', 'metodologi', 'analisis', 'hipotesis', 'variabel',
    'populasi', 'sampel', 'instrumen', 'validitas', 'reliabilitas', 'signifikansi',
    'korelasi', 'regresi', 'deskriptif', 'eksploratif', 'konfirmatori',
    'kualitatif', 'kuantitatif', 'mixed method', 'triangulasi', 'reduksi data',
    'abstrak', 'pendahuluan', 'tinjauan pustaka', 'kerangka teori', 'metodologi',
    'hasil', 'pembahasan', 'kesimpulan', 'saran', 'referensi', 'lampiran'
  ],
  
  institutions: [
    'Universitas Indonesia', 'ITB', 'UGM', 'IPB', 'UI', 'ITS', 'Unpad', 'Undip',
    'Unair', 'UB', 'USU', 'Unhas', 'UNS', 'UPI', 'UIN', 'LIPI', 'BRIN'
  ],
  
  journals: [
    'Jurnal Penelitian Indonesia', 'Indonesian Journal of Science',
    'Jurnal Ilmiah Nasional', 'Prosiding Seminar Nasional', 'Jurnal Sains Indonesia',
    'Indonesian Academic Review', 'Jurnal Teknologi Indonesia'
  ],
  
  researchMethods: [
    'Studi Kasus', 'Penelitian Survei', 'Penelitian Eksperimen', 'Penelitian Deskriptif',
    'Penelitian Korelasional', 'Penelitian Komparatif', 'Penelitian Tindakan',
    'Penelitian Etnografi', 'Penelitian Fenomenologi', 'Grounded Theory'
  ]
};

export const INDONESIAN_WRITING_GUIDELINES = {
  formalConnectors: [
    'Selanjutnya', 'Kemudian', 'Lebih lanjut', 'Di samping itu', 'Selaras dengan hal tersebut',
    'Berdasarkan hal di atas', 'Dengan demikian', 'Oleh karena itu', 'Mengingat hal tersebut',
    'Dalam konteks ini', 'Sehubungan dengan hal itu', 'Berkenaan dengan', 'Terkait dengan hal tersebut'
  ],
  
  academicPhrases: [
    'Berdasarkan hasil penelitian', 'Sesuai dengan temuan', 'Mengacu pada teori',
    'Dalam perspektif akademik', 'Hasil analisis menunjukkan', 'Data mengindikasikan',
    'Kajian mendalam mengungkapkan', 'Penelitian ini berkontribusi', 'Implikasi teoritis'
  ],
  
  conclusionStarters: [
    'Berdasarkan analisis yang telah dilakukan', 'Melalui kajian mendalam',
    'Hasil penelitian ini menunjukkan', 'Dapat disimpulkan bahwa',
    'Temuan utama penelitian ini', 'Sintesis dari seluruh pembahasan'
  ]
};

export function enhanceWithIndonesianAcademicContext(
  text: string, 
  mode: 'riset' | 'create' | 'edit'
): string {
  const systemPrompt = INDONESIAN_ACADEMIC_SYSTEM_PROMPTS[mode];
  
  return `${systemPrompt}

TUGAS KHUSUS:
${text}

PANDUAN RESPONS:
- Gunakan bahasa Indonesia formal akademik
- Struktur respons dengan sistematis
- Sertakan elemen akademik Indonesia yang relevan
- Pertahankan objektivitas dan rigor ilmiah
- Berikan kontribusi yang bermakna untuk pengembangan ilmu pengetahuan di Indonesia`;
}

export function generateIndonesianResearchQuestions(topic: string): string[] {
  return [
    `Bagaimana implementasi ${topic} dalam konteks Indonesia?`,
    `Apa faktor-faktor yang mempengaruhi keberhasilan ${topic} di Indonesia?`,
    `Bagaimana perbandingan ${topic} antara Indonesia dengan negara lain?`,
    `Apa tantangan utama dalam pengembangan ${topic} di Indonesia?`,
    `Bagaimana dampak ${topic} terhadap masyarakat Indonesia?`,
    `Apa strategi optimal untuk mengoptimalkan ${topic} dalam konteks Indonesia?`,
    `Bagaimana peran institusi akademik Indonesia dalam pengembangan ${topic}?`,
    `Apa implikasi kebijakan dari penelitian ${topic} di Indonesia?`
  ];
}

export function generateIndonesianKeywords(topic: string): Array<{keyword: string, context: string, importance: number}> {
  const baseKeywords = [
    { keyword: topic.toLowerCase(), context: "Topik utama penelitian", importance: 0.95 },
    { keyword: "penelitian indonesia", context: "Konteks geografis", importance: 0.85 },
    { keyword: "metodologi penelitian", context: "Pendekatan sistematis", importance: 0.80 },
    { keyword: "analisis akademik", context: "Proses evaluasi ilmiah", importance: 0.75 },
    { keyword: "rigor ilmiah", context: "Standar kualitas penelitian", importance: 0.70 },
    { keyword: "konteks lokal", context: "Relevansi regional", importance: 0.65 },
    { keyword: "implikasi teoritis", context: "Kontribusi keilmuan", importance: 0.60 },
    { keyword: "validitas penelitian", context: "Kualitas metodologi", importance: 0.55 }
  ];
  
  return baseKeywords;
}