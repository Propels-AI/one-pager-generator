'use client';

import React from 'react';
import { defaultProps, type InlineContentSchema, type StyleSchema } from '@blocknote/core';
import { createReactBlockSpec, type ReactCustomBlockRenderProps } from '@blocknote/react';
import { Lightbulb } from 'lucide-react';
import { BlockContainer } from '../BlockContainer';

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
    header: 'flex items-center gap-3 pb-2',
    icon: <Lightbulb className="w-5 h-5" />,
    title: 'Solution',
    contentContainer: 'pt-2',
  };

  return (
    <BlockContainer blockType="solution" spacing="compact">
      <div data-solution-block>
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

export const solutionBlockSpec = createReactBlockSpec(solutionBlockConfig, {
  render: SolutionBlockRenderComponent,
});
