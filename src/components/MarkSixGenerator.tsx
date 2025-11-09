'use client';

import { useState } from 'react';
import NumberSelection from './NumberSelection';
import ResultsPanel from './ResultsPanel';
import { Combination, DrawResult } from '@/types/mark6';
import { labels, LanguageCode, saveLanguagePreference } from '@/lib/i18n';

export default function MarkSixGenerator() {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [luckyNumber, setLuckyNumber] = useState<number | null>(null);
  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [currentGenerationId, setCurrentGenerationId] = useState<string>('');
  const [drawResults, setDrawResults] = useState<DrawResult | null>(null);
  const [generationMethod, setGenerationMethod] = useState<'v1' | 'v2'>('v2');
  const [combinationCount, setCombinationCount] = useState<number>(4);
  const [isDouble, setIsDouble] = useState<boolean>(false);
  const [language, setLanguage] = useState<LanguageCode>('en');

  // Generate a unique generation ID
  const generateGenerationId = () => {
    const now = new Date();
    return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
  };

  // Toggle number selection
  const toggleNumberSelection = (number: number) => {
    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      } else {
        return [...prev, number];
      }
    });
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedNumbers([]);
    setLuckyNumber(null);
  };

  // Select all numbers
  const selectAllNumbers = () => {
    const allNumbers = Array.from({ length: 49 }, (_, i) => i + 1);
    setSelectedNumbers(allNumbers);
  };

  // Generate combinations
  const handleLanguageChange = (newLanguage: LanguageCode) => {
    setLanguage(newLanguage);
    saveLanguagePreference(newLanguage);
  };

  const generateCombinations = async () => {
    if (!luckyNumber) {
      alert(labels[language].please_select_lucky_number);
      return;
    }

    const generationId = generateGenerationId();
    setCurrentGenerationId(generationId);

    try {
      const response = await fetch('/api/combinations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generationId,
          combinationCount,
          selectedNumbers,
          luckyNumber,
          isDouble,
          generationMethod,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate combinations');
      }

      const data = await response.json() as { combinations: Combination[] };
      setCombinations(data.combinations);
    } catch (error) {
      console.error('Error generating combinations:', error);
      alert('Failed to generate combinations. Please try again.');
    }
  };

  // Get number suggestions
  const suggestNumbers = async (type: 'hot' | 'cold' | 'follow_on') => {
    try {
      const response = await fetch(`/api/analysis?type=${type}&drawCount=100`);
      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }

      const data = await response.json() as { data: Array<{ number: number }> };
      const suggestedNumbers = data.data.slice(0, getRequiredCount()).map((item: { number: number }) => item.number);
      
      // Clear current selection and set suggested numbers
      setSelectedNumbers(suggestedNumbers);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      alert('Failed to get number suggestions. Please try again.');
    }
  };

  // Check draw results
  const checkDrawResults = async (date: string) => {
    try {
      const response = await fetch(`/api/draws?startDate=${date}&endDate=${date}&limit=1`);
      if (!response.ok) {
        throw new Error('Failed to fetch draw results');
      }

      const data = await response.json() as { data: DrawResult[] };
      if (data.data && data.data.length > 0) {
        setDrawResults(data.data[0]);
      } else {
        alert('No draw results found for the selected date');
      }
    } catch (error) {
      console.error('Error fetching draw results:', error);
      alert('Failed to fetch draw results. Please try again.');
    }
  };

  // Calculate required number count based on combination count
  const getRequiredCount = () => {
    return 6 + Math.ceil(combinationCount / 2);
  };

  return (
    <div className="flex flex-col md:flex-row w-full max-w-7xl mx-auto p-4 gap-6 min-h-screen">
      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-10">
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
          className="border border-gray-300 rounded-lg px-3 py-2 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="en">English</option>
          <option value="zh-TW">繁體中文</option>
        </select>
      </div>

      {/* Left Panel: Generator Controls */}
      <div className="w-full md:w-1/2">
        <NumberSelection
          selectedNumbers={selectedNumbers}
          luckyNumber={luckyNumber}
          combinationCount={combinationCount}
          isDouble={isDouble}
          generationMethod={generationMethod}
          language={language}
          onNumberToggle={toggleNumberSelection}
          onLuckyNumberChange={setLuckyNumber}
          onCombinationCountChange={setCombinationCount}
          onIsDoubleChange={setIsDouble}
          onGenerationMethodChange={setGenerationMethod}
          onClearSelection={clearSelection}
          onSelectAll={selectAllNumbers}
          onSuggestNumbers={suggestNumbers}
          onGenerate={generateCombinations}
          requiredCount={getRequiredCount()}
        />
      </div>

      {/* Right Panel: Results and Records */}
      <div className="w-full md:w-1/2">
        <ResultsPanel
          combinations={combinations}
          generationId={currentGenerationId}
          drawResults={drawResults}
          language={language}
          onCheckDrawResults={checkDrawResults}
        />
      </div>
    </div>
  );
}