import React from 'react';
import { cn } from '../utils/cn';
import { Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

export function Alert({
  children,
  action = 'info', // info | success | warning | error | muted
  variant = 'solid', // solid | outline
  className,
  ...props
}) {
  const actionStyles = {
    info: variant === 'solid'
      ? 'bg-sky-50 border-sky-200 text-sky-900 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-200'
      : 'border-sky-300 text-sky-800 dark:border-sky-700 dark:text-sky-300',
    success: variant === 'solid'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
      : 'border-emerald-300 text-emerald-800 dark:border-emerald-700 dark:text-emerald-300',
    warning: variant === 'solid'
      ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
      : 'border-amber-300 text-amber-800 dark:border-amber-700 dark:text-amber-300',
    error: variant === 'solid'
      ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
      : 'border-rose-300 text-rose-800 dark:border-rose-700 dark:text-rose-300',
    muted: variant === 'solid'
      ? 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200'
      : 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300'
  }[action] || 'bg-slate-50 border-slate-200 text-slate-800';

  return (
    <div
      role="alert"
      className={cn('flex items-start gap-3 p-4 rounded-xl border text-sm', actionStyles, className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertIcon({ as: Component, action = 'info', className }) {
  if (Component) {
    return <Component className={cn('w-5 h-5 shrink-0 mt-0.5', className)} />;
  }

  const DefaultIcon = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle,
    muted: Info
  }[action] || Info;

  return <DefaultIcon className={cn('w-5 h-5 shrink-0 mt-0.5', className)} />;
}

export function AlertText({ children, className }) {
  return <div className={cn('flex-1 font-medium leading-relaxed', className)}>{children}</div>;
}
