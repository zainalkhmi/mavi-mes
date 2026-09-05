import React, { useState, createContext, useContext } from 'react';
import { cn } from '../utils/cn';

const TabsContext = createContext({
  activeTab: '',
  setActiveTab: () => {}
});

export function Tabs({
  children,
  value,
  defaultValue,
  onTabChange,
  className
}) {
  const [currentTab, setCurrentTab] = useState(value || defaultValue || '');

  const active = value !== undefined ? value : currentTab;

  const handleTabChange = (val) => {
    setCurrentTab(val);
    if (onTabChange) onTabChange(val);
  };

  return (
    <TabsContext.Provider value={{ activeTab: active, setActiveTab: handleTabChange }}>
      <div className={cn('w-full flex flex-col', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsTabList({ children, className }) {
  return (
    <div className={cn('flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto no-scrollbar', className)}>
      {children}
    </div>
  );
}

export function TabsTab({ value, children, className }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={cn(
        'px-4 py-2 text-sm font-semibold transition-all border-b-2 select-none cursor-pointer whitespace-nowrap',
        isActive
          ? 'border-[#714b67] text-[#714b67] dark:text-[#dcbfd3]'
          : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsTabPanels({ children, className }) {
  return <div className={cn('pt-4', className)}>{children}</div>;
}

export function TabsTabPanel({ value, children, className }) {
  const { activeTab } = useContext(TabsContext);
  if (activeTab !== value) return null;

  return (
    <div className={cn('animate-in fade-in duration-150', className)}>
      {children}
    </div>
  );
}
