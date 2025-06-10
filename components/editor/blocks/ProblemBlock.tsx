'use client';

import React from 'react';
import { defaultProps, type InlineContentSchema, type StyleSchema } from '@blocknote/core';
import { createReactBlockSpec, type ReactCustomBlockRenderProps } from '@blocknote/react';
import { AlertTriangle } from 'lucide-react';

const problemBlockPropsDefinition = {
  ...defaultProps,
  name: { default: 'Problem Statement' as string },
  // Add any specific props for ProblemBlock here later
};

export const problemBlockConfig = {
  type: 'problem' as const,
  name: 'Problem Statement',
  content: 'inline' as const,
  propSchema: problemBlockPropsDefinition,
  icon: () => <AlertTriangle size={18} color="#EF4444" />,
  placeholder: 'Describe the problem...',
} as const;

export type ProblemBlockRenderProps = ReactCustomBlockRenderProps<
  typeof problemBlockConfig,
  InlineContentSchema,
  StyleSchema
>;

export const ProblemBlockRenderComponent: React.FC<ProblemBlockRenderProps> = (props) => {
  const { contentRef } = props;

  const style = {
    container: 'border-t-4 border-red-500 bg-red-950/30 shadow-lg backdrop-blur-sm my-4 rounded-md overflow-hidden',
    header: 'text-red-100 bg-red-900/60 border-l-4 border-red-400 pl-4 py-3 flex items-center',
    icon: <AlertTriangle className="w-5 h-5 text-red-200 mr-3 flex-shrink-0" />,
    title: 'Problem',
    contentContainer: 'p-4 text-red-50',
  };

  return (
    <div className={style.container} data-problem-block>
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

export const problemBlockSpec = createReactBlockSpec(problemBlockConfig, {
  render: ProblemBlockRenderComponent,
});
