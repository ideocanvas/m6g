// Internationalization configuration for Mark Six Generator
// Supports English (en) and Traditional Chinese (zh-TW)

export interface LanguageLabels {
  title: string;
  select_your_numbers: string;
  selected_balls: string;
  number_of_combinations: string;
  lucky_number: string;
  select_lucky_number: string;
  generate: string;
  generating: string;
  generate_ai_prompt: string;
  record_id: string;
  select_saved_record: string;
  delete: string;
  select_draw_date: string;
  draw_number_check: string;
  draw_result: string;
  select_a_date_to_see_result: string;
  please_select_numbers: string;
  please_select_lucky_number: string;
  please_select_record: string;
  please_select_date: string;
  no_draw_on_date: string;
  share_link_copied: string;
  copy_failed: string;
  generation_method: string;
  follow_on_logic: string;
  ensemble_logic: string;
  bayesian_logic: string;
  suggest_hot_follow_on: string;
  suggest_most_frequent: string;
  suggest_least_frequent: string;
  suggest_random: string;
  suggest_balanced: string;
  suggest_gann_square: string;
  suggest_numbers: string;
  getting_suggestions: string;
  suggestions_loaded: string;
  suggestion_failed: string;
  suggest_count: string;
  will_suggest_count: string;
  no_suggestion_needed: string;
  ai_prompt_copied: string;
  ai_prompt_failed: string;
  generation_failed: string;
  required: string;
  select_all: string;
  clear_all: string;
  results_records: string;
  view_generated_combinations: string;
  generation_id: string;
  combinations_generated: string;
  no_combinations_generated: string;
  generate_some_combinations: string;
  check_draw_results: string;
  check: string;
  draw_results: string;
  matching_numbers_highlighted: string;
  winning_numbers: string;
  special_number: string;
  copy_combinations: string;
  share: string;
  combinations_copied: string;
  share_link_copied_to_clipboard: string;
  today: string;
  yesterday: string;
  last_week: string;
  last_month: string;
  select_date: string;
  calendar: string;
  quick_select: string;
  remove_x_numbers: string;
  remove_x_numbers_suggestion: string;
  extra_numbers: string;
  ai_prompt_button: string;
  qimen_ai_button: string;
  saved_generations: string;
  confirm_delete_generation: string;
  disclaimer_title: string;
  disclaimer_content: string;
  gambling_warning: string;
  no_guarantee: string;
  for_entertainment: string;
  legal_age_required: string;
  gamble_responsibly: string;
  seek_help_if_needed: string;
  or: string;
}

export type LanguageCode = 'en' | 'zh-TW';

