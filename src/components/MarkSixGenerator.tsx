'use client';

import { useState } from 'react';
import NumberSelection from './NumberSelection';
import ResultsPanel from './ResultsPanel';
import { Combination, DrawResult } from '@/types/mark6';
import { labels, LanguageCode } from '@/lib/i18n';

interface MarkSixGeneratorProps {
  language: LanguageCode;
}

export default function MarkSixGenerator({ language }: MarkSixGeneratorProps) {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [luckyNumber, setLuckyNumber] = useState<number | null>(null);
  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [currentGenerationId, setCurrentGenerationId] = useState<string>('');
  const [drawResults, setDrawResults] = useState<DrawResult | null>(null);
  const [generationMethod, setGenerationMethod] = useState<'v1' | 'v2'>('v2');
  const [combinationCount, setCombinationCount] = useState<number>(4);
  const [isDouble, setIsDouble] = useState<boolean>(false);

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
  const suggestNumbers = async (type: 'hot' | 'cold' | 'follow_on' | 'random' | 'balanced', count: number) => {
    try {
      let suggestedNumbers: number[] = [];

      if (type === 'random' || type === 'balanced') {
        // Generate random or balanced numbers locally
        suggestedNumbers = generateLocalSuggestions(type, count);
      } else {
        // Use API for historical analysis
        const response = await fetch(`/api/analysis?type=${type}&drawCount=100`);
        if (!response.ok) {
          throw new Error('Failed to get suggestions');
        }

        const data = await response.json() as { data: Array<{ number: number }> };
        suggestedNumbers = data.data.slice(0, count).map((item: { number: number }) => item.number);
      }

      // Add suggested numbers to current selection (don't clear existing selections)
      setSelectedNumbers(prev => {
        const combined = [...prev];
        for (const num of suggestedNumbers) {
          if (!combined.includes(num)) {
            combined.push(num);
          }
        }
        return combined;
      });
    } catch (error) {
      console.error('Error getting suggestions:', error);
      alert(labels[language].suggestion_failed);
    }
  };

  // Generate local suggestions for random and balanced types
  const generateLocalSuggestions = (type: 'random' | 'balanced', count: number): number[] => {
    const allNumbers = Array.from({ length: 49 }, (_, i) => i + 1);

    if (type === 'random') {
      // Simple random selection
      const shuffled = [...allNumbers].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count).sort((a, b) => a - b);
    } else {
      // Balanced selection - ensure numbers from different ranges
      const ranges = [
        { start: 1, end: 10 },   // 1-10
        { start: 11, end: 20 },  // 11-20
        { start: 21, end: 30 },  // 21-30
        { start: 31, end: 40 },  // 31-40
        { start: 41, end: 49 },  // 41-49
      ];

      const balancedNumbers: number[] = [];
      const numbersPerRange = Math.ceil(count / ranges.length);

      for (const range of ranges) {
        const rangeNumbers = Array.from(
          { length: range.end - range.start + 1 },
          (_, i) => range.start + i
        );
        const shuffled = [...rangeNumbers].sort(() => Math.random() - 0.5);
        balancedNumbers.push(...shuffled.slice(0, numbersPerRange));
      }

      // Take exactly the required count and sort
      return balancedNumbers.slice(0, count).sort((a, b) => a - b);
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