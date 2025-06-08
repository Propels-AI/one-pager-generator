'use client';

import React from 'react';
import { defaultProps, type InlineContentSchema, type StyleSchema } from '@blocknote/core';
import { createReactBlockSpec, type ReactCustomBlockRenderProps } from '@blocknote/react';
import { MdLightbulbOutline } from 'react-icons/md';

const solutionBlockPropsDefinition = {
  ...defaultProps,
  // Add any specific props for SolutionBlock here later
};

export const solutionBlockConfig = {
  type: 'solution' as const,
  name: 'Solution Overview',
  content: 'inline' as const,
  propSchema: solutionBlockPropsDefinition,
  icon: MdLightbulbOutline,
  placeholder: 'Describe the solution...',
} as const;

export type SolutionBlockRenderProps = ReactCustomBlockRenderProps<
  typeof solutionBlockConfig,
  InlineContentSchema,
  StyleSchema
>;

export const SolutionBlockRenderComponent: React.FC<SolutionBlockRenderProps> = (props) => {
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

  if (
    (lightTextColors.includes(tcPropLower) || tcProp === 'default') &&
    problematicLightBackgrounds.includes(bgPropLower)
  ) {
    colorToDisplay = darkTextColor;
  }

  const wrapperStyle: React.CSSProperties = {
    padding: '10px',
    border: '1px dashed #007bff',
    margin: '10px 0',
    backgroundColor: bgColorToDisplay,
    color: colorToDisplay,
  };

  const titleStyle: React.CSSProperties = {
    marginTop: 0,
    marginBottom: '5px',
    display: 'flex',
    alignItems: 'center',
    // If a specific text color is set for the block, title should respect it, otherwise use a theme color
    color: colorToDisplay !== 'inherit' && colorToDisplay !== darkTextColor ? colorToDisplay : '#0056b3',
  };

  // If colorToDisplay was forced to darkTextColor due to a light background, ensure title also contrasts
  if (
    colorToDisplay === darkTextColor &&
    (bgColorToDisplay === 'transparent' || problematicLightBackgrounds.includes(bgPropLower))
  ) {
    titleStyle.color = darkTextColor;
  } else if (colorToDisplay !== 'inherit') {
    titleStyle.color = colorToDisplay;
  }

  return (
    <div data-solution-block style={wrapperStyle}>
      <h4 style={titleStyle}>
        <MdLightbulbOutline style={{ marginRight: '8px' }} /> Solution Overview
      </h4>
      <div ref={props.contentRef} className="bn-inline-content" />
    </div>
  );
};

export const solutionBlockSpec = createReactBlockSpec(solutionBlockConfig, {
  render: SolutionBlockRenderComponent,
});
