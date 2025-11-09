'use client';

import { useState } from 'react';
import { ResultsPanelProps, Combination } from '@/types/mark6';
import NumberBall from './NumberBall';
import { labels } from '@/lib/i18n';

export default function ResultsPanel({
  combinations,
  generationId,
  drawResults,
  onCheckDrawResults,
  language,
}: ResultsPanelProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');

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

  const renderCombination = (combination: Combination, index: number) => {
    const numbers = combination.combination_numbers;
    const isDouble = combination.is_double;

    return (
      <div key={combination.id} className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-gray-600 w-6 text-right">
          {index + 1})
        </span>
        <div className="flex items-center gap-1">
          {numbers.map((number, idx) => {
            let highlight: 'winning' | 'special' | 'none' = 'none';
            
            if (drawResults) {
              if (drawResults.winning_numbers.includes(number)) {
                highlight = 'winning';
              } else if (drawResults.special_number === number) {
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
                    size="sm"
                    highlight={highlight}
                  />
                </div>
              );
            }

            return (
              <NumberBall
                key={`${combination.id}-${idx}`}
                number={number}
                size="sm"
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
          {labels[language].draw_results} - {drawResults.date_text}
        </h3>
        <div className="flex items-center gap-2 mb-4">
          {drawResults.winning_numbers.map((number, index) => (
            <NumberBall
              key={`winning-${index}`}
              number={number}
              size="md"
              highlight="winning"
            />
          ))}
          <span className="mx-2 text-xl font-bold text-gray-600">+</span>
          <NumberBall
            number={drawResults.special_number}
            size="md"
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
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{labels[language].results_records}</h2>
        <p className="text-gray-600">{labels[language].view_generated_combinations}</p>
      </div>

      {/* Combinations Section */}
      <div className="grow mb-6">
        {combinations.length > 0 ? (
          <div>
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {labels[language].generation_id} {generationId}
              </h3>
              <p className="text-sm text-gray-600">
                {combinations.length} {labels[language].combinations_generated}
              </p>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {combinations.map((combination, index) => 
                renderCombination(combination, index)
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🎯</div>
            <p className="text-gray-500">{labels[language].no_combinations_generated}</p>
            <p className="text-sm text-gray-400 mt-2">
              {labels[language].generate_some_combinations}
            </p>
          </div>
        )}
      </div>

      {/* Draw Results Check */}
      <div className="space-y-4 border-t pt-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {labels[language].check_draw_results}
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={formatDateForInput(new Date())}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleCheckDrawResults}
              className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors font-medium"
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
                    `${index + 1}. ${comb.combination_numbers.join(', ')}`
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
                  combinations: combinations.map(comb => comb.combination_numbers)
                };
                const base64Data = btoa(JSON.stringify(shareData));
                const shareUrl = `${window.location.origin}?data=${base64Data}`;
                navigator.clipboard.writeText(shareUrl);
                alert(labels[language].share_link_copied_to_clipboard);
              }}
              className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              {labels[language].share}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}