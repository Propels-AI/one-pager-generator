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
  const { question } = props.block.props;

  const wrapperStyle: React.CSSProperties = {
    border: '1px solid #e0e0e0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    padding: '24px',
    margin: '16px 0',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    position: 'relative',
    textAlign: 'left',
  };

  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '8px',
    right: '12px',
    fontSize: '0.75rem',
    color: '#757575',
    fontWeight: '500',
    padding: '2px 6px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
  };

  const questionContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
  };

  const iconStyle: React.CSSProperties = {
    marginRight: '10px',
    fontSize: '1.3em',
    color: '#333',
  };

  const questionTextStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#333',
  };

  const answerStyle: React.CSSProperties = {
    fontSize: '1rem',
    lineHeight: '1.6',
    color: '#555',
    paddingLeft: 'calc(1.3em + 10px)',
  };

  return (
    <div data-faq-block style={wrapperStyle}>
      <div style={labelStyle}>FAQ Item</div>
      <div style={questionContainerStyle}>
        <MdQuestionAnswer style={iconStyle} />
        <p style={questionTextStyle}>{question}</p>
      </div>
      <div ref={props.contentRef} className="bn-inline-content" style={answerStyle} />
    </div>
  );
};

export const faqBlockSpec = createReactBlockSpec(faqBlockConfig, {
  render: FAQBlockRenderComponent,
});
