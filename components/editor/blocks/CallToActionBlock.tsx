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
  content: 'inline' as const,
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
  const { buttonText, buttonURL } = props.block.props;

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

  return (
    <div data-cta-block style={wrapperStyle}>
      <div style={labelStyle}>Call to Action Section</div>
      <div
        ref={props.contentRef}
        className="bn-inline-content"
        style={{
          marginBottom: '20px',
          fontSize: '1rem',
          lineHeight: '1.6',
        }}
      />
      <div style={{ textAlign: 'center' }}>
        <a
          href={buttonURL}
          onClick={(e) => {
            if (props.editor.isEditable) e.preventDefault();
          }}
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            transition: 'background-color 0.2s ease-in-out',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#007bff')}
        >
          {buttonText}
        </a>
      </div>
    </div>
  );
};

export const callToActionBlockSpec = createReactBlockSpec(callToActionBlockConfig, {
  render: CallToActionBlockRenderComponent,
});
