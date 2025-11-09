'use client';

import { useState } from 'react';
import { ResultsPanelProps, Combination } from '@/types/mark6';
import NumberBall from './NumberBall';

export default function ResultsPanel({
  combinations,
  generationId,
  drawResults,
  onCheckDrawResults,
}: ResultsPanelProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleCheckDrawResults = () => {
    if (!selectedDate) {
      alert('Please select a date');
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
          Draw Results - {drawResults.date_text}
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
            <p>Matching numbers are highlighted in your combinations above.</p>
            <p className="mt-1">
              <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-1"></span>
              Winning numbers
              <span className="inline-block w-3 h-3 bg-gray-400 rounded-full mx-3 mr-1 ml-4"></span>
              Special number
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
        <h2 className="text-2xl font-bold text-gray-800">Results & Records</h2>
        <p className="text-gray-600">View generated combinations and check results</p>
      </div>

      {/* Combinations Section */}
      <div className="grow mb-6">
        {combinations.length > 0 ? (
          <div>
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Generation ID: {generationId}
              </h3>
              <p className="text-sm text-gray-600">
                {combinations.length} combination{combinations.length > 1 ? 's' : ''} generated
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
            <p className="text-gray-500">No combinations generated yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Generate some combinations to see them here
            </p>
          </div>
        )}
      </div>

      {/* Draw Results Check */}
      <div className="space-y-4 border-t pt-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Check Draw Results
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
              Check
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
                alert('Combinations copied to clipboard!');
              }}
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Copy Combinations
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
                alert('Share link copied to clipboard!');
              }}
              className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              Share
            </button>
          </div>
        )}
      </div>
    </div>
  );
}