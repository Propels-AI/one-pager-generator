'use client';

import React from 'react';
import { defaultBlockSpecs, InlineContentSchema, StyleSchema } from '@blocknote/core';
import { createReactBlockSpec, ReactCustomBlockRenderProps } from '@blocknote/react';

const headlinePropsDefinition = {
  level: {
    default: 1 as const,
    values: [1, 2, 3, 4, 5, 6] as const,
  },
  textColor: defaultBlockSpecs.heading.config.propSchema.textColor,
  backgroundColor: defaultBlockSpecs.heading.config.propSchema.backgroundColor,
  textAlignment: defaultBlockSpecs.heading.config.propSchema.textAlignment,
};

export const headlineBlockConfig = {
  type: 'customHeading',
  name: 'Headline',
  content: 'inline' as const,
  propSchema: headlinePropsDefinition,
} as const;

export type HeadlineBlockRenderProps = ReactCustomBlockRenderProps<
  typeof headlineBlockConfig,
  InlineContentSchema,
  StyleSchema
>;

export const HeadlineBlockRenderComponent: React.FC<HeadlineBlockRenderProps> = (props) => {
  const level = props.block.props.level;
  const TagName = `h${level}` as keyof React.JSX.IntrinsicElements;

  return React.createElement(TagName, {
    'data-headline-level': level,
    className: `bn-headline bn-headline-level-${level}`,
    style: { margin: 0 },
    ref: props.contentRef,
  });
};

export const HeadlineBlockSpec = createReactBlockSpec(headlineBlockConfig, {
  render: HeadlineBlockRenderComponent,
});
