const resultMapHandler = {
    get: (target, key) => {
        if (!target.data) target.data = {};
        if (key === 'reset') {
            return () => target.data = {};
        } else if (key === 'values') {
            return () => Object.values(target.data);
        } else if (key === 'get') {
            return (key) => target.data[key];
        } else if (key === 'set') {
            return (key, value) => target.data[key] = value;
        } else {
            return target.data[key];
        }
    },
    set: (target, key, value) => {
        if (!target.data) target.data = {};
        target.data[key] = value;
    }
}

const mark6ResultMap = new Proxy({}, resultMapHandler);

const loadResultsFromDatabase = async (start) => {
    const list = await getMark6Results(start);
    for (const r of list) {
        mark6ResultMap.set(r.sid, r);
    }
}

const downloadLatestMark6Results = async () => {
    mark6ResultMap.reset();
    let initial = moment();
    let start = initial;
    logger.log('downloadPreviousAllResults()', start)
    await loadResultsFromDatabase(start.clone().subtract(30, 'days').format())
    let length = await downloadPreviousNextResults(start);
    let total = length;
    while (length > 0) {
        await api.delay(3000);
        start = start.subtract(30, 'days')
        await loadResultsFromDatabase(start.format())
        length = await downloadPreviousNextResults();
        total += length;
    }

    return total;
};

const downloadPreviousNextResults = async (initial) => {
    const days = 30;
    let start = moment().format("YYYYMMDD");
    if (mark6ResultMap.get("start") && !initial) {
        start = mark6ResultMap.get("start");
    } else if (initial) {
        start = initial.format("YYYYMMDD");
    }
    return await downloadPreviousResults(start, days, mark6ResultMap);
};

const downloadPreviousResults = async (start, days, mark6ResultMap) => {
    const date = moment(start, "YYYYMMDD");
    const sd = date.add(-days, "days").format("YYYYMMDD");
    const ed = start;

    const requestData = {
        operationName: "marksixResult",
        variables: {
            lastNDraw: null,
            startDate: sd,
            endDate: ed,
            drawType: "All"
        },
        query: `fragment lotteryDrawsFragment on LotteryDraw {
            id
            year
            no
            openDate
            closeDate
            drawDate
            status
            snowballCode
            snowballName_en
            snowballName_ch
            lotteryPool {
                sell
                status
                totalInvestment
                jackpot
                unitBet
                estimatedPrize
                derivedFirstPrizeDiv
                lotteryPrizes {
                    type
                    winningUnit
                    dividend
                }
            }
            drawResult {
                drawnNo
                xDrawnNo
            }
        }
        
        query marksixResult($lastNDraw: Int, $startDate: String, $endDate: String, $drawType: LotteryDrawType) {
            lotteryDraws(
                lastNDraw: $lastNDraw
                startDate: $startDate
                endDate: $endDate
                drawType: $drawType
            ) {
                ...lotteryDrawsFragment
            }
        }`
    };

    logger.log("downloadPreviousResults() start", sd, "end", ed);

    try {
        const response = await api.fetch('https://info.cld.hkjc.com/graphql/base/',
            'POST',
            {
                'Content-Type': 'application/json'
            },
            JSON.stringify(requestData),
            100
        );
        logger.log("response", response);
        const results = response.data.lotteryDraws;
        let count = 0;
        logger.log("data length", results.length);

        if (results.length > 0) {
            for (const r of results) {
                if (mark6ResultMap.get(r.id)) {
                    logger.log(r.id, 'already downloaded, skipped.');
                } else {
                    try {
                        await saveMark6Results(r);
                        mark6ResultMap.set(r.id, r);
                        count++;
                    } catch (error) {
                        logger.error('Error saving result:', error);
                    }
                }
            }
        }
        mark6ResultMap.set("start", sd);
        return count;
    } catch (error) {
        logger.log("error", error);
        return 0;
    }
};

