'use client';

import React from 'react';
import { defaultProps, type InlineContentSchema, type StyleSchema } from '@blocknote/core';
import { createReactBlockSpec, type ReactCustomBlockRenderProps } from '@blocknote/react';
import { MdGroup } from 'react-icons/md';

const teamBlockPropsDefinition = {
  ...defaultProps,
  name: { default: 'Team Member Section' as string },
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
  // Removed dynamic color logic

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

  const titleStyle: React.CSSProperties = {
    marginTop: 0,
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#333',
  };

  return (
    <div data-team-block style={wrapperStyle}>
      <div style={labelStyle}>Team Section</div>
      <h4 style={titleStyle}>
        <MdGroup style={{ marginRight: '10px', fontSize: '1.3em' }} /> {props.block.props.name || 'Team Member / Section'}
      </h4>
      <div 
        ref={props.contentRef} 
        className="bn-inline-content" 
        style={{ 
          fontSize: '1rem', 
          lineHeight: '1.6' 
        }}
      />
      {/* Placeholder for image, name, title inputs can be developed here */}
    </div>
  );
};

export const teamBlockSpec = createReactBlockSpec(teamBlockConfig, {
  render: TeamBlockRenderComponent,
});
