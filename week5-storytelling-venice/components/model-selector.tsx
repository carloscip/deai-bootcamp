"use client";

import type React from "react";

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  getFreeModels,
  getPaidModels,
  getModelById,
} from "@/lib/available-models";
import { useState, useEffect } from "react";

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [selectedModelInfo, setSelectedModelInfo] =
    useState<React.ReactNode | null>(null);

  const freeModels = getFreeModels();
  const paidModels = getPaidModels();

  useEffect(() => {
    const model = getModelById(value);
    if (model) {
      setSelectedModelInfo(
        <div className="mt-2 text-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">Provider:</span>
            <span>{model.provider}</span>
            {model.isFree && (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                Free
              </Badge>
            )}
          </div>
          {!model.isFree && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span>Input cost:</span>
                <span className="font-medium">
                  ${model.inputCostPer1M.toFixed(2)}/million tokens
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Output cost:</span>
                <span className="font-medium">
                  ${model.outputCostPer1M.toFixed(2)}/million tokens
                </span>
              </div>
            </div>
          )}
          <div className="mt-1 text-xs text-muted-foreground">
            {model.description}
          </div>
        </div>
      );
    } else {
      setSelectedModelInfo(null);
    }
  }, [value]);

  return (
    <FormItem>
      <FormLabel>AI Model</FormLabel>
      <Select value={value} onValueChange={onChange}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectGroup>
            <SelectLabel className="flex items-center gap-2">
              Free Models
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                $0.00
              </Badge>
            </SelectLabel>
            {freeModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name} ({model.provider})
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel className="flex items-center gap-2 mt-2">
              Paid Models
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                Per Use
              </Badge>
            </SelectLabel>
            {paidModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name} ({model.provider})
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <FormDescription>
        Select an AI model to generate your joke
      </FormDescription>
      {selectedModelInfo}
    </FormItem>
  );
}
