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
  classic_logic: string;
  suggest_hot_follow_on: string;
  suggest_most_frequent: string;
  suggest_least_frequent: string;
  suggest_numbers: string;
  suggestion_failed: string;
  ai_prompt_copied: string;
  ai_prompt_failed: string;
  generation_failed: string;
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
    classic_logic: 'Classic Logic',
    suggest_hot_follow_on: 'Suggest: Hot Follow-on',
    suggest_most_frequent: 'Suggest: Most Frequent',
    suggest_least_frequent: 'Suggest: Least Frequent',
    suggest_numbers: 'Suggest Numbers',
    suggestion_failed: 'Suggestion failed!',
    ai_prompt_copied: 'AI prompt copied to clipboard!',
    ai_prompt_failed: 'AI prompt generation failed.',
    generation_failed: 'Generation failed. Please try again.'
  },
  'zh-TW': {
    title: '六合彩生成器',
    select_your_numbers: '選擇您的號碼',
    selected_balls: '已選擇球數：',
    number_of_combinations: '組合數量：',
    lucky_number: '幸運號碼：',
    select_lucky_number: '選擇幸運號碼',
    generate: '生成',
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
    classic_logic: '經典邏輯',
    suggest_hot_follow_on: '建議：熱門跟隨',
    suggest_most_frequent: '建議：最頻繁',
    suggest_least_frequent: '建議：最冷門',
    suggest_numbers: '建議號碼',
    suggestion_failed: '建議失敗！',
    ai_prompt_copied: 'AI 提示已複製到剪貼簿！',
    ai_prompt_failed: 'AI 提示生成失敗。',
    generation_failed: '生成失敗，請重試。'
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