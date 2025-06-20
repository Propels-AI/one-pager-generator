import React from 'react';
import { cn } from '@/lib/utils';

interface BlockContainerProps {
  children: React.ReactNode;
  spacing?: 'compact' | 'default' | 'spacious' | 'generous';
  className?: string;
  blockType?: string;
  dimWhenUnfocused?: boolean;
}

const spacingClasses = {
  compact: 'py-2', // 8px - for dense layouts
  default: 'py-4', // 16px - balanced spacing (STANDARDIZED)
  spacious: 'py-6', // 24px - more breathing room
  generous: 'py-8', // 32px - maximum spacing
} as const;

/**
 * BlockContainer - Centralized container for all editor blocks
 *
 * Usage in blocks:
 * ```tsx
 * return (
 *   <div className="relative group w-full">
 *     <BlockContainer blockType="team" spacing="default">
 *       <div className="container mx-auto px-4">
 *         // Your block content
 *       </div>
 *     </BlockContainer>
 *     // Edit popover
 *   </div>
 * );
 * ```
 */
export const BlockContainer: React.FC<BlockContainerProps> = ({
  children,
  spacing = 'default',
  className = '',
  blockType,
  dimWhenUnfocused = false,
}) => {
  const spacingClass = spacingClasses[spacing];

  return (
    <section
      className={cn(
        'w-full',
        spacingClass,
        dimWhenUnfocused && 'transition-opacity duration-200 group-hover:opacity-100 opacity-90',
        className
      )}
      data-block-type={blockType}
      data-block-spacing={spacing}
    >
      {children}
    </section>
  );
};

/**
 * Hook for consistent block styling patterns
 * Provides standardized CSS classes for common block elements
 *
 * Future extensions could include:
 * - Theme-aware styling
 * - Dark mode support
 * - Animation presets
 * - Responsive breakpoint helpers
 */
export const useBlockStyling = () => {
  return {
    // Container patterns
    container: 'container mx-auto px-4',
    containerCentered: 'container mx-auto px-4 text-center',
    containerMaxWidth: (size: 'sm' | 'md' | 'lg' | 'xl') => {
      const maxWidths = {
        sm: 'max-w-2xl',
        md: 'max-w-4xl',
        lg: 'max-w-6xl',
        xl: 'max-w-7xl',
      };
      return `container mx-auto px-4 ${maxWidths[size]}`;
    },

    // Editor patterns
    editableWrapper: 'relative group w-full',
    editButton:
      'absolute top-4 right-4 h-8 w-8 bg-white opacity-100 md:opacity-0 group-hover:md:opacity-100 transition-opacity duration-300 z-10',

    // Common layout patterns
    grid: {
      responsive: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
      team: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8',
      testimonials: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    },

    // Typography patterns
    heading: {
      h1: 'text-3xl md:text-4xl lg:text-5xl font-bold',
      h2: 'text-2xl md:text-3xl lg:text-4xl font-bold',
      h3: 'text-xl md:text-2xl font-semibold',
      subtitle: 'text-lg text-muted-foreground max-w-3xl mx-auto',
    },
  };
};

export type BlockSpacing = keyof typeof spacingClasses;

export function withBlockContainer<P extends object>(
  Component: React.ComponentType<P>,
  defaultSpacing: BlockSpacing = 'default'
) {
  return React.forwardRef<any, P & { blockSpacing?: BlockSpacing; blockType?: string }>((props, ref) => {
    const { blockSpacing = defaultSpacing, blockType, ...componentProps } = props;

    return (
      <div className="relative group w-full">
        <BlockContainer spacing={blockSpacing} blockType={blockType}>
          <Component {...(componentProps as P)} ref={ref} />
        </BlockContainer>
      </div>
    );
  });
}
