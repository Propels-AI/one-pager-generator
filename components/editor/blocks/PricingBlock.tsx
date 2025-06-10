'use client';

import React from 'react';
import { defaultProps, type InlineContentSchema, type StyleSchema } from '@blocknote/core';
import { createReactBlockSpec, type ReactCustomBlockRenderProps } from '@blocknote/react';
import { MdPriceCheck } from 'react-icons/md';

const pricingBlockPropsDefinition = {
  ...defaultProps,
  name: { default: 'Pricing Section' as string },
  // Props for plan name, price, features list, button text/URL etc.
};

export const pricingBlockConfig = {
  type: 'pricing' as const,
  name: 'Pricing Tier',
  content: 'inline' as const,
  propSchema: pricingBlockPropsDefinition,
  icon: MdPriceCheck,
  placeholder: 'Describe pricing tier...',
} as const;

export type PricingBlockRenderProps = ReactCustomBlockRenderProps<
  typeof pricingBlockConfig,
  InlineContentSchema,
  StyleSchema
>;

export const PricingBlockRenderComponent: React.FC<PricingBlockRenderProps> = (props) => {
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
    <div data-pricing-block style={wrapperStyle}>
      <div style={labelStyle}>Pricing Section</div>
      <h4 style={titleStyle}>
        <MdPriceCheck style={{ marginRight: '10px', fontSize: '1.3em' }} /> {props.block.props.name || 'Pricing Tier / Table'}
      </h4>
      <div 
        ref={props.contentRef} 
        className="bn-inline-content" 
        style={{ 
          fontSize: '1rem', 
          lineHeight: '1.6' 
        }}
      />
      {/* Placeholder for detailed pricing structure */}
    </div>
  );
};

export const pricingBlockSpec = createReactBlockSpec(pricingBlockConfig, {
  render: PricingBlockRenderComponent,
});
