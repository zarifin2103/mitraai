import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Cpu, Zap } from "lucide-react";

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
  const { data: models = [], isLoading } = useQuery<LlmModel[]>({
    queryKey: ["/api/llm-models/active"],
    retry: false,
  });

  // Set default model when models are loaded
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      // Find the first free model or fallback to first model
      const defaultModel = models.find(m => m.isFree) || models[0];
      onModelChange(defaultModel.modelId);
    }
  }, [models, selectedModel, onModelChange]);

  const selectedModelData = models.find(m => m.modelId === selectedModel);

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'meta':
      case 'meta-llama':
        return '🦙';
      case 'google':
        return '🤖';
      case 'deepseek':
        return '🔮';
      case 'qwen':
        return '🌟';
      case 'anthropic':
        return '🤖';
      default:
        return '🧠';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Cpu className="h-4 w-4 animate-spin" />
        Loading models...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Cpu className="h-4 w-4" />
        AI Model
      </div>
      
      <Select value={selectedModel} onValueChange={onModelChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select AI model">
            {selectedModelData && (
              <div className="flex items-center gap-2">
                <span>{getProviderIcon(selectedModelData.provider)}</span>
                <span>{selectedModelData.displayName}</span>
                {selectedModelData.isFree && (
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Free
                  </Badge>
                )}
                {!selectedModelData.isFree && selectedModelData.costPerMessage > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {selectedModelData.costPerMessage} credits
                  </Badge>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.modelId} value={model.modelId}>
              <div className="flex items-center gap-2 w-full">
                <span>{getProviderIcon(model.provider)}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.displayName}</span>
                    {model.isFree && (
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        Free
                      </Badge>
                    )}
                    {!model.isFree && model.costPerMessage > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {model.costPerMessage} credits
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {model.provider}
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedModelData && (
        <div className="text-xs text-muted-foreground">
          {selectedModelData.isFree 
            ? "This model is completely free to use"
            : `${selectedModelData.costPerMessage} credits per message`
          }
        </div>
      )}
    </div>
  );
}