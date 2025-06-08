'use client';

import React from 'react';
import { defaultProps, type InlineContentSchema, type StyleSchema } from '@blocknote/core';
import { createReactBlockSpec, type ReactCustomBlockRenderProps } from '@blocknote/react';
import { MdAdsClick } from 'react-icons/md';

const callToActionBlockPropsDefinition = {
  ...defaultProps,
  buttonText: { default: 'Learn More' as string },
  buttonURL: { default: '#' as string },
  // Add other props like alignment later
};

export const callToActionBlockConfig = {
  type: 'callToAction' as const,
  name: 'Call To Action',
  content: 'inline' as const, // Main text for CTA
  propSchema: callToActionBlockPropsDefinition,
  icon: MdAdsClick,
  placeholder: 'Enter compelling text for the call to action...',
} as const;

export type CallToActionBlockRenderProps = ReactCustomBlockRenderProps<
  typeof callToActionBlockConfig,
  InlineContentSchema,
  StyleSchema
>;

export const CallToActionBlockRenderComponent: React.FC<CallToActionBlockRenderProps> = (props) => {
  const { buttonText, buttonURL, textColor: tcProp, backgroundColor: bgProp } = props.block.props;

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
    padding: '20px',
    border: '2px solid #28a745', // Default green border
    margin: '10px 0',
    textAlign: 'center',
    backgroundColor: bgColorToDisplay,
    color: colorToDisplay,
  };

  // If a specific background color is chosen for the block, adjust border for visibility if needed
  if (bgProp !== 'default' && problematicLightBackgrounds.includes(bgPropLower)) {
    wrapperStyle.borderColor = '#adb5bd'; // A neutral grey border for light backgrounds
  } else if (bgProp !== 'default') {
    // Potentially adjust border based on dark backgrounds too, if needed
  }

  return (
    <div data-cta-block style={wrapperStyle}>
      <div ref={props.contentRef} className="bn-inline-content" style={{ marginBottom: '15px', fontSize: '1.1em' }} />
      <a
        href={buttonURL}
        onClick={(e) => {
          if (props.editor.isEditable) e.preventDefault();
        }} // Prevent navigation in editor
        style={{
          display: 'inline-block',
          padding: '10px 20px',
          backgroundColor: '#28a745', // Button color remains fixed for now
          color: 'white', // Button text color remains fixed for now
          textDecoration: 'none',
          borderRadius: '5px',
          fontWeight: 'bold',
        }}
      >
        {buttonText}
      </a>
    </div>
  );
};

export const callToActionBlockSpec = createReactBlockSpec(callToActionBlockConfig, {
  render: CallToActionBlockRenderComponent,
});
