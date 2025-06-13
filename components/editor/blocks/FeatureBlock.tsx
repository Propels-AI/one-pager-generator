'use client';

import React from 'react';
import { defaultProps, type InlineContentSchema, type StyleSchema } from '@blocknote/core';
import { createReactBlockSpec, type ReactCustomBlockRenderProps } from '@blocknote/react';
import { TrendingUp } from 'lucide-react';

const featureBlockPropsDefinition = {
  ...defaultProps,
  name: { default: 'Feature Highlight' as string },
};

export const featureBlockConfig = {
  type: 'feature' as const,
  name: 'Feature Highlight',
  content: 'inline' as const,
  propSchema: featureBlockPropsDefinition,
  icon: () => <TrendingUp size={18} color="#10B981" />,
  placeholder: 'Describe the feature...',
} as const;

export type FeatureBlockRenderProps = ReactCustomBlockRenderProps<
  typeof featureBlockConfig,
  InlineContentSchema,
  StyleSchema
>;

export const FeatureBlockRenderComponent: React.FC<FeatureBlockRenderProps> = (props) => {
  const { contentRef } = props;
  const style = {
    container: 'mb-4',
    header: 'flex items-center gap-3 pb-2',
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Feature',
    contentContainer: 'pt-2',
  };

  return (
    <div className={style.container} data-solution-block>
      <div className={style.header}>
        {style.icon}
        <span className="font-semibold text-lg">{style.title}</span>
      </div>
      <div className={style.contentContainer}>
        <div
          ref={contentRef}
          className="bn-inline-content"
          style={{
            fontSize: '1rem',
            lineHeight: '1.6',
          }}
        />
      </div>
    </div>
  );
};

export const featureBlockSpec = createReactBlockSpec(featureBlockConfig, {
  render: FeatureBlockRenderComponent,
});
