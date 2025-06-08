'use client';

import React from 'react';
import { defaultProps, type InlineContentSchema, type StyleSchema } from '@blocknote/core';
import { createReactBlockSpec, type ReactCustomBlockRenderProps } from '@blocknote/react';
import { MdPhotoLibrary } from 'react-icons/md';

const galleryBlockPropsDefinition = {
  ...defaultProps,
  // imageURLs: { default: [] as string[] } // Example for later
};

export const galleryBlockConfig = {
  type: 'gallery' as const,
  name: 'Image Gallery',
  content: 'none' as const,
  propSchema: galleryBlockPropsDefinition,
  icon: MdPhotoLibrary,
  placeholder: 'Gallery block placeholder...',
} as const;

export type GalleryBlockRenderProps = ReactCustomBlockRenderProps<
  typeof galleryBlockConfig,
  InlineContentSchema, // Will be empty if content: 'none'
  StyleSchema
>;

export const GalleryBlockRenderComponent: React.FC<GalleryBlockRenderProps> = (props) => {
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
    border: '1px dashed #dc3545', // Default red border
    margin: '10px 0',
    backgroundColor: bgColorToDisplay,
    color: colorToDisplay, // Placeholder text will use this color
  };

  const titleStyle: React.CSSProperties = {
    marginTop: 0,
    marginBottom: '5px',
    display: 'flex',
    alignItems: 'center',
    color: colorToDisplay !== 'inherit' && colorToDisplay !== darkTextColor ? colorToDisplay : '#a71d2a', // Default red title
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
    <div data-gallery-block style={wrapperStyle}>
      <h4 style={titleStyle}>
        <MdPhotoLibrary style={{ marginRight: '8px' }} /> Image Gallery
      </h4>
      {/* Placeholder for image display and upload UI */}
      <p>Gallery content will be managed here. Add images via block settings.</p>
    </div>
  );
};

export const galleryBlockSpec = createReactBlockSpec(galleryBlockConfig, {
  render: GalleryBlockRenderComponent,
});
