'use client';

import React from 'react';
import { defaultProps, type InlineContentSchema, type StyleSchema } from '@blocknote/core';
import { createReactBlockSpec, type ReactCustomBlockRenderProps } from '@blocknote/react';
import { MdGroup } from 'react-icons/md';

const teamBlockPropsDefinition = {
  ...defaultProps,
};

export const teamBlockConfig = {
  type: 'team' as const,
  name: 'Team Member',
  content: 'inline' as const,
  propSchema: teamBlockPropsDefinition,
  icon: MdGroup,
  placeholder: 'Enter team member details...',
} as const;

export type TeamBlockRenderProps = ReactCustomBlockRenderProps<
  typeof teamBlockConfig,
  InlineContentSchema,
  StyleSchema
>;

export const TeamBlockRenderComponent: React.FC<TeamBlockRenderProps> = (props) => {
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
    border: '1px dashed #ffc107',
    margin: '10px 0',
    backgroundColor: bgColorToDisplay,
    color: colorToDisplay,
  };

  const titleStyle: React.CSSProperties = {
    marginTop: 0,
    marginBottom: '5px',
    display: 'flex',
    alignItems: 'center',
    color: colorToDisplay !== 'inherit' && colorToDisplay !== darkTextColor ? colorToDisplay : '#b38600', // Default amber title
  };

  if (
    colorToDisplay === darkTextColor &&
    (bgColorToDisplay === 'transparent' || problematicLightBackgrounds.includes(bgPropLower))
  ) {
    titleStyle.color = darkTextColor;
  } else if (colorToDisplay !== 'inherit') {
    titleStyle.color = colorToDisplay;
  }

  return (
    <div data-team-block style={wrapperStyle}>
      <h4 style={titleStyle}>
        <MdGroup style={{ marginRight: '8px' }} /> Team Member / Section
      </h4>
      <div ref={props.contentRef} className="bn-inline-content" />
      {/* Placeholder for image, name, title inputs */}
    </div>
  );
};

export const teamBlockSpec = createReactBlockSpec(teamBlockConfig, {
  render: TeamBlockRenderComponent,
});
