'use client';

import { LanguageCode, labels } from '@/lib/i18n';
import { Combination, DrawResult, SavedGeneration } from '@/types/mark6';
import { useNotification } from '@/contexts/NotificationContext';

interface ShareData {
  generationId: string;
  combinations: Array<{
    combinationNumbers: number[];
    isDouble: boolean;
    splitNumbers?: number[];
    selectedNumbers: number[];
    luckyNumber: number;
    combinationCount: number;
    generationMethod: string;
  }>;
}
import { useEffect, useState } from 'react';
import NumberSelection from './NumberSelection';
import ResultsPanel from './ResultsPanel';

interface MarkSixGeneratorProps {
  language: LanguageCode;
}

export default function MarkSixGenerator({ language }: MarkSixGeneratorProps) {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [luckyNumber, setLuckyNumber] = useState<number | null>(null);
  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [currentGenerationId, setCurrentGenerationId] = useState<string>('');
  const [drawResults, setDrawResults] = useState<DrawResult | null>(null);
  const [generationMethod, setGenerationMethod] = useState<'follow_on' | 'bayesian' | 'ensemble'>('follow_on');
  const [combinationCount, setCombinationCount] = useState<number>(4);
  const [isDouble, setIsDouble] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [savedGenerations, setSavedGenerations] = useState<SavedGeneration[]>([]);
  const { addNotification } = useNotification();

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


  // Load saved generations from localStorage on component mount
  useEffect(() => {
    const loadSavedGenerations = () => {
      try {
        const saved = localStorage.getItem('generations');
        if (saved) {
          const generationsData = JSON.parse(saved);
          console.log("generationsData", generationsData)
          // Convert from old format (object with generationId keys) to new format (array)
          if (typeof generationsData === 'object' && !Array.isArray(generationsData)) {
            const generationsArray = Object.entries(generationsData).map(([generationId, combinations]) => ({
              generationId,
              combinations: combinations as Combination[],
              selectedNumbers: [],
              luckyNumber: 0,
              combinationCount: 4,
              isDouble: false,
              generationMethod: 'follow_on' as 'follow_on' | 'bayesian' | 'ensemble',
              createdAt: new Date().toISOString(),
            }));
            setSavedGenerations(generationsArray);
            // Also update localStorage to new format
            localStorage.setItem('generations', JSON.stringify(generationsArray));
          } else {
            setSavedGenerations(generationsData);
          }
        }
      } catch (error) {
        console.error('Error loading saved generations:', error);
      }
    };

    const loadSharedData = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedData = urlParams.get('data');
        const shortId = urlParams.get('s');

        let shareData = null;

        if (shortId) {
          // Load from short URL
          try {
            const response = await fetch(`/api/share?id=${shortId}`);
            if (response.ok) {
              const result = await response.json() as { data: ShareData };
              shareData = result.data;
            }
          } catch (error) {
            console.error('Error loading from short URL:', error);
          }
        } else if (sharedData) {
          // Load from base64 data
          shareData = JSON.parse(atob(sharedData));
        }

        if (shareData && shareData.combinations && Array.isArray(shareData.combinations)) {
          console.log("Loaded shared data:", shareData);

          const generationId = shareData.generationId || generateGenerationId();
          const firstCombination = shareData.combinations[0];

          // Extract generation parameters from the first combination
          const selectedNumbers = firstCombination?.selectedNumbers || [];
          const luckyNumber = firstCombination?.luckyNumber || 0;
          const combinationCount = firstCombination?.combinationCount || 4;
          const isDouble = firstCombination?.isDouble || false;
          const generationMethod = firstCombination?.generationMethod || 'follow_on';

          setCombinations(shareData.combinations);
          setCurrentGenerationId(generationId);
          setSelectedNumbers(selectedNumbers);
          setLuckyNumber(luckyNumber || null);
          setCombinationCount(combinationCount);
          setIsDouble(isDouble);
          setGenerationMethod(generationMethod as 'follow_on' | 'bayesian' | 'ensemble');

          // Save shared combinations to localStorage
          const savedGeneration: SavedGeneration = {
            generationId,
            combinations: shareData.combinations,
            selectedNumbers,
            luckyNumber,
            combinationCount,
            isDouble,
            generationMethod: generationMethod as 'follow_on' | 'bayesian' | 'ensemble',
            createdAt: new Date().toISOString(),
          };

          const existingGenerations = savedGenerations.filter(gen => gen.generationId !== generationId);
          const updatedGenerations = [...existingGenerations, savedGeneration];
          setSavedGenerations(updatedGenerations);

          try {
            localStorage.setItem('generations', JSON.stringify(updatedGenerations));
            console.log("Saved shared generation to localStorage:", generationId);
          } catch (error) {
            console.error('Error saving shared generation to localStorage:', error);
          }

          // Clear the URL parameter after loading to avoid reloading on refresh
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
      } catch (error) {
        console.error('Error loading shared data:', error);
      }
    };

    loadSavedGenerations();
    loadSharedData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save generation to localStorage
  const saveGeneration = (combinations: Combination[]) => {
    if (!currentGenerationId || combinations.length === 0) return;

    const savedGeneration: SavedGeneration = {
      generationId: currentGenerationId,
      combinations,
      selectedNumbers,
      luckyNumber: luckyNumber!,
      combinationCount,
      isDouble,
      generationMethod,
      createdAt: new Date().toISOString(),
    };

    const updatedGenerations = [...savedGenerations, savedGeneration];
    setSavedGenerations(updatedGenerations);

    try {
      console.log("saveGeneration", updatedGenerations)
      localStorage.setItem('generations', JSON.stringify(updatedGenerations));
    } catch (error) {
      console.error('Error saving generation:', error);
    }
  };

  // Load a saved generation
  const loadGeneration = (generation: SavedGeneration) => {
    setSelectedNumbers(generation.selectedNumbers);
    setLuckyNumber(generation.luckyNumber);
    setCombinationCount(generation.combinationCount);
    setIsDouble(generation.isDouble);
    setGenerationMethod(generation.generationMethod);
    setCombinations(generation.combinations);
    setCurrentGenerationId(generation.generationId);
  };

  // Delete a saved generation
  const deleteGeneration = (generationId: string) => {
    const updatedGenerations = savedGenerations.filter(gen => gen.generationId !== generationId);
    setSavedGenerations(updatedGenerations);

    try {
      localStorage.setItem('generations', JSON.stringify(updatedGenerations));
    } catch (error) {
      console.error('Error deleting generation:', error);
    }

    // If we're currently viewing the deleted generation, clear the results
    if (currentGenerationId === generationId) {
      setCombinations([]);
      setCurrentGenerationId('');
    }
  };

  const generateCombinations = async () => {
    if (!luckyNumber) {
      addNotification(labels[language].please_select_lucky_number, 'warning');
      return;
    }

    setIsGenerating(true);
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
      console.log("saveGeneration()...", data);
      saveGeneration(data.combinations);
    } catch (error) {
      console.error('Error generating combinations:', error);
      addNotification('Failed to generate combinations. Please try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Get number suggestions
  const suggestNumbers = async (type: 'hot' | 'cold' | 'follow_on' | 'gann_square' | 'random' | 'balanced', count: number) => {
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
      addNotification(labels[language].suggestion_failed, 'error');
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
        addNotification('No draw results found for the selected date', 'warning');
      }
    } catch (error) {
      console.error('Error fetching draw results:', error);
      addNotification('Failed to fetch draw results. Please try again.', 'error');
    }
  };

  // Calculate required number count based on combination count
  const getRequiredCount = () => {
    return 6 + Math.ceil(combinationCount / 2);
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto p-4 gap-6 min-h-screen">
      {/* Ad Unit - Horizontal Banner 2025111201 */}
      {/* <div className="w-full">
        <AdUnit
          adSlot="2527138758"
          adFormat="horizontal"
          style={{ margin: '0 auto' }}
        />
      </div> */}

      <div className="flex flex-col md:flex-row w-full gap-6">
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
            isGenerating={isGenerating}
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
            savedGenerations={savedGenerations}
            onLoadGeneration={loadGeneration}
            onDeleteGeneration={deleteGeneration}
          />
        </div>
      </div>
    </div>
  );
}