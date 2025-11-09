// Type definitions for Mark Six Lottery Application

export interface Combination {
  id: string;
  generation_id: string;
  sequence_number: number;
  combination_numbers: number[];
  is_double: boolean;
  generation_method: string;
  selected_numbers: number[];
  lucky_number: number;
  combination_count: number;
  generated_at: string;
  created_at: string;
}

export interface DrawResult {
  id: string;
  draw_id: string;
  draw_date: string;
  date_text: string;
  winning_numbers: number[];
  special_number: number;
  snowball_code?: string;
  snowball_name_en?: string;
  snowball_name_ch?: string;
  total_investment?: number;
  jackpot?: number;
  unit_bet?: number;
  estimated_prize?: number;
  created_at: string;
  updated_at: string;
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
  generationMethod: 'v1' | 'v2' | 'ai' | 'qimen';
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
  generationMethod: 'v1' | 'v2';
  language: 'en' | 'zh-TW';
  onNumberToggle: (number: number) => void;
  onLuckyNumberChange: (number: number | null) => void;
  onCombinationCountChange: (count: number) => void;
  onIsDoubleChange: (isDouble: boolean) => void;
  onGenerationMethodChange: (method: 'v1' | 'v2') => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onSuggestNumbers: (type: 'hot' | 'cold' | 'follow_on') => void;
  onGenerate: () => void;
  requiredCount: number;
}

export interface ResultsPanelProps {
  combinations: Combination[];
  generationId: string;
  drawResults: DrawResult | null;
  language: 'en' | 'zh-TW';
  onCheckDrawResults: (date: string) => void;
}

export interface NumberBallProps {
  number: number;
  selected?: boolean;
  onClick?: (number: number) => void;
  size?: 'sm' | 'md' | 'lg';
  highlight?: 'winning' | 'special' | 'none';
}