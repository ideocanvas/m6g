/**
 * Simple duplicate prevention utilities for combination generation
 * Provides minimal, lightweight duplicate detection and prevention
 */

/**
 * Generate a unique key for a combination for duplicate detection
 * @param combination Array of numbers representing a combination
 * @returns Normalized string key for comparison
 */
export function getCombinationKey(combination: number[]): string {
  return combination.sort((a, b) => a - b).join(',');
}

/**
 * Check if a combination is a duplicate in the current generation session
 * @param combination The combination to check
 * @param usedCombinations Set of already used combination keys
 * @returns True if duplicate, false if unique
 */
export function isCombinationDuplicate(
  combination: number[], 
  usedCombinations: Set<string>
): boolean {
  const key = getCombinationKey(combination);
  return usedCombinations.has(key);
}

/**
 * Generate a simple alternative combination when duplicate is detected
 * @param combinationCount Number of combinations to generate
 * @param selectedNumbers User selected numbers
 * @param luckyNumber Lucky number to include
 * @param isDouble Whether to generate double combinations
 * @param usedCombinations Set of already used combination keys
 * @param maxRetries Maximum number of retry attempts
 * @returns New unique combination or null if max retries exceeded
 */
export function generateAlternativeCombination(
  combinationCount: number,
  selectedNumbers: number[],
  luckyNumber: number,
  isDouble: boolean,
  usedCombinations: Set<string>,
  maxRetries: number = 3
): number[] | null {
  const combinationLength = isDouble ? 7 : 6;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const combination = new Set<number>();
    
    // Always include lucky number
    combination.add(luckyNumber);
    
    // Include selected numbers if provided
    const userSelectionPool = selectedNumbers.filter(n => n !== luckyNumber);
    userSelectionPool.sort(() => 0.5 - Math.random());
    
    let userPickIndex = 0;
    while (combination.size < combinationLength && userPickIndex < userSelectionPool.length) {
      combination.add(userSelectionPool[userPickIndex]);
      userPickIndex++;
    }
    
    // Fill remaining numbers with random selection
    while (combination.size < combinationLength) {
      const randomNum = Math.floor(Math.random() * 49) + 1;
      if (!combination.has(randomNum)) {
        combination.add(randomNum);
      }
    }
    
    const finalCombination = Array.from(combination).sort((a, b) => a - b);
    
    // Check if this alternative is also a duplicate
    if (!isCombinationDuplicate(finalCombination, usedCombinations)) {
      return finalCombination;
    }
  }
  
  return null; // Could not generate unique combination after max retries
}

/**
 * Create a duplicate tracker for a generation session
 * @returns Object with methods to track and check duplicates
 */
export function createDuplicateTracker() {
  const usedCombinations = new Set<string>();
  
  return {
    /**
     * Check if combination is duplicate and add it if not
     * @param combination Combination to check and track
     * @returns True if duplicate, false if unique (and now tracked)
     */
    checkAndTrack(combination: number[]): boolean {
      const key = getCombinationKey(combination);
      if (usedCombinations.has(key)) {
        return true; // Duplicate
      }
      usedCombinations.add(key);
      return false; // Unique
    },
    
    /**
     * Get the number of unique combinations tracked
     */
    getUniqueCount(): number {
      return usedCombinations.size;
    },
    
    /**
     * Clear all tracked combinations
     */
    clear(): void {
      usedCombinations.clear();
    },
    
    /**
     * Get the internal used combinations set (for advanced usage)
     */
    getUsedCombinations(): Set<string> {
      return usedCombinations;
    }
  };
}