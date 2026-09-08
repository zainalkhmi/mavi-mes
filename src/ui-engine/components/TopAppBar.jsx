/**
 * TopAppBar Component - Material Design 3
 * Collapsing/pinned app bar with scroll behavior
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '../utils/cn';
import { ArrowLeft, Menu, MoreVertical } from 'lucide-react';
import useRipple from '../utils/useRipple';

/**
 * @param {'small'|'medium'|'large'} variant - MD3 top app bar type
 * @param {'scroll'|'fixed'|'enterAlways'} scrollBehavior - Behavior on scroll
 */
export function TopAppBar({
  title = '',
  subtitle,
  variant = 'small',       // small | medium | large
  scrollBehavior = 'fixed', // scroll | fixed | enterAlways
  navigationIcon,           // ArrowLeft | Menu | custom
  onNavigationPress,
  actions = [],             // [{ icon, onPress, label }]
  overflowActions = [],     // [{ label, onPress }]
  elevated = false,
  containerRef,             // ref to scroll container for collapse behavior
  className,
  children
}) {
  const [scrollY, setScrollY] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showOverflow, setShowOverflow] = useState(false);
  const barRef = useRef(null);

  // Listen to scroll container
  useEffect(() => {
    const container = containerRef?.current;
    if (!container || scrollBehavior === 'fixed') return;

    const handleScroll = () => {
      const y = container.scrollTop;
      setScrollY(y);
      setIsCollapsed(y > 50);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef, scrollBehavior]);

  const NavIcon = navigationIcon || (onNavigationPress ? ArrowLeft : null);

  const variantConfig = {
    small: {
      expandedHeight: '64px',
      collapsedHeight: '64px',
      titleSize: 'text-xl',
      titleSizeCollapsed: 'text-xl'
    },
    medium: {
      expandedHeight: '112px',
      collapsedHeight: '64px',
      titleSize: 'text-2xl',
      titleSizeCollapsed: 'text-xl'
    },
    large: {
      expandedHeight: '152px',
      collapsedHeight: '64px',
      titleSize: 'text-[28px]',
      titleSizeCollapsed: 'text-xl'
    }
  }[variant] || variantConfig.small;

  const collapsed = variant !== 'small' && isCollapsed;
  const currentHeight = collapsed ? variantConfig.collapsedHeight : variantConfig.expandedHeight;

  return (
    <>
      <div
        ref={barRef}
        className={cn(
          'mavi-topappbar flex flex-col justify-end bg-white dark:bg-[#1e1e2d] z-30',
          elevated || collapsed ? 'mavi-elevation-2' : '',
          scrollBehavior === 'fixed' ? 'sticky top-0' : '',
          className
        )}
        style={{
          height: currentHeight,
          minHeight: '64px'
        }}
      >
        {/* Top row: nav icon + (title for small) + actions */}
        <div className="flex items-center h-16 px-1 shrink-0">
          {/* Navigation icon */}
          {NavIcon && (
            <IconButton onClick={onNavigationPress} ariaLabel="Navigate">
              <NavIcon className="w-6 h-6" />
            </IconButton>
          )}

          {/* Title (only in top row for small variant or when collapsed) */}
          {(variant === 'small' || collapsed) && (
            <div className="flex-1 min-w-0 px-3">
              <h1
                className={cn(
                  'font-semibold text-slate-900 dark:text-slate-100 truncate mavi-topappbar-title',
                  collapsed ? variantConfig.titleSizeCollapsed : variantConfig.titleSize
                )}
              >
                {title}
              </h1>
              {subtitle && variant === 'small' && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
              )}
            </div>
          )}

          {/* Spacer when title is in bottom section */}
          {variant !== 'small' && !collapsed && <div className="flex-1" />}

          {/* Action icons */}
          <div className="flex items-center">
            {actions.map((action, i) => {
              const ActionIcon = action.icon;
              return (
                <IconButton
                  key={i}
                  onClick={action.onPress}
                  ariaLabel={action.label || 'Action'}
                >
                  <ActionIcon className="w-6 h-6" />
                </IconButton>
              );
            })}

            {/* Overflow menu */}
            {overflowActions.length > 0 && (
              <div className="relative">
                <IconButton
                  onClick={() => setShowOverflow(!showOverflow)}
                  ariaLabel="More options"
                >
                  <MoreVertical className="w-6 h-6" />
                </IconButton>

                {showOverflow && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowOverflow(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 min-w-[180px]">
                      {overflowActions.map((item, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setShowOverflow(false);
                            if (item.onPress) item.onPress();
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors mavi-state-layer"
                          style={{ minHeight: '48px' }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom section: title for medium/large (when not collapsed) */}
        {variant !== 'small' && !collapsed && (
          <div className="px-4 pb-4">
            <h1
              className={cn(
                'font-semibold text-slate-900 dark:text-slate-100 mavi-topappbar-title',
                variantConfig.titleSize
              )}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
            )}
          </div>
        )}
      </div>

      {/* Children (scrollable content placeholder) */}
      {children}
    </>
  );
}

// ─── IconButton helper (48dp touch target) ─────────────────

function IconButton({ children, onClick, ariaLabel, className }) {
  const { rippleRef, handleRipple, rippleContainerStyle } = useRipple({
    centered: true,
    opacity: 0.1
  });

  const handleClick = (e) => {
    handleRipple(e);
    if (onClick) onClick(e);
  };

  return (
    <button
      ref={rippleRef}
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={cn(
        'w-12 h-12 flex items-center justify-center rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
        className
      )}
      style={rippleContainerStyle}
    >
      {children}
    </button>
  );
}

export { IconButton };

export default TopAppBar;
