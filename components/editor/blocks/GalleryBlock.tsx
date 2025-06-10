'use client';

import React from 'react';
import { defaultProps, type InlineContentSchema, type StyleSchema } from '@blocknote/core';
import { createReactBlockSpec, type ReactCustomBlockRenderProps } from '@blocknote/react';
import { MdPhotoLibrary } from 'react-icons/md';

const galleryBlockPropsDefinition = {
  ...defaultProps,
  name: { default: 'Gallery Section' as string },
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

  const galleryContentPlaceholderStyle: React.CSSProperties = {
    padding: '20px',
    border: '1px dashed #ccc',
    borderRadius: '6px',
    minHeight: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: '#777',
    fontSize: '0.9rem',
    backgroundColor: '#fafafa',
  };

  return (
    <div data-gallery-block style={wrapperStyle}>
      <div style={labelStyle}>Gallery Section</div>
      <h4 style={titleStyle}>
        <MdPhotoLibrary style={{ marginRight: '10px', fontSize: '1.3em' }} />{' '}
        {props.block.props.name || 'Image Gallery'}
      </h4>
      <div style={galleryContentPlaceholderStyle}>Gallery images and management UI will appear here.</div>
    </div>
  );
};

export const galleryBlockSpec = createReactBlockSpec(galleryBlockConfig, {
  render: GalleryBlockRenderComponent,
});
