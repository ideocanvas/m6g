// Shared TypeScript interfaces for analysis algorithms

export interface DrawRecord {
  winningNumbers: number[];
  specialNumber: number;
  drawDate?: Date;
}

export interface FollowOnResult {
  number: number;
  weight: number;
}

export interface FrequencyResult {
  number: number;
  frequency: number;
}

export interface RandomResult {
  number: number;
  random: number;
}

export interface BalancedResult {
  number: number;
  range: string;
}

export interface ClassicResult {
  combination: number[];
  sequenceNumber: number;
  score?: number;
  scoreDistribution?: Record<number, number>;
  numberDistribution?: Array<{ number: number; frequency: number }>;
}

export interface FollowOnCombinationResult {
  combination: number[];
  sequenceNumber: number;
  weights?: Map<number, number>;
}