const saveMark6Results = async (result) => {
    logger.log("saveMark6Results() result", result);
    const dateText = result.drawDate.substring(0, 10);
    const dateTextValue = moment.tz(dateText, 'YYYY-MM-DD', requestContext.timezone);
    const data = {
        sid: result.id,
        dateText: dateTextValue.format("DD/MM/YYYY"),
        no: result.drawResult?.drawnNo.join('+'),
        sno: result.drawResult?.xDrawnNo ? `${result.drawResult?.xDrawnNo}` : '',
        drawDate: dateTextValue.format(),
        version: 1
    };

    await api.saveFormData('CdaMarksixResults', 'master', false, data);
};

const getMark6Results = async (startDate) => {
    const list = await api.searchAll('UfxCdaMarksixResultsread-only', [{
        "key": "drawDate",
        "operator": ">=",
        "value": startDate
    }], "VdrawDate")
    return list;
}

const getMark6Result = async (dateText) => {
    const list = await api.searchAll('UfxCdaMarksixResultsread-only', [{
        "key": "dateText",
        "operator": "=",
        "value": dateText
    }], "VdrawDate")
    return list;
}

const getLast10WithFeq = async (requiredCount) => {
    let list = await getMark6Results(moment().tz(requestContext.timezone).subtract(30, 'days').format());
    if (list.length > 10) {
        list = list.slice(0, 10);
    }
    const last10Draws = [];
    for (const r of list) {
        const rows = r.no.split("+").map(no => parseInt(no, 10));
        rows.push(parseInt(r.sno, 10));
        last10Draws.push(rows);
    }

    const allNumbers = last10Draws.flat();
    const numberFrequency = allNumbers.reduce((acc, num) => {
        acc[num] = (acc[num] || 0) + 1;
        return acc;
    }, {});
    logger.info("numberFrequency", numberFrequency);
    const sortedNumbers = Object.keys(numberFrequency)
        .map(n => parseInt(n, 10))
        .sort((a, b) => numberFrequency[b] - numberFrequency[a]);

    return sortedNumbers.map(num => ({ number: num, frequency: numberFrequency[num] }));
}

const getLast10 = async (requiredCount) => {
    let list = await getMark6Results(moment().tz(requestContext.timezone).subtract(30, 'days').format());
    if (list.length > 10) {
        list = list.slice(0, 10);
    }
    const last10Draws = [];
    for (const r of list) {
        const rows = r.no.split("+").map(no => parseInt(no, 10));
        rows.push(parseInt(r.sno, 10));
        last10Draws.push(rows);
    }

    const allNumbers = last10Draws.flat();
    const numberFrequency = allNumbers.reduce((acc, num) => {
        acc[num] = (acc[num] || 0) + 1;
        return acc;
    }, {});
    logger.info("numberFrequency", numberFrequency);
    const sortedNumbers = Object.keys(numberFrequency)
        .map(n => parseInt(n, 10))
        .sort((a, b) => numberFrequency[b] - numberFrequency[a]);

    return sortedNumbers.slice(0, requiredCount);
}

const SCORE_MAP = {
    0: 0,
    0.5: 0.5,
    1: 1,
    1.5: 1.5,
    2: 2,
    2.5: 2.5,
    3: 3,
    3.5: 3.5,
    4: 4,
    4.5: 4.5,
    5: 5,
    5.5: 5.5,
    6: 6,
};

function checkScore(candidate, parsedResults) {
    let totalScore = 0;
    let frequenceFactor = 0;
    let subScoreMapping = {};
    let numberFrequency = {};

    // Calculate frequency of each number in candidate combinations
    for (const combination of candidate) {
        for (const number of combination) {
            numberFrequency[number] = (numberFrequency[number] || 0) + 1;
        }
    }

    const maxFrequency = Math.max(...Object.values(numberFrequency));

    for (const combination of candidate) {
        frequenceFactor += combination.reduce((acc, number) => acc + (1 - (numberFrequency[number] / maxFrequency)), 0) / combination.length;
    }

    for (const combination of candidate) {
        let score = 0;
        for (const result of parsedResults) {
            let subScore = 0;
            for (const number of combination) {
                if (result.nos.includes(number)) {
                    subScore += 1;
                }
            }
            if (combination.includes(result.sno)) {
                subScore += 0.5;
            }

            if (subScoreMapping[subScore]) {
                subScoreMapping[subScore] += 1;
            } else {
                subScoreMapping[subScore] = 1;
            }
            subScore = SCORE_MAP[subScore] || 0;
            score += subScore;
        }

        totalScore += score;
    }

    // Prepare number distribution
    const subNumberDistribution = Object.keys(numberFrequency).map(number => ({
        number: parseInt(number, 10),
        frequency: numberFrequency[number]
    }));

    return { totalScore, subScoreMapping, subNumberDistribution, frequenceFactor };
}

