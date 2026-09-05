/**
 * ListItem Component for GlueStack UI
 * List row with icon, title, subtitle, and actions
 */

import React from 'react';
import { Box, Text, Badge, Avatar } from '../components';
import { ChevronRight, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

export default function ListItem({
  title,
  subtitle,
  description,
  leftIcon,
  leftAvatar,
  leftAvatarFallback,
  leftBadge,
  leftBadgeColor = 'info',
  rightContent,
  rightText,
  rightSubtext,
  rightBadge,
  rightBadgeColor = 'default',
  rightIcon = ChevronRight,
  status, // 'success' | 'warning' | 'error' | 'pending' | 'info'
  statusLabel,
  onClick,
  disabled = false,
  selected = false,
  size = 'md', // 'sm' | 'md' | 'lg'
  variant = 'default', // 'default' | 'bordered' | 'filled' | 'card'
  showDivider = true,
}) {
  const sizeConfig = {
    sm: { padding: 'p-2', gap: 'gap-2', titleSize: 'text-sm', subtitleSize: 'text-xs', iconSize: 16 },
    md: { padding: 'p-3', gap: 'gap-3', titleSize: 'text-base', subtitleSize: 'text-sm', iconSize: 20 },
    lg: { padding: 'p-4', gap: 'gap-4', titleSize: 'text-lg', subtitleSize: 'text-base', iconSize: 24 },
  };

  const config = sizeConfig[size] || sizeConfig.md;

  const badgeColorMap = {
    success: { bg: '#dcfce7', text: '#166534' },
    warning: { bg: '#fef3c7', text: '#92400e' },
    error: { bg: '#fee2e2', text: '#991b1b' },
    info: { bg: '#dbeafe', text: '#1e40af' },
    default: { bg: '#f1f5f9', text: '#475569' },
  };

  const statusConfig = {
    success: { color: '#22c55e', icon: CheckCircle2 },
    warning: { color: '#f59e0b', icon: AlertTriangle },
    error: { color: '#ef4444', icon: XCircle },
    pending: { color: '#64748b', icon: Clock },
    info: { color: '#3b82f6', icon: Clock },
  };

  const variantStyles = {
    default: 'bg-transparent hover:bg-slate-50',
    bordered: 'border-b border-slate-100 hover:bg-slate-50',
    filled: 'bg-slate-50 rounded-lg',
    card: 'bg-white rounded-xl border border-slate-200 shadow-sm',
  };

  const LeftIcon = leftIcon;
  const RightIcon = rightIcon;
  const StatusIcon = status ? statusConfig[status]?.icon : null;

  return (
    <Box
      as={onClick ? 'button' : 'div'}
      onClick={!disabled && onClick}
      disabled={disabled}
      className={`
        w-full flex items-center ${config.padding} ${config.gap}
        ${variantStyles[variant]}
        ${selected ? 'bg-[#714b67]/5 border border-[#714b67]/20' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : onClick ? 'cursor-pointer' : ''}
        transition-colors text-left
      `}
    >
      {/* Left side */}
      <Box className="flex items-center gap-3 flex-1 min-w-0">
        {/* Icon */}
        {LeftIcon && (
          <Box
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#f1f5f9' }}
          >
            <LeftIcon size={config.iconSize} className="text-slate-600" />
          </Box>
        )}

        {/* Avatar */}
        {leftAvatar && (
          <Avatar size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}>
            {leftAvatar}
          </Avatar>
        )}

        {/* Avatar Fallback */}
        {leftAvatarFallback && !leftAvatar && (
          <Avatar size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}>
            <Avatar.FallbackText>{leftAvatarFallback}</Avatar.FallbackText>
          </Avatar>
        )}

        {/* Left Badge */}
        {leftBadge && (
          <Box
            className="px-2 py-1 rounded-full text-xs font-semibold shrink-0"
            style={{
              backgroundColor: badgeColorMap[leftBadgeColor]?.bg || badgeColorMap.default.bg,
              color: badgeColorMap[leftBadgeColor]?.text || badgeColorMap.default.text,
            }}
          >
            {leftBadge}
          </Box>
        )}

        {/* Status Icon */}
        {StatusIcon && (
          <Box className="shrink-0">
            <StatusIcon size={config.iconSize} style={{ color: statusConfig[status].color }} />
          </Box>
        )}

        {/* Text content */}
        <Box className="flex flex-col min-w-0 flex-1">
          <Box className="flex items-center gap-2">
            <Text
              className={`font-semibold text-slate-900 truncate ${config.titleSize}`}
              numberOfLines={1}
            >
              {title}
            </Text>
            {statusLabel && (
              <Box
                className="px-1.5 py-0.5 rounded text-xs font-medium shrink-0"
                style={{
                  backgroundColor: statusConfig[status]?.color || '#64748b',
                  color: 'white',
                }}
              >
                {statusLabel}
              </Box>
            )}
          </Box>

          {(subtitle || description) && (
            <Text
              className={`text-slate-500 truncate ${config.subtitleSize}`}
              numberOfLines={subtitle && description ? 1 : 2}
            >
              {subtitle || description}
            </Text>
          )}
        </Box>
      </Box>

      {/* Right side */}
      <Box className="flex items-center gap-2 shrink-0 ml-2">
        {/* Right Badge */}
        {rightBadge && (
          <Box
            className="px-2 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: badgeColorMap[rightBadgeColor]?.bg || badgeColorMap.default.bg,
              color: badgeColorMap[rightBadgeColor]?.text || badgeColorMap.default.text,
            }}
          >
            {rightBadge}
          </Box>
        )}

        {/* Right Text */}
        {rightText && (
          <Box className="text-right">
            <Text className={`font-semibold text-slate-900 ${config.subtitleSize}`}>
              {rightText}
            </Text>
            {rightSubtext && (
              <Text size="xs" className="text-slate-400">{rightSubtext}</Text>
            )}
          </Box>
        )}

        {/* Right Content */}
        {rightContent}

        {/* Right Icon */}
        {RightIcon && onClick && !rightContent && (
          <RightIcon size={18} className="text-slate-400" />
        )}
      </Box>
    </Box>
  );
}
