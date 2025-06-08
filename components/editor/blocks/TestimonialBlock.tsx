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

  const textAlignment = block.props.textAlignment || 'left';
  const authorImageURL = block.props.authorImageURL || '';
  const companyLogoURL = block.props.companyLogoURL || '';

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
    event.stopPropagation();
  };

  const handleEditableBlur = (event: React.FocusEvent<HTMLElement>, propName: keyof typeof block.props) => {
    let newText = event.currentTarget.innerText;
    if (
      newText ===
        (propName === 'authorName' ? 'Author Name' : propName === 'authorTitle' ? 'Their Title' : 'Company Name') &&
      !block.props[propName]
    ) {
      newText = '';
    }

    if (newText !== block.props[propName]) {
      updateProp(propName, newText);
    }
  };

  const wrapperStyle: React.CSSProperties = {
    padding: '20px',
    borderLeft: '5px solid #ccc',
    margin: '16px 0',
    textAlign: textAlignment,
    backgroundColor:
      block.props.backgroundColor === 'default' || !block.props.backgroundColor
        ? 'transparent'
        : block.props.backgroundColor + '1A',
    color: block.props.textColor === 'default' || !block.props.textColor ? 'inherit' : block.props.textColor,
    borderRadius: '4px',
    position: 'relative',
  };

  const authorImageStyle: React.CSSProperties = {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    objectFit: 'cover',
    marginRight: '10px',
    display: authorImageURL ? 'inline-block' : 'none',
  };

  const companyLogoStyle: React.CSSProperties = {
    maxHeight: '40px',
    maxWidth: '100px',
    objectFit: 'contain',
    marginLeft: '10px',
    display: companyLogoURL ? 'inline-block' : 'none',
  };

  const authorInfoContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
  };

  const mainAttributionContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginTop: '15px',
    justifyContent: textAlignment === 'center' ? 'center' : textAlignment === 'right' ? 'flex-end' : 'flex-start',
  };

  const companyInfoStyle: React.CSSProperties = {
    fontSize: '0.8em',
    opacity: 0.7,
    // If company logo is present, add some margin to its left if company name is also there
    marginLeft: companyLogoURL && block.props.companyName ? '5px' : '0',
  };

  const quoteStyle: React.CSSProperties = {
    fontStyle: 'italic',
    marginBottom: '10px',
  };

  return (
    <div style={wrapperStyle} data-testimonial-block>
      <div style={quoteStyle} ref={contentRef} className="bn-inline-content" />
      <div style={mainAttributionContainerStyle}>
        {authorImageURL && (
          <img src={authorImageURL} alt={block.props.authorName || 'Author'} style={authorImageStyle} />
        )}
        <div style={authorInfoContainerStyle}>
          <div style={{ fontWeight: 'bold', margin: 0, fontSize: '0.95em', display: 'flex', alignItems: 'baseline' }}>
            <span style={{ marginRight: '0.25em' }}>—</span>
            <span
              style={{ outline: 'none' }}
              contentEditable={editor.isEditable}
              suppressContentEditableWarning={true}
              onBlur={(e) => handleEditableBlur(e, 'authorName')}
              onKeyDown={handleEditableKeyDown}
              key={`authorName-${block.id}-${block.props.authorName}`}
            >
              {block.props.authorName || (editor.isEditable ? 'Author Name' : 'Anonymous')}
            </span>
          </div>

          {/* Author Title - Editable */}
          <p
            style={{ fontSize: '0.85em', margin: 0, opacity: 0.8, outline: 'none' }}
            contentEditable={editor.isEditable}
            suppressContentEditableWarning={true}
            onBlur={(e) => handleEditableBlur(e, 'authorTitle')}
            onKeyDown={handleEditableKeyDown}
            key={`authorTitle-${block.id}-${block.props.authorTitle}`}
          >
            {block.props.authorTitle || (editor.isEditable ? 'Their Title' : '')}
          </p>

          {(block.props.companyName || companyLogoURL || editor.isEditable) && (
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '2px' }}>
              {/* Company Name - Editable */}
              <span
                style={{ ...companyInfoStyle, outline: 'none' }}
                contentEditable={editor.isEditable}
                suppressContentEditableWarning={true}
                onBlur={(e) => handleEditableBlur(e, 'companyName')}
                onKeyDown={handleEditableKeyDown}
                key={`companyName-${block.id}-${block.props.companyName}`}
              >
                {block.props.companyName || (editor.isEditable ? 'Company Name' : '')}
              </span>
              {/* Use block.props.companyName for the alt text */}
              {companyLogoURL && (
                <img
                  src={companyLogoURL}
                  alt={`${block.props.companyName || 'Company'} Logo`}
                  style={companyLogoStyle}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const testimonialBlockSpec = createReactBlockSpec(testimonialBlockConfig, {
  render: TestimonialBlockRenderComponent,
});