async function generateNumbers(generationId, combinationCount, selectedNumbers, luckyNumber, isDouble) {
    try {
        const pastResultsList = await getMark6Results(moment().tz(requestContext.timezone).subtract(369, 'days').format());
        const parsedResults = [];
        for (const r of pastResultsList) {
            const nos = r.no.split("+").map(no => parseInt(no, 10));
            const sno = parseInt(r.sno, 10);
            parsedResults.push({ nos, sno });
        }

        let bestCandidate = null;
        let highestScore = -1;
        let scoreDistribution = null;
        let numberDistribution = null;
        const allCandidates = [];
        let totalFrequenceFactor = 0;
        let frequenceFactors = [];

        // Generate candidates and calculate frequenceFactor
        for (let i = 0; i < 963; i++) {
            const candidate = await generateNumbersImpl(combinationCount, selectedNumbers, luckyNumber, isDouble);
            const { totalScore, subScoreMapping, subNumberDistribution, frequenceFactor } = checkScore(candidate, parsedResults);
            allCandidates.push({ candidate, totalScore, frequenceFactor, subScoreMapping, subNumberDistribution });
            totalFrequenceFactor += frequenceFactor;
            frequenceFactors.push(frequenceFactor);
        }

        // Calculate average and standard deviation of frequenceFactor
        const averageFrequenceFactor = totalFrequenceFactor / frequenceFactors.length;
        const variance = frequenceFactors.reduce((acc, ff) => acc + Math.pow(ff - averageFrequenceFactor, 2), 0) / frequenceFactors.length;
        const standardDeviation = Math.sqrt(variance);
        const threshold = averageFrequenceFactor + standardDeviation;

        // Filter candidates by frequenceFactor greater than the threshold
        const filteredCandidates = allCandidates.filter(c => c.frequenceFactor > threshold);

        // Determine the best candidate based on totalScore
        for (const { candidate, totalScore, subScoreMapping, subNumberDistribution } of filteredCandidates) {
            if (totalScore > highestScore) {
                highestScore = totalScore;
                bestCandidate = candidate;
                scoreDistribution = subScoreMapping;
                numberDistribution = subNumberDistribution;
            }
        }

        logger.info("bestCandidate", { bestCandidate, highestScore, scoreDistribution, numberDistribution });
        await saveGeneratedResults(generationId, bestCandidate);
        return bestCandidate;
    } catch (error) {
        throw AppError('Generation Failed!');
    }
}

async function generateNumbersImpl(combinationCount, selectedNumbers, luckyNumber, isDouble) {
    const generatedCombinations = [];

    for (let i = 0; i < combinationCount; i++) {
        logger.log(`Generating combination ${i + 1}`);
        let combination = [luckyNumber];

        if (selectedNumbers.length > 0) {
            while (combination.length < (isDouble ? 5 : 6)) {
                const num = selectedNumbers[Math.floor(Math.random() * selectedNumbers.length)];
                if (!combination.includes(num)) {
                    combination.push(num);
                }
            }
        } else {
            while (combination.length < (isDouble ? 5 : 6)) {
                const num = Math.floor(Math.random() * 49) + 1;
                if (!combination.includes(num)) {
                    combination.push(num);
                }
            }
        }

        combination.sort((a, b) => a - b);

        if (isDouble) {
            let combination2 = [];
            if (selectedNumbers.length > 0) {
                while (combination2.length < 2) {
                    const num = selectedNumbers[Math.floor(Math.random() * selectedNumbers.length)];
                    if (!combination.includes(num) && !combination2.includes(num)) {
                        combination2.push(num);
                    }
                }
            } else {
                while (combination2.length < 2) {
                    const num = Math.floor(Math.random() * 49) + 1;
                    if (!combination.includes(num) && !combination2.includes(num)) {
                        combination2.push(num);
                    }
                }
            }
            combination2.sort((a, b) => a - b);
            combination.push(...combination2);
        }

        generatedCombinations.push(combination);
    }

    return generatedCombinations;
}

