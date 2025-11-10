'use client';

import { NumberSelectionProps } from '@/types/mark6';
import NumberBall from './NumberBall';
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
}: NumberSelectionProps) {
  const combinationOptions = [
    { value: 4, label: '4 x 1' },
    { value: 4, label: '4 x 2', double: true },
    { value: 8, label: '8 x 1' },
    { value: 8, label: '8 x 2', double: true },
    { value: 12, label: '12 x 1' },
    { value: 12, label: '12 x 2', double: true },
    { value: 17, label: '17 x 1' },
    { value: 17, label: '17 x 2', double: true },
  ];

  const suggestionOptions = [
    { value: 'follow_on', label: labels[language].suggest_hot_follow_on },
    { value: 'hot', label: labels[language].suggest_most_frequent },
    { value: 'cold', label: labels[language].suggest_least_frequent },
  ];

  const handleCombinationChange = (value: string) => {
    const option = combinationOptions.find(opt => opt.label === value);
    if (option) {
      onCombinationCountChange(option.value);
      onIsDoubleChange(option.double || false);
    }
  };

  const currentCombinationLabel = combinationOptions.find(
    opt => opt.value === combinationCount && opt.double === isDouble
  )?.label || '4 x 1';

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-2xl p-6 border border-white/20 h-full flex flex-col">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{labels[language].title}</h1>
        <p className="text-gray-600">{labels[language].select_your_numbers}</p>
      </div>

      {/* Generation Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {labels[language].generation_method}
        </label>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onGenerationMethodChange('v2')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              generationMethod === 'v2'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {labels[language].follow_on_logic}
          </button>
          <button
            onClick={() => onGenerationMethodChange('v1')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              generationMethod === 'v1'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {labels[language].classic_logic}
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
          {replacePlaceholders(labels[language].selected_balls, { count: selectedNumbers.length })} / {requiredCount} {labels[language].required}
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Combination Count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {labels[language].number_of_combinations}
          </label>
          <select
            value={currentCombinationLabel}
            onChange={(e) => handleCombinationChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {combinationOptions.map(option => (
              <option key={option.label} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Lucky Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {labels[language].lucky_number}
          </label>
          <select
            value={luckyNumber || ''}
            onChange={(e) => onLuckyNumberChange(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{labels[language].select_lucky_number}</option>
            {selectedNumbers
              .sort((a, b) => a - b)
              .map(num => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
          </select>
        </div>

        {/* Suggestions */}
        <div className="flex gap-2">
          <select
            id="suggestionMethod"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            {suggestionOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              const selectElement = document.getElementById('suggestionMethod');
              if (selectElement && selectElement instanceof HTMLSelectElement) {
                const suggestionMethod = selectElement.value as 'hot' | 'cold' | 'follow_on';
                onSuggestNumbers(suggestionMethod);
              }
            }}
            className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
            title="Get number suggestions"
          >
            💡
          </button>
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

        {/* Generate Button */}
        <button
          onClick={onGenerate}
          disabled={!luckyNumber || selectedNumbers.length < requiredCount}
          className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
        >
          {labels[language].generate}
        </button>
      </div>
    </div>
  );
}