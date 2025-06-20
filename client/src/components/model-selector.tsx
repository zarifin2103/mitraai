import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

interface LlmModel {
  id: number;
  modelId: string;
  displayName: string;
  provider: string;
  costPerMessage: number;
  creditCost: number;
  isActive: boolean;
  isFree: boolean;
}

export default function ModelSelector({ selectedModel, onModelChange, disabled }: ModelSelectorProps) {
  const { data: models, isLoading, error } = useQuery<LlmModel[]>({
    queryKey: ['/api/llm-models/active'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm text-gray-600">Memuat model AI...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-sm text-red-600">
          Gagal memuat model. Silakan coba lagi.
        </div>
      </div>
    );
  }

  if (!models || models.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="text-sm text-yellow-600">
          Tidak ada model tersedia.
        </div>
      </div>
    );
  }

  const selectedModelData = models.find(m => m.modelId === selectedModel);

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'meta': return '🦙';
      case 'google': return '🔸';
      case 'microsoft': return '⚡';
      case 'deepseek': return '🧠';
      case 'qwen': return '🌟';
      case 'mistral': return '🌊';
      case 'huggingface': return '🤗';
      case 'openchat': return '💬';
      case 'nous research': return '🔬';
      case 'gryphe': return '🏛️';
      default: return '🤖';
    }
  };

  const cleanModelName = (displayName: string) => {
    return displayName.replace(/\s+(free|Free|FREE)$/i, '').trim();
  };

  const getCreditColor = (credits: number) => {
    if (credits === 0) return 'bg-green-100 text-green-800';
    if (credits <= 3) return 'bg-blue-100 text-blue-800';
    if (credits <= 7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="w-full max-w-md">
      <Select value={selectedModel} onValueChange={onModelChange} disabled={disabled}>
        <SelectTrigger className="w-full bg-white border-gray-300 text-gray-900">
          <SelectValue placeholder="Pilih Model AI">
            {selectedModelData && (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{getProviderIcon(selectedModelData.provider)}</span>
                  <span className="font-medium text-gray-900">{cleanModelName(selectedModelData.displayName)}</span>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ml-2 ${getCreditColor(selectedModelData.costPerMessage)}`}
                >
                  {selectedModelData.costPerMessage === 0 ? 'GRATIS' : `${selectedModelData.costPerMessage} kredit`}
                </Badge>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200">
          {models.map((model) => (
            <SelectItem key={model.modelId} value={model.modelId} className="py-3 hover:bg-gray-50 focus:bg-gray-50">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{getProviderIcon(model.provider)}</span>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-gray-900">{cleanModelName(model.displayName)}</span>
                    <span className="text-xs text-gray-500">{model.provider}</span>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ml-3 ${getCreditColor(model.costPerMessage)}`}
                >
                  {model.costPerMessage === 0 ? 'GRATIS' : `${model.costPerMessage} kredit`}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}