async function generateNumbersByAI(generationId, combinationCount, selectedNumbers, luckyNumber, isDouble) {
    try {
        const systemPrompt = `You are a lottery number generator expert for Hong Kong Mark Six. 
Rules:
1. Generate ${combinationCount} combinations
2. Each combination must include the lucky number ${luckyNumber}
3. ${selectedNumbers.length > 0 ? `Prioritize these numbers: ${selectedNumbers.join(', ')}` : 'Use random numbers'}
4. Format: ${isDouble ? '5 unique base numbers + 2 unique special numbers' : '6 unique numbers (1-49)'}
5. All numbers must be between 1-49 with no duplicates
6. Output JSON array format example: [[1,2,3,4,5,6], [7,8,9,10,11,12]]`;

        const userPrompt = `Generate ${combinationCount} valid Mark Six combinations following all rules. 
Include ${luckyNumber} in every combination. 
${isDouble ? 'First 5 numbers should have good spread, last 2 special numbers' : ''}
Strictly use this JSON format without any extra text: [ [num1,...], ... ]`;

        const response = await api.fetch('https://api.kluster.ai/v1/chat/completions',
            'POST',
            {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 1d1ef305-d5bc-453a-a2a0-00dda752f7c2'
            },
            JSON.stringify({
                model: "deepseek-ai/DeepSeek-R1",
                max_completion_tokens: 4000,
                temperature: 0.6,
                top_p: 1,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ]
            }),
            5000
        );

        const content = response.choices[0].message.content;
        const generatedNumbers = JSON.parse(content.trim());

        // Validate response format
        if (!Array.isArray(generatedNumbers) ||
            generatedNumbers.length !== combinationCount ||
            generatedNumbers.some(comb => isDouble ? comb.length !== 7 : comb.length !== 6)
        ) {
            throw new Error('Invalid AI response format');
        }

        // Validate numbers
        const allNumbers = generatedNumbers.flat();
        const uniqueNumbers = new Set(allNumbers);
        if (allNumbers.some(n => n < 1 || n > 49) ||
            allNumbers.length !== uniqueNumbers.size
        ) {
            throw new Error('Invalid numbers generated');
        }

        await saveGeneratedResults(generationId, generatedNumbers);
        return generatedNumbers;

    } catch (error) {
        logger.error('AI Generation Failed:', error);
        throw AppError('AI Generation Failed!');
    }
}

async function generateLLMPrompt(combinationCount, selectedNumbers, luckyNumber, isDouble, language = 'en') {
    const pastResults = await getMark6Results(moment().tz(requestContext.timezone).subtract(369, 'days').format());
    const recentResults = pastResults.slice(0, 50).reverse();

    const formattedResults = recentResults.map(r => {
        const main = r.no.split('+').map(n => n.padStart(2, '0'));
        const special = r.sno.padStart(2, '0');
        return `${r.dateText}: ${main.join(' ')} | Special: ${special}`;
    }).join('\n');

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

    const p = prompts[language] || prompts['en'];

    const promptSections = [
        p.title, "", p.past_results_title, formattedResults, "", p.frequency_title, p.frequency_data, "",
        p.requirements_title, p.combinations, p.format, p.selected, p.lucky, "",
        p.instructions_title, ...p.instructions, "", p.output_title, p.output_instructions, p.output_example
    ];

    return promptSections.join('\n');
}

