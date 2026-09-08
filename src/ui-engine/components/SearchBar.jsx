/**
 * SearchBar Component - Material Design 3
 * Expandable search bar with suggestions support
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../utils/cn';
import { Search, X, ArrowLeft, Mic } from 'lucide-react';

export function SearchBar({
  value = '',
  onChangeText,
  onChange,
  placeholder = 'Cari...',
  suggestions = [],
  onSuggestionPress,
  onSubmit,
  onFocus,
  onBlur,
  leadingIcon,
  showBackButton = false,
  showMicButton = false,
  onBack,
  onMic,
  autoFocus = false,
  variant = 'bar',  // bar | view (bar = always expanded, view = expandable)
  size = 'md',
  disabled = false,
  className,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleChange = useCallback((e) => {
    const val = e.target.value;
    if (onChange) onChange(e);
    if (onChangeText) onChangeText(val);
    setShowSuggestions(val.length > 0 && suggestions.length > 0);
  }, [onChange, onChangeText, suggestions]);

  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    if (value && suggestions.length > 0) setShowSuggestions(true);
    if (onFocus) onFocus(e);
  }, [value, suggestions, onFocus]);

  const handleBlur = useCallback((e) => {
    // Delay to allow suggestion clicks
    setTimeout(() => {
      if (onBlur) onBlur(e);
    }, 150);
  }, [onBlur]);

  const handleClear = useCallback(() => {
    if (onChangeText) onChangeText('');
    if (onChange) onChange({ target: { value: '' } });
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [onChange, onChangeText]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (onSubmit) onSubmit(value);
  }, [value, onSubmit]);

  const handleSuggestionClick = useCallback((suggestion) => {
    setShowSuggestions(false);
    if (onSuggestionPress) onSuggestionPress(suggestion);
    if (onChangeText) onChangeText(typeof suggestion === 'string' ? suggestion : suggestion.text);
  }, [onSuggestionPress, onChangeText]);

  const sizeClasses = {
    sm: 'h-10',
    md: 'h-12',
    lg: 'h-14'
  }[size] || 'h-12';

  const LeadingIcon = leadingIcon || Search;

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            'flex items-center w-full rounded-[28px] transition-all duration-200',
            sizeClasses,
            isFocused
              ? 'bg-slate-100 dark:bg-slate-800 shadow-md'
              : 'bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800',
            disabled && 'opacity-50 cursor-not-allowed',
            showSuggestions && 'rounded-b-none shadow-md'
          )}
        >
          {/* Back button or Leading icon */}
          <div className="flex items-center justify-center w-12 h-full shrink-0">
            {showBackButton && isFocused ? (
              <button
                type="button"
                onClick={() => {
                  setIsFocused(false);
                  setShowSuggestions(false);
                  if (onBack) onBack();
                }}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                style={{ minWidth: '40px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <LeadingIcon className="w-5 h-5 text-slate-500" />
            )}
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 h-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none text-base"
            {...props}
          />

          {/* Clear / Mic button */}
          <div className="flex items-center pr-2 gap-1">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                style={{ minWidth: '40px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {showMicButton && !value && (
              <button
                type="button"
                onClick={onMic}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                style={{ minWidth: '40px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full bg-slate-100 dark:bg-slate-800 rounded-b-[28px] shadow-lg overflow-hidden z-50 border-t border-slate-200/50 dark:border-slate-700/50">
          {suggestions.map((suggestion, i) => {
            const text = typeof suggestion === 'string' ? suggestion : suggestion.text;
            const icon = typeof suggestion === 'object' ? suggestion.icon : null;
            const SugIcon = icon || Search;

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors mavi-state-layer"
                style={{ minHeight: '48px' }}
              >
                <SugIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="flex-1 truncate">{text}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
