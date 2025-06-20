import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  AlertCircle, 
  BookOpen, 
  Target, 
  Zap,
  Lightbulb,
  PenTool
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface WritingAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WritingAnalysis {
  readabilityScore: number;
  academicTone: number;
  clarity: number;
  suggestions: WritingSuggestion[];
  statistics: TextStatistics;
}

interface WritingSuggestion {
  type: 'grammar' | 'style' | 'academic' | 'clarity' | 'structure';
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestion: string;
  position?: { start: number; end: number };
}

interface TextStatistics {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgWordsPerSentence: number;
  complexWords: number;
  passiveVoiceCount: number;
}

export default function WritingAssistant({ isOpen, onClose }: WritingAssistantProps) {
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState<WritingAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const analyzeText = async () => {
    if (!text.trim()) {
      toast({
        title: "Teks kosong",
        description: "Masukkan teks untuk dianalisis",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await apiRequest("POST", "/api/writing/analyze", { text });
      const result = await response.json();
      setAnalysis(result);
    } catch (error) {
      console.error("Error analyzing text:", error);
      toast({
        title: "Gagal menganalisis",
        description: "Terjadi kesalahan saat menganalisis teks",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'grammar': return <PenTool className="h-4 w-4" />;
      case 'style': return <Target className="h-4 w-4" />;
      case 'academic': return <BookOpen className="h-4 w-4" />;
      case 'clarity': return <Lightbulb className="h-4 w-4" />;
      case 'structure': return <Zap className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            Academic Writing Assistant
          </h2>
          <Button variant="ghost" onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Masukkan Teks untuk Dianalisis
                </label>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Tuliskan atau tempelkan teks akademik Anda di sini..."
                  className="min-h-[300px] resize-none border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>
              
              <Button 
                onClick={analyzeText}
                disabled={isAnalyzing || !text.trim()}
                className="w-full gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Menganalisis...
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4" />
                    Analisis Teks
                  </>
                )}
              </Button>
            </div>

            {/* Analysis Results */}
            <div className="space-y-4">
              {analysis && (
                <>
                  {/* Scores */}
                  <Card className="p-4 bg-white border border-gray-200 shadow-sm">
                    <h3 className="font-semibold mb-3 text-gray-900">Skor Akademik</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className={`text-2xl font-bold ${getScoreColor(analysis.readabilityScore)}`}>
                          {analysis.readabilityScore}
                        </div>
                        <div className="text-xs text-muted-foreground">Keterbacaan</div>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${getScoreColor(analysis.academicTone)}`}>
                          {analysis.academicTone}
                        </div>
                        <div className="text-xs text-muted-foreground">Tone Akademik</div>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${getScoreColor(analysis.clarity)}`}>
                          {analysis.clarity}
                        </div>
                        <div className="text-xs text-muted-foreground">Kejelasan</div>
                      </div>
                    </div>
                  </Card>

                  {/* Statistics */}
                  <Card className="p-4 bg-white border border-gray-200 shadow-sm">
                    <h3 className="font-semibold mb-3 text-gray-900">Statistik Teks</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span>Kata:</span>
                        <span className="font-medium">{analysis.statistics.wordCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Kalimat:</span>
                        <span className="font-medium">{analysis.statistics.sentenceCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Paragraf:</span>
                        <span className="font-medium">{analysis.statistics.paragraphCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rata-rata kata/kalimat:</span>
                        <span className="font-medium">{analysis.statistics.avgWordsPerSentence.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Kata kompleks:</span>
                        <span className="font-medium">{analysis.statistics.complexWords}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Kalimat pasif:</span>
                        <span className="font-medium">{analysis.statistics.passiveVoiceCount}</span>
                      </div>
                    </div>
                  </Card>

                  {/* Suggestions */}
                  <Card className="p-4 bg-white border border-gray-200 shadow-sm">
                    <h3 className="font-semibold mb-3 text-gray-900">
                      Saran Perbaikan ({analysis.suggestions.length})
                    </h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {analysis.suggestions.map((suggestion, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5">
                              {getTypeIcon(suggestion.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge 
                                  variant="outline" 
                                  className={getSeverityColor(suggestion.severity)}
                                >
                                  {suggestion.severity === 'high' ? 'Tinggi' : 
                                   suggestion.severity === 'medium' ? 'Sedang' : 'Rendah'}
                                </Badge>
                                <span className="text-xs text-muted-foreground capitalize">
                                  {suggestion.type}
                                </span>
                              </div>
                              <div className="text-sm font-medium mb-1">
                                {suggestion.message}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {suggestion.suggestion}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {analysis.suggestions.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                          <p>Teks Anda sudah sangat baik!</p>
                          <p className="text-sm">Tidak ada saran perbaikan yang signifikan.</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </>
              )}

              {!analysis && (
                <Card className="p-8 text-center bg-white border border-gray-200 shadow-sm">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">
                    Masukkan teks dan klik "Analisis Teks" untuk mendapatkan saran penulisan akademik
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}