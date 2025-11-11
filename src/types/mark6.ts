// Type definitions for Mark Six Lottery Application

export interface Combination {
  id: string;
  generationId: string;
  sequenceNumber: number;
  combinationNumbers: number[];
  isDouble: boolean;
  splitNumbers?: number[]; // Numbers to split for partial bets (x 2 combinations)
  generationMethod: string;
  selectedNumbers: number[];
  luckyNumber: number;
  combinationCount: number;
  generatedAt: string;
  createdAt: string;
}

export interface DrawResult {
  id: string;
  drawId: string;
  drawDate: string;
  dateText: string;
  winningNumbers: number[];
  specialNumber: number;
  snowballCode?: string;
  snowballNameEn?: string;
  snowballNameCh?: string;
  totalInvestment?: number;
  jackpot?: number;
  unitBet?: number;
  estimatedPrize?: number;
  createdAt: string;
  updatedAt: string;
}

export interface NumberFrequency {
  number: number;
  frequency: number;
}

export interface FollowOnPattern {
  number: number;
  weight: number;
}

export interface GenerationParams {
  generationId: string;
  combinationCount: number;
  selectedNumbers: number[];
  luckyNumber: number;
  isDouble: boolean;
  generationMethod: 'follow_on' | 'bayesian' | 'ensemble';
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Component Props Types
export interface NumberSelectionProps {
  selectedNumbers: number[];
  luckyNumber: number | null;
  combinationCount: number;
  isDouble: boolean;
  generationMethod: 'follow_on' | 'bayesian' | 'ensemble';
  language: 'en' | 'zh-TW';
  onNumberToggle: (number: number) => void;
  onLuckyNumberChange: (number: number | null) => void;
  onCombinationCountChange: (count: number) => void;
  onIsDoubleChange: (isDouble: boolean) => void;
  onGenerationMethodChange: (method: 'follow_on' | 'bayesian' | 'ensemble') => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onSuggestNumbers: (type: 'hot' | 'cold' | 'follow_on' | 'random' | 'balanced', count: number) => void;
  onGenerate: () => void;
  requiredCount: number;
  isGenerating?: boolean;
}

export interface SavedGeneration {
  generationId: string;
  combinations: Combination[];
  selectedNumbers: number[];
  luckyNumber: number;
  combinationCount: number;
  isDouble: boolean;
  generationMethod: 'follow_on' | 'bayesian' | 'ensemble';
  createdAt: string;
}

export interface ResultsPanelProps {
  combinations: Combination[];
  generationId: string;
  drawResults: DrawResult | null;
  language: 'en' | 'zh-TW';
  onCheckDrawResults: (date: string) => void;
  savedGenerations: SavedGeneration[];
  onLoadGeneration: (generation: SavedGeneration) => void;
  onDeleteGeneration: (generationId: string) => void;
}

export interface NumberBallProps {
  number: number;
  selected?: boolean;
  onClick?: (number: number) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  highlight?: 'winning' | 'special' | 'none';
}