async function generateQiMenLLMPrompt(combinationCount, selectedNumbers, luckyNumber, isDouble, language = 'en') {
    const today = moment().tz(requestContext.timezone).format('YYYY-MM-DD HH:mm');

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

    const p = prompts[language] || prompts['en'];

    const promptSections = [
        p.title, p.context, "", p.requirements_title, p.combinations, p.format, p.selected, p.lucky, "",
        p.instructions_title, ...p.instructions, "", p.output_title, p.output_instructions, p.output_example
    ];

    return promptSections.join('\n');
}

const saveGeneratedResults = async (pid, results) => {
    const generateDate = moment().tz(requestContext.timezone);
    let seq = 0;
    for (const value of results) {
        let rows = [value];
        if (value.length === 7) {
            const firstFive = value.slice(0, 5);
            const lastTwo = value.slice(5);

            // Create the new arrays
            rows = [
                [...firstFive, lastTwo[0]], // First new array
                [...firstFive, lastTwo[1]]  // Second new array
            ];
        }
        for (const row of rows) {
            seq++;
            const sid = seq < 10 ? '0' + seq : '' + seq;
            const data = {
                sid: pid + '-' + sid,
                seq: seq,
                no: JSON.stringify(row),
                generateDate: generateDate.format(),
                version: 1,
            }
            logger.log('saving data', data);
            await api.saveFormData('CdaMarksixRecords', 'master', false, data);
        }
    }
    return pid;
}

const loadGeneratedResults = async (pid) => {
    try {
        const results = await api.searchAll('UfxCdaMarksixRecordsmaster', [{
            "key": "sid",
            "operator": "matches",
            "value": `${pid}-`
        }], "seq");

        const groupedResults = results.reduce((acc, result) => {
            const key = result.sid.split('-')[0];
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(JSON.parse(result.no));
            return acc;
        }, {});

        const combinations = groupedResults[pid] || [];
        const mergedCombinations = [];

        for (const combination of combinations) {
            const currentFirstFive = combination.slice(0, 5);
            const currentLast = combination.slice(5);

            if (mergedCombinations.length > 0) {
                const prevCombination = mergedCombinations[mergedCombinations.length - 1];
                const prevFirstFive = prevCombination.slice(0, 5);
                const prevLast = prevCombination.slice(5);
                const intersectedNumbers = currentFirstFive.filter(num => prevFirstFive.includes(num));

                if (intersectedNumbers.length === 5) {
                    const mergedCombination = [...prevFirstFive, ...new Set([...prevLast, ...currentLast])];
                    mergedCombinations[mergedCombinations.length - 1] = mergedCombination;
                    continue;
                }
            }
            mergedCombinations.push(combination);
        }

        return mergedCombinations;
    } catch (error) {
        logger.error('Error loading generated results:', error);
        return [];
    }
};

/**
 * Analyzes the relationship between consecutive draws to find "follow-on" number patterns.
 *
 * @param {number} daysOfHistory - The number of past days to include in the analysis.
 * @returns {Promise<Map<number, Map<number, number>>>} A map where the key is a drawn number,
 *          and the value is another map of follow-on numbers and their frequencies.
 *          Example: { 8 => { 15 => 4, 22 => 3 }, ... }
 */
async function analyzeFollowOnPatterns(daysOfHistory) {
    // Fetch results and sort them chronologically (oldest first) for sequential analysis.
    const pastResultsList = await getMark6Results(moment().tz(requestContext.timezone).subtract(daysOfHistory, 'days').format());
    const sortedResults = pastResultsList.sort((a, b) => moment(a.drawDate).unix() - moment(b.drawDate).unix());

    const followOnMap = new Map();

    for (let i = 0; i < sortedResults.length - 1; i++) {
        const currentDrawResult = sortedResults[i];
        const nextDrawResult = sortedResults[i + 1];

        const currentNumbers = currentDrawResult.no.split("+").map(no => parseInt(no, 10));
        currentNumbers.push(parseInt(currentDrawResult.sno, 10));

        const nextNumbers = nextDrawResult.no.split("+").map(no => parseInt(no, 10));
        nextNumbers.push(parseInt(nextDrawResult.sno, 10));

        for (const currentNum of currentNumbers) {
            if (!followOnMap.has(currentNum)) {
                followOnMap.set(currentNum, new Map());
            }
            const currentNumFollowers = followOnMap.get(currentNum);

            for (const nextNum of nextNumbers) {
                currentNumFollowers.set(nextNum, (currentNumFollowers.get(nextNum) || 0) + 1);
            }
        }
    }

    logger.log("Follow-on pattern analysis complete.");
    return followOnMap;
}

