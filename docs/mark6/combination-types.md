# Mark Six Combination Types

## Overview

This document defines the different combination types supported in the Mark Six lottery system.

## Combination Types

### 1. Standard Combination (6 Numbers)

- **Description**: Single combination of 6 numbers
- **Bet Cost**: $10 per combination
- **Database Storage**: `combinationNumbers = [1, 2, 3, 4, 5, 6]`
- **UI Display**: `1) 1 2 3 4 5 6`

### 2. Double Combination (7 Numbers) - "x 2"

- **Description**: Single combination of 7 numbers treated as one bet
- **Bet Cost**: $10 per combination (same as standard)
- **Database Storage**: `combinationNumbers = [1, 2, 3, 4, 5, 6, 7]`
- **UI Display**: `1) 1 2 3 4 5 6 + 7`
- **Current Implementation**:
  - Generates 7 numbers in a single array
  - Treated as one combination for prize calculation
  - Uses full prize amounts (same as standard combinations)
- **Note**: This implementation differs from traditional "x 2" partial bets

### 3. Lucky Number

- **Description**: A special number that must be included in every combination
- **Usage**: Applied to all combination types
- **Behavior**:
  - Always included in generated combinations
  - Cannot be excluded by user selection
  - Used across all generation algorithms
- **Example**: If lucky number is 7, all combinations will include number 7

## Algorithm Behavior

### Advanced Follow-on Algorithm

- **Standard Combination**: Generates 6 numbers including lucky number
- **Double Combination**: Generates 7 numbers including lucky number
- **Lucky Number Handling**:
  - If lucky number is already selected, ensures combination still has correct number count
  - Always includes lucky number in final combination

### Other Algorithms

All generation algorithms (classic, follow-on, ensemble, bayesian) follow the same pattern for combination types and lucky number inclusion.

## Database Schema

```prisma
model MarkSixGeneratedCombination {
  id                 String   @id @default(cuid())
  generationId       String
  sequenceNumber     Int
  combinationNumbers Int[]    // Array of 6 or 7 numbers
  isDouble           Boolean  @default(false) // true = 7 numbers, false = 6 numbers
  splitNumbers       Int[]    // For isDouble=true: which 2 numbers to split for partial bets
  luckyNumber        Int?     // Lucky number used in generation
  // ... other fields
}
```

## API Parameters

```typescript
interface GenerateCombinationRequest {
  generationId: string;
  combinationCount: number;
  selectedNumbers?: number[];
  luckyNumber: number;        // Must be included in all combinations
  isDouble?: boolean;         // true = 7 numbers, false = 6 numbers
  generationMethod?: string;
}
```

## Implementation Notes

### Current "x 2" Behavior

The current implementation treats "x 2" combinations as single 7-number bets rather than traditional partial bets. This means:

- **Prize Calculation**: All 7 numbers are evaluated together for prize eligibility
- **Bet Cost**: $10 per combination (same as standard 6-number combinations)
- **Scoring**: Test results show higher hit rates due to more numbers per combination

### Planned Enhancement: Split Numbers for Partial Bets

To support traditional "x 2" partial bets, the system will be enhanced with:

- **Split Numbers Field**: Store which 2 numbers should be split for partial bets
- **Statistical Selection**: Algorithms will select split numbers based on least winning probability
- **Fallback**: If split numbers are missing, use the last two numbers in the array
- **Partial Bet Logic**: Each split number creates a separate combination with the 5 common numbers

### Traditional "x 2" Concept

In traditional Mark Six betting, "x 2" refers to two partial bets:

- **Two combinations**: 5 common numbers + 1 unique number each
- **Bet Cost**: $5 × 2 = $10 total
- **Prize Amounts**: Half the standard prize for each partial bet

## Future Considerations

- **True "5 + 2" Combinations**: Two separate combinations with 5 common numbers
- **Multiple Bet Types**: Support for different betting structures
- **Enhanced UI**: Better visualization of combination types
- **Partial Bet Support**: Implement traditional "x 2" partial bet behavior
