import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  Search, 
  Brain, 
  FileText, 
  Plus, 
  Check, 
  Clock, 
  Star,
  TrendingUp,
  Users,
  Globe
} from "lucide-react";
import type { ResearchSource, ResearchQuestion, ResearchKeyword } from "@shared/schema";

interface ResearchPanelProps {
  chatId: number;
  isVisible: boolean;
}

export default function ResearchPanel({ chatId, isVisible }: ResearchPanelProps) {
  const [newQuestion, setNewQuestion] = useState("");
  const [researchTopic, setResearchTopic] = useState("");
  const { toast } = useToast();

  // Fetch research data
  const { data: sources = [] } = useQuery<ResearchSource[]>({
    queryKey: ["/api/research/sources", chatId],
    enabled: isVisible && !!chatId,
  });

  const { data: questions = [] } = useQuery<ResearchQuestion[]>({
    queryKey: ["/api/research/questions", chatId],
    enabled: isVisible && !!chatId,
  });

  const { data: keywords = [] } = useQuery<ResearchKeyword[]>({
    queryKey: ["/api/research/keywords", chatId],
    enabled: isVisible && !!chatId,
  });

  // Add research question
  const addQuestionMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await apiRequest("POST", "/api/research/questions", {
        chatId,
        question,
        category: "user-generated",
        priority: 1,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/research/questions", chatId] });
      setNewQuestion("");
      toast({
        title: "Pertanyaan Penelitian Ditambahkan",
        description: "Pertanyaan berhasil disimpan untuk analisis lebih lanjut",
      });
    },
  });

  // Generate research insights
  const generateInsightsMutation = useMutation({
    mutationFn: async (topic: string) => {
      const response = await apiRequest("POST", "/api/research/generate-insights", {
        chatId,
        topic,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/research/sources", chatId] });
      queryClient.invalidateQueries({ queryKey: ["/api/research/keywords", chatId] });
      toast({
        title: "Analisis Penelitian Dihasilkan",
        description: "Insight dan kata kunci penelitian telah diperbarui",
      });
    },
  });

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      addQuestionMutation.mutate(newQuestion);
    }
  };

  const handleGenerateInsights = () => {
    if (researchTopic.trim()) {
      generateInsightsMutation.mutate(researchTopic);
    }
  };

  const getQuestionStatusColor = (status: string) => {
    switch (status) {
      case "answered": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "researching": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getKeywordImportanceColor = (score: number) => {
    if (score >= 0.8) return "bg-red-100 text-red-800";
    if (score >= 0.6) return "bg-orange-100 text-orange-800";
    if (score >= 0.4) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  if (!isVisible) return null;

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
          <Brain className="h-5 w-5 mr-2 text-blue-600" />
          Panel Riset
        </h3>
        <p className="text-sm text-gray-600">
          Tingkatkan kualitas penelitian akademik Anda dengan fitur analisis mendalam
        </p>
      </div>

      <Tabs defaultValue="questions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="questions" className="text-xs">
            <FileText className="h-3 w-3 mr-1" />
            Pertanyaan
          </TabsTrigger>
          <TabsTrigger value="sources" className="text-xs">
            <BookOpen className="h-3 w-3 mr-1" />
            Sumber
          </TabsTrigger>
          <TabsTrigger value="keywords" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            Kata Kunci
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pertanyaan Penelitian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Tambahkan pertanyaan penelitian..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddQuestion()}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleAddQuestion}
                  disabled={!newQuestion.trim() || addQuestionMutation.isPending}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {questions.map((question) => (
                  <div key={question.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm text-gray-900 flex-1">{question.question}</p>
                      <Badge className={`text-xs ml-2 ${getQuestionStatusColor(question.status)}`}>
                        {question.status === "answered" ? "Terjawab" : 
                         question.status === "pending" ? "Menunggu" : "Diteliti"}
                      </Badge>
                    </div>
                    {question.answer && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-800">
                        <strong>Jawaban:</strong> {question.answer}
                      </div>
                    )}
                    {question.confidenceScore && (
                      <div className="mt-2 flex items-center text-xs text-gray-600">
                        <Star className="h-3 w-3 mr-1" />
                        Kepercayaan: {(Number(question.confidenceScore) * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Sumber Akademik</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Topik penelitian untuk analisis..."
                  value={researchTopic}
                  onChange={(e) => setResearchTopic(e.target.value)}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleGenerateInsights}
                  disabled={!researchTopic.trim() || generateInsightsMutation.isPending}
                >
                  <Search className="h-3 w-3" />
                </Button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {sources.map((source) => (
                  <div key={source.id} className="p-3 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-sm text-gray-900 mb-1">{source.title}</h4>
                    {source.authors && (
                      <p className="text-xs text-gray-600 mb-1">
                        <Users className="h-3 w-3 inline mr-1" />
                        {source.authors}
                      </p>
                    )}
                    {source.journal && source.year && (
                      <p className="text-xs text-gray-600 mb-2">
                        <BookOpen className="h-3 w-3 inline mr-1" />
                        {source.journal} ({source.year})
                      </p>
                    )}
                    {source.abstract && (
                      <p className="text-xs text-gray-700 mb-2 line-clamp-3">
                        {source.abstract}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Relevansi: {(Number(source.relevanceScore) * 100).toFixed(0)}%
                      </div>
                      {source.citationCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {source.citationCount} sitasi
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Kata Kunci Penelitian</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {keywords
                  .sort((a, b) => Number(b.importanceScore) - Number(a.importanceScore))
                  .map((keyword) => (
                    <Badge
                      key={keyword.id}
                      className={`text-xs ${getKeywordImportanceColor(Number(keyword.importanceScore))}`}
                    >
                      {keyword.keyword}
                      {keyword.frequency > 1 && (
                        <span className="ml-1 opacity-75">({keyword.frequency}x)</span>
                      )}
                    </Badge>
                  ))}
              </div>
              
              {keywords.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Belum ada kata kunci terdeteksi</p>
                  <p className="text-xs">Mulai percakapan untuk menganalisis kata kunci</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Research Progress */}
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Progress Penelitian</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Pertanyaan Terjawab</span>
              <span>{questions.filter(q => q.status === "answered").length}/{questions.length}</span>
            </div>
            <Progress 
              value={questions.length > 0 ? (questions.filter(q => q.status === "answered").length / questions.length) * 100 : 0} 
              className="h-2"
            />
          </div>
          
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Sumber Terkumpul</span>
              <span>{sources.length}</span>
            </div>
            <Progress 
              value={Math.min(sources.length * 10, 100)} 
              className="h-2"
            />
          </div>
          
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Kata Kunci Teridentifikasi</span>
              <span>{keywords.length}</span>
            </div>
            <Progress 
              value={Math.min(keywords.length * 5, 100)} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}