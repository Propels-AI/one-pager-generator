'use client';

import React from 'react';
import { defaultProps, type InlineContentSchema, type StyleSchema } from '@blocknote/core';
import { createReactBlockSpec, type ReactCustomBlockRenderProps } from '@blocknote/react';
import { MdPriceCheck } from 'react-icons/md';

const pricingBlockPropsDefinition = {
  ...defaultProps,
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
    border: '1px dashed #6f42c1', // Default purple border
    margin: '10px 0',
    backgroundColor: bgColorToDisplay,
    color: colorToDisplay,
  };

  const titleStyle: React.CSSProperties = {
    marginTop: 0,
    marginBottom: '5px',
    display: 'flex',
    alignItems: 'center',
    color: colorToDisplay !== 'inherit' && colorToDisplay !== darkTextColor ? colorToDisplay : '#492081', // Default purple title
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
    <div data-pricing-block style={wrapperStyle}>
      <h4 style={titleStyle}>
        <MdPriceCheck style={{ marginRight: '8px' }} /> Pricing Tier / Table
      </h4>
      <div ref={props.contentRef} className="bn-inline-content" />
      {/* Placeholder for price, features list, CTA button */}
    </div>
  );
};

export const pricingBlockSpec = createReactBlockSpec(pricingBlockConfig, {
  render: PricingBlockRenderComponent,
});
