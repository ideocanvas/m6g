// Mark Six Number Generation Algorithms
// Implementation based on the reference MarkSizAPI.js

import { prisma } from '@/lib/prisma';

/**
 * Generate AI prompt for standard number generation
 * Based on reference implementation from MarkSizAPI.js
 */
export async function generateLLMPrompt(
  combinationCount: number,
  selectedNumbers: number[],
  luckyNumber: number,
  isDouble: boolean,
  language: string = 'en'
): Promise<string> {
  // Get recent draw results for context
  const recentDraws = await prisma.markSixResult.findMany({
    select: {
      drawDate: true,
      winningNumbers: true,
      specialNumber: true
    },
    orderBy: { drawDate: 'desc' },
    take: 50
  });

  // Format recent results
  const formattedResults = recentDraws.map(r => {
    const main = r.winningNumbers.map(n => n.toString().padStart(2, '0'));
    const special = r.specialNumber.toString().padStart(2, '0');
    const date = new Date(r.drawDate).toLocaleDateString('en-US');
    return `${date}: ${main.join(' ')} | Special: ${special}`;
  }).join('\n');

  // Get frequency data
  const frequencyList = await getHistoricalFrequency(100, 'hot');
  const frequencyReport = frequencyList.slice(0, 15).map(n => `${n.number}(${n.frequency}x)`).join(', ');

  const prompts = {
    en: {
      title: "You are a Hong Kong Mark Six lottery expert. Your goal is to analyze historical data and generate high-potential number combinations.",
      past_results_title: "=== PAST 50 DRAW RESULTS (Most Recent First) ===",
      frequency_title: "=== TOP 15 HOTTEST NUMBERS (Last 100 Draws) ===",
      frequency_data: `Most frequent: ${frequencyReport}`,
      requirements_title: "=== USER REQUIREMENTS ===",
      combinations: `- Generate ${combinationCount} combinations.`,
      format: `- Required format: ${isDouble ? '5 main + 2 special numbers' : '6 main numbers'}.`,
      selected: selectedNumbers.length > 0 ? `- Must include these user-selected numbers: ${selectedNumbers.join(', ')}.` : '- No specific numbers were selected; please choose from the full range.',
      lucky: luckyNumber ? `- The lucky number ${luckyNumber} MUST be included in every combination.` : '- No lucky number required.',
      instructions_title: "=== INSTRUCTIONS ===",
      instructions: [
        "1. Analyze patterns in past results (e.g., hot/cold numbers, consecutive numbers, number groups).",
        "2. Heavily consider the provided number frequency data, but also include some less frequent (overdue) numbers for balance.",
        "3. Ensure all numbers are between 1-49 and are unique within each combination.",
        "4. Create combinations that look natural and avoid obvious patterns like simple arithmetic sequences.",
        "5. If special numbers are required, try to pick from a mix of hot and cold numbers.",
      ],
      output_title: "=== OUTPUT FORMAT ===",
      output_instructions: "Present the combinations in the EXACT text format below. Do not include any other explanations or text. Your response should start directly with the first line of the output.",
      output_example: isDouble ?
        `1. Main: 03, 12, 18, 25, 34 | Special: 07, 09\n2. Main: 05, 14, 19, 22, 33 | Special: 11, 16` :
        `1. 15, 16, 17, 18, 19, 20\n2. 21, 22, 23, 24, 25, 26`,
    },
    'zh-TW': {
      title: "你是一位香港六合彩專家。你的目標是分析歷史數據並生成具有高潛力的號碼組合。",
      past_results_title: "=== 最近 50 期攪珠結果 (最新在前) ===",
      frequency_title: "=== 最熱門的 15 個號碼 (最近 100 期) ===",
      frequency_data: `最常出現: ${frequencyReport}`,
      requirements_title: "=== 用戶需求 ===",
      combinations: `- 生成 ${combinationCount} 組組合。`,
      format: `- 要求格式：${isDouble ? '5個主要號碼 + 2個特別號碼' : '6個主要號碼'}。`,
      selected: selectedNumbers.length > 0 ? `- 必須包含用戶選擇的這些號碼：${selectedNumbers.join('，')}。` : '- 未選擇特定號碼，請從所有號碼中選擇。',
      lucky: luckyNumber ? `- 幸運號碼 ${luckyNumber} 必須包含在每一組組合中。` : '- 無需幸運號碼。',
      instructions_title: "=== 指示 ===",
      instructions: [
        "1. 分析過去結果的模式（例如，熱門/冷門號碼、連續號碼、號碼分組）。",
        "2. 重點考慮提供的號碼頻率數據，但也要包含一些較不頻繁（遺漏）的號碼以取得平衡。",
        "3. 確保所有號碼都在1-49之間，並且在每個組合中都是唯一的。",
        "4. 創建看起來自然的組合，避免像簡單的算術序列等明顯的模式。",
        "5. 如果需要特別號碼，嘗試從熱門和冷門號碼的混合中選擇。",
      ],
      output_title: "=== 輸出格式 ===",
      output_instructions: "請完全按照以下文本格式呈現組合。不要包含任何其他解釋或文字。你的回答應直接從輸出的第一行開始。",
      output_example: isDouble ?
        `1. Main: 03, 12, 18, 25, 34 | Special: 07, 09\n2. Main: 05, 14, 19, 22, 33 | Special: 11, 16` :
        `1. 15, 16, 17, 18, 19, 20\n2. 21, 22, 23, 24, 25, 26`,
    }
  };

  const p = prompts[language as keyof typeof prompts] || prompts['en'];

  const promptSections = [
    p.title, "", p.past_results_title, formattedResults, "", p.frequency_title, p.frequency_data, "",
    p.requirements_title, p.combinations, p.format, p.selected, p.lucky, "",
    p.instructions_title, ...p.instructions, "", p.output_title, p.output_instructions, p.output_example
  ];

  return promptSections.join('\n');
}

