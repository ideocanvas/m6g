'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { NumberSelectionProps } from '@/types/mark6';
import NumberBall from './NumberBall';
import Select from './Select';
import { labels, replacePlaceholders } from '@/lib/i18n';

export default function NumberSelection({
  selectedNumbers,
  luckyNumber,
  combinationCount,
  isDouble,
  generationMethod,
  language,
  onNumberToggle,
  onLuckyNumberChange,
  onCombinationCountChange,
  onIsDoubleChange,
  onGenerationMethodChange,
  onClearSelection,
  onSelectAll,
  onSuggestNumbers,
  onGenerate,
  requiredCount,
  isGenerating = false,
}: NumberSelectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSuggestionType, setLastSuggestionType] = useState<string | null>(null);
  const [isGeneratingAIPrompt, setIsGeneratingAIPrompt] = useState(false);
  const [isGeneratingQiMenPrompt, setIsGeneratingQiMenPrompt] = useState(false);
  const [selectedSuggestionType, setSelectedSuggestionType] = useState<string>('follow_on');

  // Calculate suggestion limits based on combination option
  // Use the same calculation as requiredCount: 6 + Math.ceil(combinationCount / 2)
  // Max is one third of total slots (combinationCount × 6)
  const getSuggestionLimits = () => {
    const minCount = 1;

    // Calculate total number slots: combinationCount × 6
    const totalSlots = combinationCount * 6;
    const maxCount = Math.min(49, Math.floor(totalSlots / 3));

    // Default should be the required count, not the max
    const defaultCount = requiredCount;

    return { defaultCount, minCount, maxCount };
  };

  const { defaultCount, minCount, maxCount } = getSuggestionLimits();
  const [suggestionCount, setSuggestionCount] = useState<number>(defaultCount);

  // Update suggestion count when combination changes
  useEffect(() => {
    setSuggestionCount(defaultCount);
  }, [defaultCount]);

  // Update suggestion count when it exceeds maxCount
  useEffect(() => {
    if (suggestionCount > maxCount && maxCount > 0) {
      setSuggestionCount(maxCount);
    }
  }, [maxCount, suggestionCount]);

  const combinationOptions = [
    { id: '4-1', value: 4, label: '4x1', double: false },
    { id: '4-2', value: 4, label: '4x2', double: true },
    { id: '8-1', value: 8, label: '8x1', double: false },
    { id: '8-2', value: 8, label: '8x2', double: true },
    { id: '12-1', value: 12, label: '12x1', double: false },
    { id: '12-2', value: 12, label: '12x2', double: true },
    { id: '16-1', value: 16, label: '16x1', double: false },
    { id: '16-2', value: 16, label: '16x2', double: true },
    { id: '20-1', value: 20, label: '20x1', double: false },
    { id: '20-2', value: 20, label: '20x2', double: true },
    { id: '24-1', value: 24, label: '24x1', double: false },
    { id: '24-2', value: 24, label: '24x2', double: true },
    { id: '28-1', value: 28, label: '28x1', double: false },
    { id: '28-2', value: 28, label: '28x2', double: true },
    { id: '32-1', value: 32, label: '32x1', double: false },
    { id: '32-2', value: 32, label: '32x2', double: true },
  ];

  const suggestionOptions = [
    { value: 'follow_on', label: labels[language].suggest_hot_follow_on },
    { value: 'hot', label: labels[language].suggest_most_frequent },
    { value: 'cold', label: labels[language].suggest_least_frequent },
    { value: 'gann_square', label: labels[language].suggest_gann_square },
    { value: 'random', label: labels[language].suggest_random },
    { value: 'balanced', label: labels[language].suggest_balanced },
  ];

  const handleCombinationChange = (value: string) => {
    const option = combinationOptions.find(opt => opt.id === value);
    if (option) {
      onCombinationCountChange(option.value);
      onIsDoubleChange(option.double);
    }
  };

  const currentCombinationId = combinationOptions.find(
    opt => opt.value === combinationCount && opt.double === isDouble
  )?.id || '4-1';

  // Generate AI prompt
  const generateAIPrompt = async (promptType: 'standard' | 'qimen') => {
    if (!luckyNumber) {
      alert(labels[language].please_select_lucky_number);
      return;
    }

    if (selectedNumbers.length < requiredCount) {
      alert(replacePlaceholders(labels[language].please_select_numbers, { count: requiredCount }));
      return;
    }

    // Set loading state
    if (promptType === 'standard') {
      setIsGeneratingAIPrompt(true);
    } else {
      setIsGeneratingQiMenPrompt(true);
    }

    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          combinationCount,
          selectedNumbers,
          luckyNumber,
          isDouble,
          language,
          promptType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI prompt');
      }

      const data = await response.json() as { prompt: string };

      // Copy prompt to clipboard
      await navigator.clipboard.writeText(data.prompt);
      alert(labels[language].ai_prompt_copied || 'AI prompt copied to clipboard!');
    } catch (error) {
      console.error('Error generating AI prompt:', error);
      alert(labels[language].ai_prompt_failed || 'Failed to generate AI prompt. Please try again.');
    } finally {
      if (promptType === 'standard') {
        setIsGeneratingAIPrompt(false);
      } else {
        setIsGeneratingQiMenPrompt(false);
      }
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-2xl p-6 border border-white/20 h-full flex flex-col relative">
      {/* Header */}
      <div className="text-center mt-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{labels[language].title}</h1>
        <p className="text-gray-600">{labels[language].select_your_numbers}</p>
      </div>

      {/* Language Switch - Top Right Corner */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Link
          href="/en"
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            language === 'en'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          EN
        </Link>
        <Link
          href="/zh-TW"
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            language === 'zh-TW'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          繁
        </Link>
      </div>

      {/* Generation Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {labels[language].generation_method}
        </label>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onGenerationMethodChange('follow_on')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              generationMethod === 'follow_on'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {labels[language].follow_on_logic || 'Follow-on'}
          </button>
          <button
            onClick={() => onGenerationMethodChange('bayesian')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              generationMethod === 'bayesian'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {labels[language].bayesian_logic}
          </button>
          <button
            onClick={() => onGenerationMethodChange('ensemble')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              generationMethod === 'ensemble'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {labels[language].ensemble_logic}
          </button>
        </div>
      </div>

      {/* Number Grid */}
      <div className="grow mb-6">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {Array.from({ length: 49 }, (_, i) => i + 1).map(number => (
            <NumberBall
              key={number}
              number={number}
              selected={selectedNumbers.includes(number)}
              onClick={onNumberToggle}
              size="md"
            />
          ))}
        </div>

        <div className="text-center text-sm text-gray-600">
          {labels[language].selected_balls} {selectedNumbers.length} {replacePlaceholders(labels[language].required, { required: requiredCount, max: maxCount })}
        </div>

        {/* Remove X numbers suggestion */}
        {selectedNumbers.length > maxCount && (
          <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
            <div className="text-sm text-orange-700 mb-1">
              {replacePlaceholders(labels[language].remove_x_numbers_suggestion, {
                extra: selectedNumbers.length - maxCount,
                count: selectedNumbers.length - maxCount
              })}
            </div>
            <button
              onClick={() => {
                // Remove the extra numbers (keep only maxCount numbers)
                // Remove the last X numbers (simple approach)
                const numbersToKeep = selectedNumbers.slice(0, maxCount);

                // Clear all and re-add the numbers to keep
                onClearSelection();
                numbersToKeep.forEach(num => onNumberToggle(num));
              }}
              className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 transition-colors"
            >
              {replacePlaceholders(labels[language].remove_x_numbers, {
                count: selectedNumbers.length - maxCount
              })}
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Combination Count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {labels[language].number_of_combinations}
          </label>
          <Select
            options={combinationOptions.map(option => ({
              value: option.id,
              label: option.label,
            }))}
            value={currentCombinationId}
            onChange={(value) => handleCombinationChange(value as string)}
            placeholder={labels[language].number_of_combinations}
          />
        </div>

        {/* Lucky Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {labels[language].lucky_number}
          </label>
          <Select
            options={[
              { value: '', label: labels[language].select_lucky_number },
              ...selectedNumbers
                .sort((a, b) => a - b)
                .map(num => ({
                  value: num,
                  label: num.toString(),
                }))
            ]}
            value={luckyNumber || ''}
            onChange={(value) => onLuckyNumberChange(value ? parseInt(value as string) : null)}
            placeholder={labels[language].select_lucky_number}
            disabled={selectedNumbers.length === 0}
          />
        </div>

        {/* Suggestions */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              options={suggestionOptions.map(option => ({
                value: option.value,
                label: option.label,
              }))}
              value={selectedSuggestionType}
              onChange={(value) => {
                console.log("selectedSuggestionType", selectedSuggestionType);
                setSelectedSuggestionType(value as string);
                // Don't auto-suggest when user changes the option
              }}
              placeholder={labels[language].suggest_numbers}
              className="flex-1"
              disabled={isLoading}
            />
            <div className="flex items-center gap-2 sm:gap-1">
              <Select
                options={Array.from({ length: maxCount - minCount + 1 }, (_, i) => {
                  const value = minCount + i;
                  return {
                    value: value.toString(),
                    label: value.toString(),
                  };
                })}
                value={suggestionCount.toString()}
                onChange={(value) => {
                  if (value) {
                    setSuggestionCount(parseInt(value as string));
                  }
                }}
                placeholder={defaultCount.toString()}
                className="w-20"
                disabled={maxCount === 0 || isLoading}
              />
              <button
                onClick={async () => {
                  if (selectedSuggestionType && suggestionCount > 0) {
                    setIsLoading(true);
                    setLastSuggestionType(selectedSuggestionType);
                    try {
                      await onSuggestNumbers(
                        selectedSuggestionType as 'hot' | 'cold' | 'follow_on' | 'gann_square' | 'random' | 'balanced',
                        suggestionCount
                      );
                    } finally {
                      setIsLoading(false);
                    }
                  }
                }}
                className={`p-2 rounded-lg transition-colors w-12 flex items-center justify-center ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : suggestionCount > 0
                      ? 'bg-indigo-500 hover:bg-indigo-600'
                      : 'bg-gray-300 cursor-not-allowed'
                } text-white`}
                title={labels[language].suggest_numbers}
                disabled={isLoading || !selectedSuggestionType || suggestionCount <= 0}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  '💡'
                )}
              </button>
            </div>
          </div>

          {/* Suggestion Status */}
          {isLoading && (
            <div className="text-sm text-blue-600 text-center animate-pulse">
              {labels[language].getting_suggestions}
            </div>
          )}

          {lastSuggestionType && !isLoading && (
            <div className="text-sm text-green-600 text-center">
              {labels[language].suggestions_loaded}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onSelectAll}
            className="bg-yellow-500 text-white py-2 px-3 rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
          >
            {labels[language].select_all}
          </button>
          <button
            onClick={onClearSelection}
            className="bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
          >
            {labels[language].clear_all}
          </button>
        </div>

        {/* AI Prompt Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => generateAIPrompt('standard')}
            disabled={!luckyNumber || selectedNumbers.length < requiredCount || isGeneratingAIPrompt}
            className="bg-purple-500 text-white py-2 px-3 rounded-lg hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            {isGeneratingAIPrompt ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>🧮</span>
                <span>{labels[language].ai_prompt_button}</span>
              </>
            )}
          </button>
          <button
            onClick={() => generateAIPrompt('qimen')}
            disabled={!luckyNumber || selectedNumbers.length < requiredCount || isGeneratingQiMenPrompt}
            className="bg-teal-500 text-white py-2 px-3 rounded-lg hover:bg-teal-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            {isGeneratingQiMenPrompt ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>☯️</span>
                <span>{labels[language].qimen_ai_button}</span>
              </>
            )}
          </button>
        </div>

        {/* Separator */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs text-gray-400 px-2">{labels[language].or}</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Generate Button */}
        <button
          onClick={onGenerate}
          disabled={!luckyNumber || selectedNumbers.length < requiredCount || isGenerating}
          className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-lg flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{labels[language].generating}</span>
            </>
          ) : (
            labels[language].generate
          )}
        </button>
      </div>
    </div>
  );
}