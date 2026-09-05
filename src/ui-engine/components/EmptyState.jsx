/**
 * EmptyState Component for GlueStack UI
 * Display when there's no data to show
 */

import React from 'react';
import { Box, Text, Button } from '../components';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'primary', // 'primary' | 'secondary' | 'outline'
  size = 'md', // 'sm' | 'md' | 'lg'
  image,
  imageAlt = '',
}) {
  const sizeConfig = {
    sm: { iconSize: 40, titleSize: 'text-lg', descSize: 'text-sm', gap: 'gap-2', padding: 'p-4' },
    md: { iconSize: 64, titleSize: 'text-xl', descSize: 'text-base', gap: 'gap-3', padding: 'p-8' },
    lg: { iconSize: 80, titleSize: 'text-2xl', descSize: 'text-lg', gap: 'gap-4', padding: 'p-12' },
  };

  const config = sizeConfig[size] || sizeConfig.md;

  return (
    <Box
      className={`flex flex-col items-center justify-center text-center ${config.padding}`}
      style={{ maxWidth: '400px', margin: '0 auto' }}
    >
      {/* Image */}
      {image && (
        <Box
          as="img"
          src={image}
          alt={imageAlt}
          className="mb-4"
          style={{
            width: config.iconSize * 1.5,
            height: config.iconSize * 1.5,
            objectFit: 'contain',
          }}
        />
      )}

      {/* Icon */}
      {Icon && !image && (
        <Box
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: '#f1f5f9' }}
        >
          <Icon size={config.iconSize} className="text-slate-400" />
        </Box>
      )}

      {/* Title */}
      {title && (
        <Text
          className={`font-bold text-slate-800 ${config.titleSize}`}
        >
          {title}
        </Text>
      )}

      {/* Description */}
      {description && (
        <Text
          className={`text-slate-500 mt-2 ${config.descSize}`}
          style={{ lineHeight: 1.6 }}
        >
          {description}
        </Text>
      )}

      {/* Action Button */}
      {actionLabel && onAction && (
        <Box className={`mt-${size === 'sm' ? '3' : '6'}`}>
          <Button
            variant={actionVariant === 'outline' ? 'outline' : 'solid'}
            action={actionVariant === 'primary' ? 'primary' : 'secondary'}
            onPress={onAction}
            size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
          >
            <Button.Text>{actionLabel}</Button.Text>
          </Button>
        </Box>
      )}
    </Box>
  );
}

// Preset empty states for common use cases
export const EmptyStates = {
  noData: {
    icon: 'Database',
    title: 'No Data Available',
    description: 'There is no data to display at the moment. Please check back later or try refreshing.',
    actionLabel: 'Refresh',
  },
  noResults: {
    icon: 'Search',
    title: 'No Results Found',
    description: 'Your search did not match any records. Try adjusting your search criteria.',
    actionLabel: 'Clear Search',
  },
  noRecords: {
    icon: 'FileText',
    title: 'No Records',
    description: 'There are no records to show. Start by creating your first record.',
    actionLabel: 'Create Record',
  },
  noNotifications: {
    icon: 'Bell',
    title: 'All Caught Up!',
    description: 'You have no new notifications at this time.',
    actionLabel: null,
  },
  noFavorites: {
    icon: 'Star',
    title: 'No Favorites',
    description: 'Items you favorite will appear here for quick access.',
    actionLabel: 'Browse Items',
  },
  error: {
    icon: 'AlertCircle',
    title: 'Something Went Wrong',
    description: 'An error occurred while loading data. Please try again.',
    actionLabel: 'Try Again',
  },
};
