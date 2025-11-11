'use client';

import { useState } from 'react';
import { ResultsPanelProps, Combination } from '@/types/mark6';
import NumberBall from './NumberBall';
import DatePicker from './DatePicker';
import Select from './Select';
import { labels } from '@/lib/i18n';

export default function ResultsPanel({
  combinations,
  generationId,
  drawResults,
  onCheckDrawResults,
  language,
  savedGenerations,
  onLoadGeneration,
  onDeleteGeneration,
}: ResultsPanelProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedGenerationId, setSelectedGenerationId] = useState<string>('');

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleCheckDrawResults = () => {
    if (!selectedDate) {
      alert(labels[language].please_select_date);
      return;
    }
    onCheckDrawResults(selectedDate);
  };

  const handleLoadGeneration = (generationId: string) => {
    const generation = savedGenerations.find(gen => gen.generationId === generationId);
    if (generation) {
      onLoadGeneration(generation);
      setSelectedGenerationId(generationId);
    }
  };

  const handleDeleteGeneration = (generationId: string) => {
    if (confirm(labels[language].confirm_delete_generation || 'Are you sure you want to delete this generation?')) {
      onDeleteGeneration(generationId);
      setSelectedGenerationId('');
    }
  };

  const renderCombination = (combination: Combination, index: number) => {
    const numbers = combination.combinationNumbers;
    const isDouble = combination.isDouble;

    // Handle case where numbers might be undefined or null
    if (!numbers || !Array.isArray(numbers)) {
      return (
        <div key={combination.id} className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-gray-600 w-6 text-right">
            {index + 1})
          </span>
          <div className="text-red-500 text-sm">
            Invalid combination data
          </div>
        </div>
      );
    }

    return (
      <div key={combination.id} className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-gray-600 w-6 text-right">
          {index + 1})
        </span>
        <div className="flex items-center gap-1">
          {numbers.map((number, idx) => {
            let highlight: 'winning' | 'special' | 'none' = 'none';

            if (drawResults) {
              if (drawResults.winningNumbers.includes(number)) {
                highlight = 'winning';
              } else if (drawResults.specialNumber === number) {
                highlight = 'special';
              }
            }

            // Add separator for double combinations
            if (isDouble && idx === 5) {
              return (
                <div key={`${combination.id}-${idx}`} className="flex items-center">
                  <span className="mx-1 text-gray-400 font-bold">+</span>
                  <NumberBall
                    number={number}
                    size="md"
                    highlight={highlight}
                  />
                </div>
              );
            }

            return (
              <NumberBall
                key={`${combination.id}-${idx}`}
                number={number}
                size="md"
                highlight={highlight}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const renderDrawResults = () => {
    if (!drawResults) return null;

    return (
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          {labels[language].draw_results} - {drawResults.dateText}
        </h3>
        <div className="flex items-center gap-2 mb-4">
          {drawResults.winningNumbers?.map((number: number, index: number) => (
            <NumberBall
              key={`winning-${index}`}
              number={number}
              size="lg"
              highlight="winning"
            />
          ))}
          <span className="mx-2 text-xl font-bold text-gray-600">+</span>
          <NumberBall
            number={drawResults.specialNumber}
            size="lg"
            highlight="special"
          />
        </div>

        {combinations.length > 0 && (
          <div className="text-sm text-gray-600">
            <p>{labels[language].matching_numbers_highlighted}</p>
            <p className="mt-1">
              <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-1"></span>
              {labels[language].winning_numbers}
              <span className="inline-block w-3 h-3 bg-gray-400 rounded-full mx-3 mr-1 ml-4"></span>
              {labels[language].special_number}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-2xl p-6 border border-white/20 h-full flex flex-col">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{labels[language].results_records}</h2>
        <p className="text-gray-600">{labels[language].view_generated_combinations}</p>
      </div>

      {/* Combinations Section */}
      <div className="flex-1 min-h-0">
        {combinations.length > 0 ? (
          <div className="h-full flex flex-col">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {labels[language].generation_id} {generationId}
              </h3>
              <p className="text-sm text-gray-600">
                {combinations.length} {labels[language].combinations_generated}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col items-center my-3">
                {combinations.map((combination, index) =>
                  renderCombination(combination, index)
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">🎯</div>
              <p className="text-gray-500">{labels[language].no_combinations_generated}</p>
              <p className="text-sm text-gray-400 mt-2">
                {labels[language].generate_some_combinations}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Saved Generations */}
      <div className="space-y-4 pt-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {labels[language].saved_generations || 'Saved Generations'}
          </label>
          <div className="flex gap-2">
            <Select
              options={[
                { value: '', label: labels[language].select_saved_record || 'Select saved record...' },
                ...savedGenerations.map((generation) => ({
                  value: generation.generationId,
                  label: `${generation.generationId} - ${new Date(generation.createdAt).toLocaleString()}`
                }))
              ]}
              value={selectedGenerationId}
              onChange={(value) => handleLoadGeneration(value as string)}
              placeholder={labels[language].select_saved_record || 'Select saved record...'}
              className="flex-1"
            />
            <button
              onClick={() => handleDeleteGeneration(selectedGenerationId)}
              disabled={!selectedGenerationId}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {labels[language].delete || 'Delete'}
            </button>
          </div>
        </div>
      </div>

      {/* Draw Results Check */}
      <div className="space-y-4 pt-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {labels[language].check_draw_results}
          </label>
          <div className="flex gap-2">
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              maxDate={formatDateForInput(new Date())}
              language={language}
              placeholder={labels[language].select_draw_date}
              className="flex-1"
            />
            <button
              onClick={handleCheckDrawResults}
              className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors font-medium text-nowrap"
            >
              {labels[language].check}
            </button>
          </div>
        </div>

        {/* Draw Results Display */}
        {renderDrawResults()}

        {/* Action Buttons */}
        {combinations.length > 0 && (
          <div className="flex gap-2 pt-4">
            <button
              onClick={() => {
                const text = combinations
                  .map((comb, index) =>
                    `${index + 1}. ${comb.combinationNumbers?.join(', ') || 'Invalid data'}`
                  )
                  .join('\n');
                navigator.clipboard.writeText(text);
                alert(labels[language].combinations_copied);
              }}
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              {labels[language].copy_combinations}
            </button>
            <button
              onClick={() => {
                const shareData = {
                  generationId,
                  combinations: combinations.map(comb => comb.combinationNumbers || [])
                };
                const base64Data = btoa(JSON.stringify(shareData));
                const shareUrl = `${window.location.origin}?data=${base64Data}`;
                navigator.clipboard.writeText(shareUrl);
                alert(labels[language].share_link_copied_to_clipboard);
              }}
              className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors font-medium text-nowrap"
            >
              {labels[language].share}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}