/**
 * Generate AI prompt for Qi Men Dun Jia number generation
 * Based on reference implementation from MarkSizAPI.js
 */
export async function generateQiMenLLMPrompt(
  combinationCount: number,
  selectedNumbers: number[],
  luckyNumber: number,
  isDouble: boolean,
  language: string = 'en'
): Promise<string> {
  const today = new Date().toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' });

  const prompts = {
    en: {
      title: "You are an AI expert in Qi Men Dun Jia (奇門遁甲) tasked with generating lucky numbers for the Hong Kong Mark Six.",
      context: `The current date and time for analysis is: ${today}. Use this to determine the auspicious elements, directions, and numbers according to the Qi Men chart of this moment.`,
      requirements_title: "=== USER REQUIREMENTS ===",
      combinations: `- Generate ${combinationCount} combinations.`,
      format: `- Required format: ${isDouble ? '5 main numbers + 2 special numbers' : '6 main numbers'}.`,
      selected: selectedNumbers.length > 0 ? `- The user has a strong affinity for these numbers, please prioritize them: ${selectedNumbers.join(', ')}.` : '- The user has not provided any specific numbers.',
      lucky: luckyNumber ? `- The number ${luckyNumber} is the user's designated lucky number and MUST be included in every single combination.` : '- No specific lucky number is required.',
      instructions_title: "=== INSTRUCTIONS ===",
      instructions: [
        "1. Analyze the Qi Men Dun Jia chart for the specified time.",
        "2. Identify the most auspicious Deities (神), Stars (星), Doors (門), and Stems (干).",
        "3. Translate these auspicious elements into corresponding numbers (e.g., based on Hetu/Luoshu numbers, stem numbers, etc.).",
        "4. Synthesize these numbers with the user's selected and lucky numbers to form powerful combinations.",
        "5. Ensure all numbers are between 1-49 and unique within each combination.",
      ],
      output_title: "=== OUTPUT FORMAT ===",
      output_instructions: "Present the combinations in the EXACT text format below. Do not include any other explanations, greetings, or text. Your response should start directly with the first combination.",
      output_example: isDouble ?
        `1. Main: 03, 12, 18, 25, 34 | Special: 07, 09\n2. Main: 05, 14, 19, 22, 33 | Special: 11, 16` :
        `1. 15, 16, 17, 18, 19, 20\n2. 21, 22, 23, 24, 25, 26`,
    },
    'zh-TW': {
      title: "你是一位精通奇門遁甲的人工智能大師，任務是為香港六合彩生成幸運號碼。",
      context: `用於分析的當前日期和時間是：${today}。請基於此時辰的奇門盤，來確定吉利方位的元素和數字。`,
      requirements_title: "=== 用戶需求 ===",
      combinations: `- 生成 ${combinationCount} 組組合。`,
      format: `- 要求格式：${isDouble ? '5個主要號碼 + 2個特別號碼' : '6個主要號碼'}。`,
      selected: selectedNumbers.length > 0 ? `- 用戶對這些號碼有強烈的偏好，請優先考慮：${selectedNumbers.join('，')}。` : '- 用戶未提供任何指定號碼。',
      lucky: luckyNumber ? `- 號碼 ${luckyNumber} 是用戶的指定幸運號碼，必須包含在每一組組合中。` : '- 沒有指定幸運號碼。',
      instructions_title: "=== 指示 ===",
      instructions: [
        "1. 請分析指定時間的奇門遁甲盤。",
        "2. 找出最吉利的神、星、門、干。",
        "3. 將這些吉利的元素轉化為相應的數字（例如，基於河圖洛書、天干地支數字等）。",
        "4. 結合用戶選擇的號碼和幸運號碼，合成強力的組合。",
        "5. 確保所有號碼都在1-49之間，並且在每組組合中都是獨一無二的。",
      ],
      output_title: "=== 輸出格式 ===",
      output_instructions: "請完全按照以下文本格式呈現組合。不要包含任何其他解釋、問候語或文字。你的回答應直接以第一組組合開始。",
      output_example: isDouble ?
        `1. Main: 03, 12, 18, 25, 34 | Special: 07, 09\n2. Main: 05, 14, 19, 22, 33 | Special: 11, 16` :
        `1. 15, 16, 17, 18, 19, 20\n2. 21, 22, 23, 24, 25, 26`,
    }
  };

  const p = prompts[language as keyof typeof prompts] || prompts['en'];

  const promptSections = [
    p.title, p.context, "", p.requirements_title, p.combinations, p.format, p.selected, p.lucky, "",
    p.instructions_title, ...p.instructions, "", p.output_title, p.output_instructions, p.output_example
  ];

  return promptSections.join('\n');
}

/**
 * Helper function to get historical frequency data
 */
async function getHistoricalFrequency(drawCount: number, analysisType: 'hot' | 'cold'): Promise<Array<{ number: number; frequency: number }>> {
  const recentDraws = await prisma.markSixResult.findMany({
    select: {
      winningNumbers: true,
      specialNumber: true
    },
    orderBy: { drawDate: 'desc' },
    take: drawCount
  });

  const frequencyMap = new Map<number, number>();
  for (let i = 1; i <= 49; i++) {
    frequencyMap.set(i, 0);
  }

  for (const draw of recentDraws) {
    for (const num of draw.winningNumbers) {
      frequencyMap.set(num, (frequencyMap.get(num) || 0) + 1);
    }
    frequencyMap.set(draw.specialNumber, (frequencyMap.get(draw.specialNumber) || 0) + 1);
  }

  const frequencyArray = Array.from(frequencyMap.entries())
    .map(([number, frequency]) => ({ number, frequency }));

  if (analysisType === 'hot') {
    frequencyArray.sort((a, b) => b.frequency - a.frequency);
  } else {
    frequencyArray.sort((a, b) => a.frequency - b.frequency);
  }

  return frequencyArray;
}