/**
 * Generates Mark Six combinations based on the statistical relationship between the last draw and historical next draws.
 * Includes detailed debug logging to trace the number selection process.
 *
 * @param {string} generationId - The unique ID for this generation task.
 * @param {number} combinationCount - The number of combinations to generate.
 * @param {number[]} selectedNumbers - A list of numbers the user wants to prioritize.
 * @param {number} luckyNumber - A number that must be included in every combination.
 * @param {boolean} isDouble - Whether to generate 7-number combinations (5+2).
 * @param {number} [daysOfHistory=1095] - Optional. Number of days of historical data to analyze. Defaults to 3 years.
 * @returns {Promise<number[][]>} The generated combinations.
 */
async function generateNumbersV2(generationId, combinationCount, selectedNumbers, luckyNumber, isDouble, daysOfHistory = 1095) {
    // --- Set to true to see detailed logs, false to hide them ---
    const DEBUG = true;

    if (DEBUG) {
        logger.log("--- Starting generateNumbersV2 ---");
        logger.log(`Generation ID: ${generationId}`);
        logger.log(`Combinations to Generate: ${combinationCount}`);
        logger.log(`User Selected Numbers: [${selectedNumbers.join(', ')}]`);
        logger.log(`Lucky Number: ${luckyNumber || 'None'}`);
        logger.log(`Is Double: ${isDouble}`);
        logger.log(`Analyzing History: ${daysOfHistory} days`);
        logger.log("------------------------------------");
    }

    try {
        const followOnPatterns = await analyzeFollowOnPatterns(daysOfHistory);

        const lastDrawList = await getMark6Results(moment().tz(requestContext.timezone).subtract(7, 'days').format());
        if (lastDrawList.length === 0) {
            throw new Error("Could not fetch the last Mark Six result.");
        }
        const lastDraw = lastDrawList[0];
        const lastDrawNumbers = lastDraw.no.split('+').map(n => parseInt(n, 10));
        lastDrawNumbers.push(parseInt(lastDraw.sno, 10));
        if (DEBUG) logger.log(`[DEBUG] Using last draw numbers as trigger: [${lastDrawNumbers.join(', ')}]`);

        const weightedPool = new Map();
        for (const num of lastDrawNumbers) {
            if (followOnPatterns.has(num)) {
                const followers = followOnPatterns.get(num);
                followers.forEach((count, followerNum) => {
                    weightedPool.set(followerNum, (weightedPool.get(followerNum) || 0) + count);
                });
            }
        }
        
        if (DEBUG) {
            const sortedWeightedPool = Array.from(weightedPool.entries()).sort((a, b) => b[1] - a[1]);
            logger.log(`[DEBUG] Top 15 numbers in weighted pool (Number => Weight):`);
            logger.log(sortedWeightedPool.slice(0, 15).map(([num, weight]) => `${num} => ${weight}`).join(' | '));
            logger.log("------------------------------------");
        }

        const selectionArray = [];
        weightedPool.forEach((weight, num) => {
            for (let i = 0; i < weight; i++) {
                selectionArray.push(num);
            }
        });
        
        if (selectionArray.length < 49) {
             for (let i = 1; i <= 49; i++) {
                if (!weightedPool.has(i)) selectionArray.push(i);
            }
        }

        const generatedCombinations = [];
        const combinationLength = isDouble ? 7 : 6;

        for (let i = 0; i < combinationCount; i++) {
            if (DEBUG) logger.log(`\n--- Generating Combination #${i + 1} ---`);
            const combination = new Set();

            if (luckyNumber) {
                combination.add(luckyNumber);
                if (DEBUG) logger.log(`[DEBUG] Added Lucky Number: ${luckyNumber}`);
            }

            const userSelectionPool = selectedNumbers.filter(n => n !== luckyNumber);
            userSelectionPool.sort(() => 0.5 - Math.random());

            let userPickIndex = 0;
            while (combination.size < combinationLength && userPickIndex < userSelectionPool.length) {
                const selectedNum = userSelectionPool[userPickIndex];
                combination.add(selectedNum);
                if (DEBUG) logger.log(`[DEBUG] Added from User Selection: ${selectedNum}`);
                userPickIndex++;
            }

            let attempts = 0;
            while (combination.size < combinationLength && attempts < 500) {
                if (selectionArray.length > 0) {
                    const randomIndex = Math.floor(Math.random() * selectionArray.length);
                    const pickedNumber = selectionArray[randomIndex];
                    if (!combination.has(pickedNumber)) {
                        combination.add(pickedNumber);
                        if (DEBUG) logger.log(`[DEBUG] Added from Weighted Pool: ${pickedNumber}`);
                    }
                } else {
                    const randomNum = Math.floor(Math.random() * 49) + 1;
                    if (!combination.has(randomNum)) {
                        combination.add(randomNum);
                         if (DEBUG) logger.log(`[DEBUG] Added from Fallback Random: ${randomNum}`);
                    }
                }
                attempts++;
            }
            
            const finalCombination = Array.from(combination);
            finalCombination.sort((a, b) => a - b);
            
            if (finalCombination.length === combinationLength) {
                generatedCombinations.push(finalCombination);
                if (DEBUG) logger.log(`[SUCCESS] Final Combination #${i + 1}: [${finalCombination.join(', ')}]`);
            } else {
                if (DEBUG) logger.warn(`[FAIL] Could not generate a valid combination of length ${combinationLength}. Current size: ${finalCombination.length}. Skipping.`);
            }
        }

        if (DEBUG) {
            logger.log("\n--- Generation Complete ---");
            logger.log(`Total combinations generated: ${generatedCombinations.length}`);
            logger.log("---------------------------\n");
        }

        await saveGeneratedResults(generationId, generatedCombinations);
        return generatedCombinations;

    } catch (error) {
        logger.error('Generation V2 Failed:', error);
        throw AppError('Generation V2 Failed!');
    }
}

