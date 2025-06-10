'use client';

import React from 'react';
import { defaultProps, type InlineContentSchema, type StyleSchema } from '@blocknote/core';
import { createReactBlockSpec, type ReactCustomBlockRenderProps } from '@blocknote/react';
import { Lightbulb } from 'lucide-react';

const solutionBlockPropsDefinition = {
  ...defaultProps,
  name: { default: 'Solution Overview' as string },
  // Add any specific props for SolutionBlock here later
};

export const solutionBlockConfig = {
  type: 'solution' as const,
  name: 'Solution Overview',
  content: 'inline' as const,
  propSchema: solutionBlockPropsDefinition,
  icon: () => <Lightbulb size={18} color="#3B82F6" />,
  placeholder: 'Describe the solution...',
} as const;

export type SolutionBlockRenderProps = ReactCustomBlockRenderProps<
  typeof solutionBlockConfig,
  InlineContentSchema,
  StyleSchema
>;

export const SolutionBlockRenderComponent: React.FC<SolutionBlockRenderProps> = (props) => {
  const { contentRef } = props;

  const style = {
    container: 'border-t-4 border-blue-500 bg-blue-50 shadow-md my-4 rounded-md overflow-hidden',
    header: 'text-blue-700 bg-blue-100 border-l-4 border-blue-500 pl-4 py-3 flex items-center',
    icon: <Lightbulb className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />,
    title: 'Solution',
    contentContainer: 'p-4 text-gray-700',
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

export const solutionBlockSpec = createReactBlockSpec(solutionBlockConfig, {
  render: SolutionBlockRenderComponent,
});
