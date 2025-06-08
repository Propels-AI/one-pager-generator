'use client';

import React from 'react';
import { type BlockSchema, type InlineContentSchema, type StyleSchema, defaultProps } from '@blocknote/core';
import { createReactBlockSpec, type ReactCustomBlockRenderProps } from '@blocknote/react';
import { MdQuestionAnswer } from 'react-icons/md';

// FAQ block might contain nested blocks for Q&A pairs later.
// For now, it's a simple inline content block.
const faqBlockPropsDefinition = {
  ...defaultProps,
  question: { default: 'What is the question?' as string },
};

export const faqBlockConfig = {
  type: 'faq' as const,
  name: 'FAQ Item',
  content: 'inline' as const, // This will be the answer
  propSchema: faqBlockPropsDefinition,
  icon: MdQuestionAnswer,
  placeholder: 'Enter answer to the question...',
} as const;

export type FAQBlockRenderProps = ReactCustomBlockRenderProps<typeof faqBlockConfig, InlineContentSchema, StyleSchema>;

export const FAQBlockRenderComponent: React.FC<FAQBlockRenderProps> = (props) => {
  const { question, textColor: tcProp, backgroundColor: bgProp } = props.block.props;

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
    border: '1px dashed #17a2b8', // Default teal border
    margin: '10px 0',
    backgroundColor: bgColorToDisplay,
    color: colorToDisplay, // Answer text will use this color
  };

  const questionStyle: React.CSSProperties = {
    marginTop: 0,
    marginBottom: '5px',
    fontWeight: 'bold',
    color: colorToDisplay !== 'inherit' && colorToDisplay !== darkTextColor ? colorToDisplay : '#0f6674', // Default teal question text
  };

  if (
    colorToDisplay === darkTextColor &&
    (bgColorToDisplay === 'transparent' || problematicLightBackgrounds.includes(bgPropLower))
  ) {
    questionStyle.color = darkTextColor;
  } else if (colorToDisplay !== 'inherit') {
    questionStyle.color = colorToDisplay;
  }

  return (
    <div data-faq-block style={wrapperStyle}>
      <p style={questionStyle}>
        {/* Question would be editable via a toolbar/settings panel */}
        Q: {question}
      </p>
      <div ref={props.contentRef} className="bn-inline-content" />
    </div>
  );
};

export const faqBlockSpec = createReactBlockSpec(faqBlockConfig, {
  render: FAQBlockRenderComponent,
});