export const labels: Record<LanguageCode, LanguageLabels> = {
  'en': {
    title: 'Mark Six Generator',
    select_your_numbers: 'Select Your Numbers',
    selected_balls: 'Selected Balls:',
    number_of_combinations: 'Combinations:',
    lucky_number: 'Lucky Number:',
    select_lucky_number: 'Select Lucky Number',
    generate: 'Generate',
    generating: 'Generating...',
    generate_ai_prompt: 'Generate AI Prompt',
    record_id: 'Record #',
    select_saved_record: 'Select Saved Record',
    delete: 'Delete',
    select_draw_date: 'Draw Date:',
    draw_number_check: 'Check Draw Result',
    draw_result: 'Draw Result',
    select_a_date_to_see_result: 'Select a date to see the result',
    please_select_numbers: 'Please select {count} numbers!',
    please_select_lucky_number: 'Please select a lucky number!',
    please_select_record: 'Please select a record.',
    please_select_date: 'Please select a date.',
    no_draw_on_date: 'No draw on {date}!',
    share_link_copied: 'Share link copied to clipboard!',
    copy_failed: 'Copy failed!',
    generation_method: 'Generation Method:',
    follow_on_logic: 'Follow-on Logic',
    ensemble_logic: 'Ensemble Logic',
    bayesian_logic: 'Bayesian Logic',
    suggest_hot_follow_on: 'Suggest: Hot Follow-on',
    suggest_most_frequent: 'Suggest: Most Frequent',
    suggest_least_frequent: 'Suggest: Least Frequent',
    suggest_random: 'Suggest: Random',
    suggest_balanced: 'Suggest: Balanced',
    suggest_gann_square: 'Suggest: Gann Square',
    suggest_numbers: 'Suggest Numbers',
    getting_suggestions: 'Getting suggestions...',
    suggestions_loaded: 'Suggestions loaded!',
    suggestion_failed: 'Suggestion failed!',
    suggest_count: 'Suggest:',
    will_suggest_count: 'Will suggest {count} numbers',
    no_suggestion_needed: 'All numbers selected',
    ai_prompt_copied: 'AI prompt copied to clipboard!',
    ai_prompt_failed: 'AI prompt generation failed.',
    generation_failed: 'Generation failed. Please try again.',
    required: 'required ({required} needed, max {max})',
    select_all: 'Select All',
    clear_all: 'Clear All',
    results_records: 'Results & Records',
    view_generated_combinations: 'View generated combinations and check results',
    generation_id: 'Generation ID:',
    combinations_generated: 'combinations generated',
    no_combinations_generated: 'No combinations generated yet',
    generate_some_combinations: 'Generate some combinations to see them here',
    check_draw_results: 'Check Draw Results',
    check: 'Check',
    draw_results: 'Draw Results',
    matching_numbers_highlighted: 'Matching numbers are highlighted in your combinations above.',
    winning_numbers: 'Winning numbers',
    special_number: 'Special number',
    copy_combinations: 'Copy Combinations',
    share: 'Share',
    combinations_copied: 'Combinations copied to clipboard!',
    share_link_copied_to_clipboard: 'Share link copied to clipboard!',
    today: 'Today',
    yesterday: 'Yesterday',
    last_week: 'Last Week',
    last_month: 'Last Month',
    select_date: 'Select Date',
    calendar: 'Calendar',
    quick_select: 'Quick Select',
    remove_x_numbers: 'Remove {count} numbers',
    remove_x_numbers_suggestion: 'You have selected {extra} extra numbers. Consider removing {count} numbers.',
    extra_numbers: '({count} extra)',
    ai_prompt_button: 'AI Prompt',
    qimen_ai_button: 'AI Prompt (QiMen)',
    saved_generations: 'Saved Generations',
    confirm_delete_generation: 'Are you sure you want to delete this generation?',
    disclaimer_title: 'Important Disclaimer',
    disclaimer_content: 'This application is for entertainment purposes only and does not guarantee winning lottery numbers. All generated combinations are based on statistical analysis and should not be considered as financial advice.',
    gambling_warning: 'Gambling involves risk. Please gamble responsibly.',
    no_guarantee: 'No guarantee of winning. Past results do not predict future outcomes.',
    for_entertainment: 'For entertainment purposes only.',
    legal_age_required: 'You must be of legal age to participate in lottery games.',
    gamble_responsibly: 'Gamble responsibly. Set limits and stick to them.',
    seek_help_if_needed: 'If you think you have a gambling problem, seek help from professional organizations.',
    or: 'or'
  },
  'zh-TW': {
    title: '六合彩生成器',
    select_your_numbers: '選擇您的號碼',
    selected_balls: '已選擇號碼：',
    number_of_combinations: '組合數量：',
    lucky_number: '幸運號碼：',
    select_lucky_number: '選擇幸運號碼',
    generate: '生成',
    generating: '生成中...',
    generate_ai_prompt: '生成 AI 提示',
    record_id: '記錄#',
    select_saved_record: '選擇保存的記錄',
    delete: '刪除',
    select_draw_date: '開獎日期：',
    draw_number_check: '開獎號碼檢查',
    draw_result: '開獎結果',
    select_a_date_to_see_result: '選擇日期以查看結果',
    please_select_numbers: '請選擇 {count} 個號碼！',
    please_select_lucky_number: '請選擇一個幸運號碼！',
    please_select_record: '請選擇一個記錄。',
    please_select_date: '請選擇日期。',
    no_draw_on_date: '{date} 沒有開獎！',
    share_link_copied: '分享連結已複製！',
    copy_failed: '複製失敗！',
    generation_method: '生成方式：',
    follow_on_logic: '跟隨邏輯',
    ensemble_logic: '集成邏輯',
    bayesian_logic: '貝葉斯邏輯',
    suggest_hot_follow_on: '建議：熱門跟隨',
    suggest_most_frequent: '建議：最頻繁',
    suggest_least_frequent: '建議：最冷門',
    suggest_random: '建議：隨機',
    suggest_balanced: '建議：平衡',
    suggest_gann_square: '建議：江恩方陣',
    suggest_numbers: '建議號碼',
    getting_suggestions: '正在獲取建議...',
    suggestions_loaded: '建議已加載！',
    suggestion_failed: '建議失敗！',
    suggest_count: '建議：',
    will_suggest_count: '將建議 {count} 個號碼',
    no_suggestion_needed: '所有號碼已選擇',
    ai_prompt_copied: 'AI 提示已複製到剪貼簿！',
    ai_prompt_failed: 'AI 提示生成失敗。',
    generation_failed: '生成失敗，請重試。',
    required: '個（需{required}個，最多{max}個）',
    select_all: '全選',
    clear_all: '清除全部',
    results_records: '結果與記錄',
    view_generated_combinations: '查看生成的組合並檢查結果',
    generation_id: '生成ID：',
    combinations_generated: '個組合已生成',
    no_combinations_generated: '尚未生成任何組合',
    generate_some_combinations: '生成一些組合以在此查看',
    check_draw_results: '檢查開獎結果',
    check: '檢查',
    draw_results: '開獎結果',
    matching_numbers_highlighted: '匹配的號碼已在您的組合中高亮顯示。',
    winning_numbers: '中獎號碼',
    special_number: '特別號碼',
    copy_combinations: '複製組合',
    share: '分享',
    combinations_copied: '組合已複製到剪貼簿！',
    share_link_copied_to_clipboard: '分享連結已複製到剪貼簿！',
    today: '今天',
    yesterday: '昨天',
    last_week: '上週',
    last_month: '上個月',
    select_date: '選擇日期',
    calendar: '日曆',
    quick_select: '快速選擇',
    remove_x_numbers: '移除 {count} 個號碼',
    remove_x_numbers_suggestion: '您已選擇了 {extra} 個額外號碼。考慮移除 {count} 個號碼。',
    extra_numbers: '（多{count}個）',
    ai_prompt_button: 'AI 提示',
    qimen_ai_button: 'AI 提示 (奇門)',
    saved_generations: '已保存的生成記錄',
    confirm_delete_generation: '確定要刪除此生成記錄嗎？',
    disclaimer_title: '重要免責聲明',
    disclaimer_content: '本應用程式僅供娛樂用途，不保證中獎號碼。所有生成的組合均基於統計分析，不應被視為財務建議。',
    gambling_warning: '賭博涉及風險。請負責任地賭博。',
    no_guarantee: '不保證中獎。過往結果不代表未來表現。',
    for_entertainment: '僅供娛樂用途。',
    legal_age_required: '您必須達到法定年齡才能參與彩票遊戲。',
    gamble_responsibly: '請負責任地賭博。設定限制並遵守。',
    seek_help_if_needed: '如果您認為自己有賭博問題，請向專業組織尋求幫助。',
    or: '或'
  }
};

// Utility function to replace placeholders in strings
export function replacePlaceholders(template: string, params: Record<string, string | number>): string {
  return template.replace(/{(\w+)}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

// Language detection and management
export function getBrowserLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'en';

  const browserLang = navigator.language || (navigator.languages?.[0] || 'en');
  if (browserLang.startsWith('zh')) {
    return 'zh-TW';
  }
  return 'en';
}

export function saveLanguagePreference(lang: LanguageCode) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mark6-language', lang);
  }
}

export function getSavedLanguagePreference(): LanguageCode {
  if (typeof window === 'undefined') return 'en';

  // Check URL first for language
  const pathname = window.location.pathname;
  if (pathname.startsWith('/zh-TW')) {
    return 'zh-TW';
  }
  if (pathname.startsWith('/en')) {
    return 'en';
  }

  // Fall back to localStorage
  const saved = localStorage.getItem('mark6-language');
  if (saved === 'en' || saved === 'zh-TW') {
    return saved;
  }
  return getBrowserLanguage();
}