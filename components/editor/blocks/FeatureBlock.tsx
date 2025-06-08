'use client';

import React from 'react';
import { defaultProps, type InlineContentSchema, type StyleSchema } from '@blocknote/core';
import { createReactBlockSpec, type ReactCustomBlockRenderProps } from '@blocknote/react';
import { MdExtension } from 'react-icons/md';

const featureBlockPropsDefinition = {
  ...defaultProps,
  // Add any specific props for FeatureBlock here later
};

export const featureBlockConfig = {
  type: 'feature' as const,
  name: 'Feature Highlight',
  content: 'inline' as const,
  propSchema: featureBlockPropsDefinition,
  icon: MdExtension,
  placeholder: 'Enter feature description...',
} as const;

export type FeatureBlockRenderProps = ReactCustomBlockRenderProps<
  typeof featureBlockConfig,
  InlineContentSchema,
  StyleSchema
>;

export const FeatureBlockRenderComponent: React.FC<FeatureBlockRenderProps> = (props) => {
  const { textColor: tcProp, backgroundColor: bgProp } = props.block.props;

  let colorToDisplay = tcProp === 'default' ? 'inherit' : tcProp;
  const bgColorToDisplay = bgProp === 'default' ? 'transparent' : bgProp;

  const lightTextColors = [
    'white',
    '#fff',
    '#ffffff',
    'yellow',
    'lightgray',
    'lightyellow',
    'lightcyan',
    'lightpink',
    '#fafafa',
    '#f8f8f8',
    '#f0f0f0',
  ];
  const problematicLightBackgrounds = [
    'white',
    '#fff',
    '#ffffff',
    'yellow',
    'lightgray',
    'lightyellow',
    'beige',
    '#fafafa',
    '#f8f8f8',
    '#f0f0f0',
  ];
  const darkTextColor = '#1E1E1E';

  const tcPropLower = typeof tcProp === 'string' ? tcProp.toLowerCase() : 'default';
  const bgPropLower = typeof bgProp === 'string' ? bgProp.toLowerCase() : 'default';

  // Case 1: User selected a light text color AND a light background color
  if (lightTextColors.includes(tcPropLower) && problematicLightBackgrounds.includes(bgPropLower)) {
    colorToDisplay = darkTextColor;
  }
  // Case 2: User selected 'default' text (light on dark theme) AND a light background color
  else if (tcProp === 'default' && problematicLightBackgrounds.includes(bgPropLower)) {
    colorToDisplay = darkTextColor;
  }

  const wrapperStyle: React.CSSProperties = {
    padding: '10px',
    border: '1px dashed #ccc',
    margin: '10px 0',
    color: colorToDisplay,
    backgroundColor: bgColorToDisplay,
  };

  return (
    <div data-feature-block style={wrapperStyle}>
      <h4 style={{ marginTop: 0, marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
        <MdExtension style={{ marginRight: '8px' }} /> Feature Highlight
      </h4>
      <div ref={props.contentRef} className="bn-inline-content" />
    </div>
  );
};

export const featureBlockSpec = createReactBlockSpec(featureBlockConfig, {
  render: FeatureBlockRenderComponent,
});
