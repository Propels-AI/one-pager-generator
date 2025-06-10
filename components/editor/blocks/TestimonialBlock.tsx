'use client';

import React from 'react';
import {
  defaultProps,
  type InlineContentSchema,
  type StyleSchema,
  defaultBlockSpecs, // For accessing default prop structures
} from '@blocknote/core';
import { createReactBlockSpec, type ReactCustomBlockRenderProps } from '@blocknote/react';
import { MdFormatQuote } from 'react-icons/md';

const testimonialPropsDefinition = {
  cardTitle: { default: 'Testimonial' as string },
  ...defaultProps,
  authorName: {
    default: 'Anonymous' as string,
  },
  authorTitle: {
    default: '' as string,
  },
  authorImageURL: {
    default: '' as string, // URL for the author's image
  },
  companyName: {
    default: '' as string,
  },
  companyLogoURL: {
    default: '' as string,
  },
  textAlignment: {
    default: 'left' as const,
    values: ['left', 'center', 'right'] as const,
  },
  textColor: defaultBlockSpecs.heading.config.propSchema.textColor,
  backgroundColor: defaultBlockSpecs.heading.config.propSchema.backgroundColor,
};

export const testimonialBlockConfig = {
  type: 'testimonial' as const,
  name: 'Testimonial',
  content: 'inline' as const,
  propSchema: testimonialPropsDefinition,
  icon: MdFormatQuote,
  placeholder: 'Enter testimonial quote...',
} as const;

export type TestimonialBlockRenderProps = ReactCustomBlockRenderProps<
  typeof testimonialBlockConfig,
  InlineContentSchema,
  StyleSchema
>;

export const TestimonialBlockRenderComponent: React.FC<TestimonialBlockRenderProps> = (props) => {
  const { block, contentRef, editor } = props;
  const { authorName, authorTitle, companyName, authorImageURL, companyLogoURL, textAlignment, cardTitle } =
    block.props;

  const updateProp = (propName: keyof typeof block.props, value: string) => {
    editor.updateBlock(block, {
      props: { ...block.props, [propName]: value },
    });
  };

  const handleEditableKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      (event.target as HTMLElement).blur();
    }
  };

  const handleEditableBlur = (event: React.FocusEvent<HTMLElement>, propName: keyof typeof block.props) => {
    const newText = event.currentTarget.innerText.trim();
    if (newText !== block.props[propName]) {
      updateProp(propName, newText);
    }
  };

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
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#333',
  };

  const contentWrapperStyle: React.CSSProperties = {
    textAlign: textAlignment || 'left',
  };

  const quoteContentStyle: React.CSSProperties = {
    fontStyle: 'italic',
    fontSize: '1.1em',
    lineHeight: '1.7',
    color: '#444',
    marginBottom: '20px',
    paddingLeft: '20px',
    borderLeft: '3px solid #007bff',
    position: 'relative',
  };

  const authorDetailsContainerStyle: React.CSSProperties = {
    marginTop: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const authorImageStyle: React.CSSProperties = {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    objectFit: 'cover',
  };

  const authorInfoStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const editableSpanStyleBase: React.CSSProperties = {
    padding: '1px 2px',
    outline: 'none',
    borderBottom: '1px dashed transparent',
    minWidth: '50px',
    cursor: editor.isEditable ? 'text' : 'default',
    display: 'inline-block',
  };

  const authorNameSpanStyle: React.CSSProperties = {
    ...editableSpanStyleBase,
    fontWeight: 'bold',
    fontSize: '1rem',
    color: '#333',
  };

  const authorTitleSpanStyle: React.CSSProperties = {
    ...editableSpanStyleBase,
    fontSize: '0.9rem',
    color: '#555',
  };

  const companyNameSpanStyle: React.CSSProperties = {
    ...editableSpanStyleBase,
    fontSize: '0.85rem',
    color: '#777',
  };

  const getPlaceholderText = (currentValue: string | undefined, placeholder: string): string => {
    if (editor.isEditable) {
      return currentValue || '';
    }
    return currentValue || placeholder;
  };

  const companyLogoContainerStyle: React.CSSProperties = {
    marginTop: '10px',
    textAlign: textAlignment || 'left',
  };

  const companyLogoImgStyle: React.CSSProperties = {
    maxWidth: '120px',
    maxHeight: '40px',
    display: 'inline-block',
  };

  return (
    <div data-testimonial-block style={wrapperStyle}>
      <div style={labelStyle}>Testimonial Section</div>
      <h4 style={titleStyle}>
        <MdFormatQuote style={{ marginRight: '10px', fontSize: '1.3em' }} /> {cardTitle || 'Testimonial'}
      </h4>

      <div style={contentWrapperStyle}>
        <div ref={contentRef} className="bn-inline-content" style={quoteContentStyle} />
      </div>

      <div style={authorDetailsContainerStyle}>
        {authorImageURL && <img src={authorImageURL} alt={authorName || 'Author'} style={authorImageStyle} />}
        <div style={authorInfoStyle}>
          <span
            contentEditable={editor.isEditable}
            suppressContentEditableWarning={true}
            onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => handleEditableKeyDown(e)}
            onBlur={(e: React.FocusEvent<HTMLElement>) => handleEditableBlur(e, 'authorName')}
            style={authorNameSpanStyle}
            data-placeholder="Author Name"
          >
            {getPlaceholderText(authorName, 'Author Name')}
          </span>
          <span
            contentEditable={editor.isEditable}
            suppressContentEditableWarning={true}
            onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => handleEditableKeyDown(e)}
            onBlur={(e: React.FocusEvent<HTMLElement>) => handleEditableBlur(e, 'authorTitle')}
            style={authorTitleSpanStyle}
            data-placeholder="Author Title"
          >
            {getPlaceholderText(authorTitle, 'Author Title')}
          </span>
          <span
            contentEditable={editor.isEditable}
            suppressContentEditableWarning={true}
            onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => handleEditableKeyDown(e)}
            onBlur={(e: React.FocusEvent<HTMLElement>) => handleEditableBlur(e, 'companyName')}
            style={companyNameSpanStyle}
            data-placeholder="Company Name"
          >
            {getPlaceholderText(companyName, 'Company Name')}
          </span>
        </div>
      </div>

      {companyLogoURL && (
        <div style={companyLogoContainerStyle}>
          <img src={companyLogoURL} alt={companyName || 'Company Logo'} style={companyLogoImgStyle} />
        </div>
      )}
    </div>
  );
};

export const testimonialBlockSpec = createReactBlockSpec(testimonialBlockConfig, {
  render: TestimonialBlockRenderComponent,
});
