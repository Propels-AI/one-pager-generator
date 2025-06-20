'use client';

import React from 'react';
import { defaultProps, type InlineContentSchema, type StyleSchema } from '@blocknote/core';
import { createReactBlockSpec, type ReactCustomBlockRenderProps } from '@blocknote/react';
import { AlertTriangle } from 'lucide-react';
import { BlockContainer } from '../BlockContainer';

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
    container: 'border-t border-border shadow-sm rounded-md',
    header: 'border-l pl-4 py-3 flex items-center gap-3',
    icon: <AlertTriangle className="w-5 h-5" />,
    title: 'Problem',
    contentContainer: 'p-4',
  };

  return (
    <BlockContainer blockType="problem" spacing="compact">
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
    </BlockContainer>
  );
};

export const problemBlockSpec = createReactBlockSpec(problemBlockConfig, {
  render: ProblemBlockRenderComponent,
});
