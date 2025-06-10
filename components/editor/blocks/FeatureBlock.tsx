'use client';

import React from 'react';
import { defaultProps, type InlineContentSchema, type StyleSchema } from '@blocknote/core';
import { createReactBlockSpec, type ReactCustomBlockRenderProps } from '@blocknote/react';
import { TrendingUp } from 'lucide-react';

const featureBlockPropsDefinition = {
  ...defaultProps,
  name: { default: 'Feature Highlight' as string },
  // Add any specific props for FeatureBlock here later
};

export const featureBlockConfig = {
  type: 'feature' as const,
  name: 'Feature Highlight',
  content: 'none' as const,
  propSchema: featureBlockPropsDefinition,
  icon: () => <TrendingUp size={18} color="#10B981" />,
} as const;

export type FeatureBlockRenderProps = ReactCustomBlockRenderProps<
  typeof featureBlockConfig,
  InlineContentSchema,
  StyleSchema
>;

export const FeatureBlockRenderComponent: React.FC<FeatureBlockRenderProps> = (props) => {
  const style = {
    container: 'w-full border-t-4 border-emerald-500 bg-emerald-50 shadow-md my-4 rounded-md overflow-hidden',
    header: 'text-emerald-700 bg-emerald-100 border-l-4 border-emerald-500 pl-4 py-3 flex items-center',
    icon: <TrendingUp className="w-5 h-5 text-emerald-600 mr-3 flex-shrink-0" />,
    title: 'Features', // Or 'Feature Highlight' if preferred, as per Option A this is the source of truth
  };

  return (
    <div className={style.container} data-feature-block>
      <div className={style.header}>
        {style.icon}
        <span className="font-semibold text-2xl">{style.title}</span>
      </div>
    </div>
  );
};

export const featureBlockSpec = createReactBlockSpec(featureBlockConfig, {
  render: FeatureBlockRenderComponent,
});
