/**
 * DateTimePicker Component for GlueStack UI
 * Date, Time, and DateTime picker for scheduling
 */

import React, { useState, useRef, useEffect } from 'react';
import { Box, Text, Button } from '../components';
import { Calendar, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DateTimePicker({
  value,
  onChange,
  mode = 'date', // 'date' | 'time' | 'datetime'
  min,
  max,
  label,
  placeholder = 'Select date...',
  size = 'md', // 'sm' | 'md' | 'lg'
  isDisabled = false,
  isInvalid = false,
  errorText,
  format = 'MM/DD/YYYY', // 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
  showNowButton = true,
  showClearButton = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'time'
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : new Date());
  const [selectedTime, setSelectedTime] = useState(value ? new Date(value) : new Date());
  const [calendarYear, setCalendarYear] = useState(value ? new Date(value).getFullYear() : new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(value ? new Date(value).getMonth() : new Date().getMonth());
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    switch (format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      default:
        return `${month}/${day}/${year}`;
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const formatDisplayValue = () => {
    if (!value) return '';
    const dateVal = new Date(value);
    if (mode === 'date') return formatDate(dateVal);
    if (mode === 'time') return formatTime(dateVal);
    return `${formatDate(dateVal)} ${formatTime(dateVal)}`;
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day) => {
    const newDate = new Date(calendarYear, calendarMonth, day, selectedTime.getHours(), selectedTime.getMinutes());
    setSelectedDate(newDate);

    if (mode === 'date') {
      onChange?.(newDate.toISOString());
      setIsOpen(false);
    } else {
      setSelectedTime(newDate);
      setViewMode('time');
    }
  };

  const handleTimeChange = (type, delta) => {
    const newTime = new Date(selectedTime);
    if (type === 'hour') {
      newTime.setHours((newTime.getHours() + delta + 24) % 24);
    } else if (type === 'minute') {
      newTime.setMinutes((newTime.getMinutes() + delta + 60) % 60);
    }
    setSelectedTime(newTime);

    const finalDate = new Date(selectedDate);
    finalDate.setHours(newTime.getHours(), newTime.getMinutes());
    onChange?.(finalDate.toISOString());
  };

  const handleNow = () => {
    const now = new Date();
    setSelectedDate(now);
    setSelectedTime(now);
    setCalendarYear(now.getFullYear());
    setCalendarMonth(now.getMonth());
    onChange?.(now.toISOString());
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange?.(null);
    setIsOpen(false);
  };

  const sizeConfig = {
    sm: { height: 'h-8', fontSize: 'text-sm', padding: 'px-3 py-1.5' },
    md: { height: 'h-10', fontSize: 'text-base', padding: 'px-4 py-2' },
    lg: { height: 'h-12', fontSize: 'text-lg', padding: 'px-4 py-3' },
  };

  const config = sizeConfig[size] || sizeConfig.md;

  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
  const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);

  return (
    <Box className="flex flex-col gap-1" ref={containerRef}>
      {label && (
        <Text size="sm" className={`font-medium ${isInvalid ? 'text-red-500' : 'text-slate-700'}`}>
          {label}
        </Text>
      )}

      <Box
        as="button"
        type="button"
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        disabled={isDisabled}
        className={`${config.height} ${config.padding} ${config.fontSize} flex items-center justify-between gap-2 rounded-xl border transition-colors ${
          isDisabled
            ? 'bg-slate-100 cursor-not-allowed border-slate-200'
            : 'bg-white hover:border-slate-400 cursor-pointer'
        } ${isInvalid ? 'border-red-500' : 'border-slate-300'}`}
      >
        <Text className={`flex-1 text-left ${!value ? 'text-slate-400' : 'text-slate-900'}`}>
          {value ? formatDisplayValue() : placeholder}
        </Text>
        {mode !== 'time' && <Calendar size={18} className="text-slate-400" />}
      </Box>

      {isOpen && (
        <Box className="absolute z-50 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden w-[320px]">
          {viewMode === 'calendar' && (
            <>
              {/* Calendar Header */}
              <Box className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50">
                <Box
                  as="button"
                  onClick={() => {
                    if (calendarMonth === 0) {
                      setCalendarMonth(11);
                      setCalendarYear(calendarYear - 1);
                    } else {
                      setCalendarMonth(calendarMonth - 1);
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <ChevronLeft size={18} className="text-slate-600" />
                </Box>
                <Text
                  className="font-semibold text-slate-800 cursor-pointer"
                  onClick={() => {
                    setCalendarYear(new Date().getFullYear());
                    setCalendarMonth(new Date().getMonth());
                  }}
                >
                  {MONTHS[calendarMonth]} {calendarYear}
                </Text>
                <Box
                  as="button"
                  onClick={() => {
                    if (calendarMonth === 11) {
                      setCalendarMonth(0);
                      setCalendarYear(calendarYear + 1);
                    } else {
                      setCalendarMonth(calendarMonth + 1);
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <ChevronRight size={18} className="text-slate-600" />
                </Box>
              </Box>

              {/* Day Headers */}
              <Box className="grid grid-cols-7 p-2 bg-slate-50">
                {DAYS.map((day) => (
                  <Text key={day} size="xs" className="text-center text-slate-500 font-medium py-1">
                    {day}
                  </Text>
                ))}
              </Box>

              {/* Days Grid */}
              <Box className="grid grid-cols-7 p-2 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <Box key={`empty-${i}`} className="h-9" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const date = new Date(calendarYear, calendarMonth, day);
                  const isSelected = selectedDate &&
                    date.getDate() === selectedDate.getDate() &&
                    date.getMonth() === selectedDate.getMonth() &&
                    date.getFullYear() === selectedDate.getFullYear();
                  const isToday = date.toDateString() === new Date().toDateString();

                  return (
                    <Box
                      key={day}
                      as="button"
                      onClick={() => handleDateSelect(day)}
                      className={`h-9 rounded-lg text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-[#714b67] text-white'
                          : isToday
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {day}
                    </Box>
                  );
                })}
              </Box>

              {/* Time mode toggle and actions */}
              {(mode === 'datetime' || mode === 'time') && (
                <Box
                  as="button"
                  onClick={() => setViewMode('time')}
                  className="w-full p-3 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Clock size={16} />
                  <Text size="sm" className="font-medium">Set Time</Text>
                </Box>
              )}

              <Box className="flex border-t border-slate-100">
                {showNowButton && (
                  <Box
                    as="button"
                    onClick={handleNow}
                    className="flex-1 p-2 text-center text-sm font-medium text-[#714b67] hover:bg-slate-50 transition-colors"
                  >
                    Now
                  </Box>
                )}
                {showClearButton && (
                  <Box
                    as="button"
                    onClick={handleClear}
                    className="flex-1 p-2 text-center text-sm font-medium text-red-500 hover:bg-red-50 transition-colors border-l border-slate-100"
                  >
                    Clear
                  </Box>
                )}
                <Box
                  as="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 p-2 text-center text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors border-l border-slate-100"
                >
                  Done
                </Box>
              </Box>
            </>
          )}

          {viewMode === 'time' && (
            <>
              {/* Time Picker */}
              <Box className="p-6">
                <Box className="flex items-center justify-center gap-4">
                  {/* Hours */}
                  <Box className="flex flex-col items-center">
                    <Box
                      as="button"
                      onClick={() => handleTimeChange('hour', 1)}
                      className="p-2 rounded-lg hover:bg-slate-100"
                    >
                      <ChevronLeft size={18} className="rotate-90 text-slate-400" />
                    </Box>
                    <Text className="text-3xl font-bold text-slate-800 w-16 text-center">
                      {String(selectedTime.getHours()).padStart(2, '0')}
                    </Text>
                    <Box
                      as="button"
                      onClick={() => handleTimeChange('hour', -1)}
                      className="p-2 rounded-lg hover:bg-slate-100"
                    >
                      <ChevronRight size={18} className="rotate-90 text-slate-400" />
                    </Box>
                  </Box>

                  <Text className="text-3xl font-bold text-slate-400">:</Text>

                  {/* Minutes */}
                  <Box className="flex flex-col items-center">
                    <Box
                      as="button"
                      onClick={() => handleTimeChange('minute', 1)}
                      className="p-2 rounded-lg hover:bg-slate-100"
                    >
                      <ChevronLeft size={18} className="rotate-90 text-slate-400" />
                    </Box>
                    <Text className="text-3xl font-bold text-slate-800 w-16 text-center">
                      {String(selectedTime.getMinutes()).padStart(2, '0')}
                    </Text>
                    <Box
                      as="button"
                      onClick={() => handleTimeChange('minute', -1)}
                      className="p-2 rounded-lg hover:bg-slate-100"
                    >
                      <ChevronRight size={18} className="rotate-90 text-slate-400" />
                    </Box>
                  </Box>
                </Box>

                <Box className="flex justify-center gap-2 mt-6">
                  {['AM', 'PM'].map((period) => (
                    <Box
                      key={period}
                      as="button"
                      onClick={() => {
                        const hours = selectedTime.getHours();
                        if (period === 'AM' && hours >= 12) {
                          handleTimeChange('hour', -12);
                        } else if (period === 'PM' && hours < 12) {
                          handleTimeChange('hour', 12);
                        }
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        (selectedTime.getHours() < 12) === (period === 'AM')
                          ? 'bg-[#714b67] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {period}
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box className="flex border-t border-slate-100">
                <Box
                  as="button"
                  onClick={() => setViewMode('calendar')}
                  className="flex-1 p-3 text-center text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  ← Back
                </Box>
                <Box
                  as="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 p-3 text-center text-sm font-medium text-[#714b67] hover:bg-slate-50 transition-colors border-l border-slate-100"
                >
                  Done
                </Box>
              </Box>
            </>
          )}
        </Box>
      )}

      {(errorText && isInvalid) && (
        <Text size="xs" className="text-red-500">{errorText}</Text>
      )}
    </Box>
  );
}
