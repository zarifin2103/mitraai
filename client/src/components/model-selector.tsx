import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

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

  const getCreditColor = (credits: number) => {
    if (credits === 0) return 'bg-green-100 text-green-800';
    if (credits <= 3) return 'bg-blue-100 text-blue-800';
    if (credits <= 7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {models.map((model) => (
          <button
            key={model.modelId}
            onClick={() => onModelChange(model.modelId)}
            disabled={disabled}
            className={`p-4 border rounded-lg text-left transition-all hover:shadow-md ${
              selectedModel === model.modelId
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-gray-200 hover:border-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">{getProviderIcon(model.provider)}</span>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm leading-tight">
                    {model.displayName}
                  </h4>
                  <p className="text-xs text-gray-500">{model.provider}</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCreditColor(model.costPerMessage)}`}>
                {model.costPerMessage === 0 ? 'GRATIS' : `${model.costPerMessage} kredit`}
              </div>
            </div>
            
            {selectedModel === model.modelId && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex items-center text-xs text-primary">
                  <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                  Model Terpilih
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
      
      {selectedModelData && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getProviderIcon(selectedModelData.provider)}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Model Aktif: {selectedModelData.displayName}
              </p>
              <p className="text-xs text-blue-700">
                Biaya: {selectedModelData.costPerMessage === 0 ? 'Gratis' : `${selectedModelData.costPerMessage} kredit per pesan`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}