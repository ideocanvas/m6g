'use client';

import { useState, useRef, useEffect } from 'react';
import { labels, LanguageCode } from '@/lib/i18n';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  maxDate?: string;
  minDate?: string;
  language: LanguageCode;
  placeholder?: string;
  className?: string;
}

export default function DatePicker({
  value,
  onChange,
  maxDate,
  minDate,
  language,
  placeholder,
  className = '',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'calendar' | 'quick'>('calendar');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format date for display
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'zh-TW' ? 'zh-TW' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Get first day of month
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Select a date
  const selectDate = (day: number) => {
    // Create date in local timezone to avoid timezone issues
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    // Format as YYYY-MM-DD without timezone conversion
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const date = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${date}`;
    onChange(dateString);
    setIsOpen(false);
  };

  // Quick date options
  const quickDateOptions = [
    { label: labels[language].today, getDate: () => new Date() },
    { label: labels[language].yesterday, getDate: () => new Date(Date.now() - 86400000) },
    { label: labels[language].last_week, getDate: () => new Date(Date.now() - 7 * 86400000) },
    { label: labels[language].last_month, getDate: () => new Date(Date.now() - 30 * 86400000) },
  ];

  const handleQuickDateSelect = (getDate: () => Date) => {
    const date = getDate();
    // Format as YYYY-MM-DD without timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    onChange(dateString);
    setIsOpen(false);
  };

  // Check if date is disabled
  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    // Format as YYYY-MM-DD without timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dateStr = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${dateStr}`;

    if (maxDate && dateString > maxDate) return true;
    if (minDate && dateString < minDate) return true;

    return false;
  };

  // Check if date is selected
  const isDateSelected = (day: number) => {
    if (!value) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    // Format as YYYY-MM-DD without timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dateStr = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${dateStr}`;
    return dateString === value;
  };

  // Check if date is today
  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const days = generateCalendarDays();
  const monthNames = language === 'zh-TW'
    ? ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dayNames = language === 'zh-TW'
    ? ['日', '一', '二', '三', '四', '五', '六']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Input Field */}
      <div
        className="flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2 bg-white cursor-pointer hover:border-gray-400 transition-colors w-48"
        onClick={() => setIsOpen(!isOpen)}
      >
        <input
          type="text"
          readOnly
          value={formatDisplayDate(value)}
          placeholder={placeholder || labels[language].select_date}
          className="flex-1 bg-transparent outline-none cursor-pointer text-gray-700 placeholder-gray-400"
        />
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-w-[90vw]">
          {/* Header with View Toggle */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setView('calendar')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                view === 'calendar'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {labels[language].calendar}
            </button>
            <button
              onClick={() => setView('quick')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                view === 'quick'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {labels[language].quick_select}
            </button>
          </div>

          {/* Calendar View */}
          {view === 'calendar' && (
            <div className="p-4">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={prevMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Previous month"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="text-lg font-semibold text-gray-800">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </div>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Next month"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => day && selectDate(day)}
                    disabled={!day || isDateDisabled(day)}
                    className={`
                      h-10 rounded-lg text-sm font-medium transition-colors
                      ${!day ? 'invisible' : ''}
                      ${day && isDateSelected(day)
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : day && isToday(day)
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                      ${day && isDateDisabled(day) ? 'text-gray-300 cursor-not-allowed hover:bg-transparent' : ''}
                    `}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Select View */}
          {view === 'quick' && (
            <div className="p-4">
              <div className="space-y-2">
                {quickDateOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickDateSelect(option.getDate)}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}