async function getHotFollowOnNumbers(requiredCount, daysOfHistory = 1095) {
    logger.log(`Getting top ${requiredCount} hot follow-on numbers...`);
    const lastDrawList = await getMark6Results(moment().tz(requestContext.timezone).subtract(7, 'days').format());
    if (lastDrawList.length === 0) {
        throw new Error("Could not fetch the last Mark Six result to analyze.");
    }
    const lastDrawNumbers = lastDrawList[0].no.split('+').map(n => parseInt(n, 10));
    lastDrawNumbers.push(parseInt(lastDrawList[0].sno, 10));
    const followOnPatterns = await analyzeFollowOnPatterns(daysOfHistory);
    const weightedPool = new Map();
    for (const num of lastDrawNumbers) {
        if (followOnPatterns.has(num)) {
            const followers = followOnPatterns.get(num);
            followers.forEach((count, followerNum) => {
                weightedPool.set(followerNum, (weightedPool.get(followerNum) || 0) + count);
            });
        }
    }
    const sortedPool = Array.from(weightedPool.entries())
        .map(([number, weight]) => ({ number, weight }))
        .sort((a, b) => b.weight - a.weight);
    return sortedPool.slice(0, requiredCount);
}

async function getHistoricalFrequency(drawCount, analysisType = 'hot') {
    logger.log(`Getting ${analysisType} numbers from the last ${drawCount} draws...`);
    const daysToFetch = Math.ceil(drawCount / 3) * 7 + 7;
    const results = await getMark6Results(moment().tz(requestContext.timezone).subtract(daysToFetch, 'days').format());
    const recentResults = results.slice(0, drawCount);
    const frequencyMap = new Map();
    for (let i = 1; i <= 49; i++) {
        frequencyMap.set(i, 0);
    }
    const allNumbers = recentResults.flatMap(r => {
        const nos = r.no.split('+').map(no => parseInt(no, 10));
        nos.push(parseInt(r.sno, 10));
        return nos;
    });
    for (const num of allNumbers) {
        frequencyMap.set(num, frequencyMap.get(num) + 1);
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

async function getRecentDraws(drawCount) {
    logger.log(`Getting the last ${drawCount} draw results...`);
    const daysToFetch = Math.ceil(drawCount / 3) * 7 + 7;
    const results = await getMark6Results(moment().tz(requestContext.timezone).subtract(daysToFetch, 'days').format());
    return results.slice(0, drawCount);
}

const run = async () => {
    try {
        let rtnVal = null;
        logger.log("run", scriptKey, dataType, JSON.stringify(params));
        const action = params?.action;

        if (action === 'get_hot_follow_on') {
            const { requiredCount, daysOfHistory } = params;
            rtnVal = await getHotFollowOnNumbers(requiredCount, daysOfHistory);
        } else if (action === 'get_historical_frequency') {
            const { drawCount, analysisType } = params;
            rtnVal = await getHistoricalFrequency(drawCount, analysisType);
        } else if (action === 'get_recent_draws') {
            const { drawCount } = params;
            rtnVal = await getRecentDraws(drawCount);
        } else if (action === 'download_draws') {
            rtnVal = await downloadLatestMark6Results();
        } else if (action === 'get_result') {
            const dateText = params?.dateText;
            rtnVal = await getMark6Result(dateText);
        } else if (action === 'generate_combination_v1') {
            const { generationId, combinationCount, selectedNumbers, luckyNumber, isDouble } = params;
            rtnVal = await generateNumbers(generationId, combinationCount, selectedNumbers, luckyNumber, isDouble);
        } else if (action === 'generate_combination_v2') {
            // This is the new action handler for the V2 generator
            const { generationId, combinationCount, selectedNumbers, luckyNumber, isDouble, daysOfHistory } = params;
            rtnVal = await generateNumbersV2(generationId, combinationCount, selectedNumbers, luckyNumber, isDouble, daysOfHistory);
        } else if (action === 'generate_combination_ai') {
            const { generationId, combinationCount, selectedNumbers, luckyNumber, isDouble } = params;
            rtnVal = await generateNumbersByAI(generationId, combinationCount, selectedNumbers, luckyNumber, isDouble);
        } else if (action === 'generate_llm_prompt') {
            const { combinationCount, selectedNumbers, luckyNumber, isDouble, language } = params;
            rtnVal = await generateLLMPrompt(combinationCount, selectedNumbers, luckyNumber, isDouble, language);
        } else if (action === 'generate_qimen_llm_prompt') {
            const { combinationCount, selectedNumbers, luckyNumber, isDouble, language } = params;
            rtnVal = await generateQiMenLLMPrompt(combinationCount, selectedNumbers, luckyNumber, isDouble, language);
        } else if (action === 'load_generated_results') {
            const pid = params?.generationId;
            rtnVal = await loadGeneratedResults(pid);
        } else if (action === 'get_last_10') {
            logger.warn("The 'get_last_10' action is deprecated. Please use 'get_hot_follow_on' or 'get_historical_frequency'.");
            const requiredCount = params?.requiredCount;
            const hot_numbers = await getHistoricalFrequency(10, 'hot');
            rtnVal = hot_numbers.slice(0, requiredCount).map(item => item.number);
        }
        
        logger.log('rtnVal', JSON.stringify(rtnVal));
        resolve(rtnVal);
    } catch (error) {
        reject(error);
    }
};

run();