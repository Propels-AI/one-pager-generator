'use client';

import React, { useState, useEffect } from 'react';
import { createReactBlockSpec } from '@blocknote/react';
import { MdAdsClick } from 'react-icons/md'; // Or your preferred icon
import { Pencil } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button as ShadButton } from '@/components/ui/button'; // Aliasing to avoid conflict with CTASection's Button
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BlockContainer } from '../BlockContainer';

// CTASection Component (from user request)
interface CTASectionProps {
  heading?: string;
  description?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonHref?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

function CTASection({
  // Renamed to avoid conflict with block name if any, and made it a regular function
  heading = 'Ready to get started?',
  description = 'Join thousands of users who are already using our platform.',
  primaryButtonText = 'Get Started',
  secondaryButtonText = 'Learn More',
  primaryButtonHref,
  secondaryButtonHref,
  onPrimaryClick,
  onSecondaryClick,
}: CTASectionProps) {
  const PrimaryButtonComponent = primaryButtonHref ? 'a' : 'button';
  const SecondaryButtonComponent = secondaryButtonHref ? 'a' : 'button';

  return (
    <BlockContainer>
      <div className="w-full px-4 text-center">
        {' '}
        {/* Changed for full width content */}
        <h2 className="text-2xl font-medium mb-3">{heading}</h2>
        <p className="text-muted-foreground leading-relaxed">{description}</p> {/* Increased mb-8 to mb-12 */}
        <div className="flex gap-3 justify-center mt-6">
          <ShadButton asChild={!!primaryButtonHref} onClick={onPrimaryClick}>
            <PrimaryButtonComponent {...(primaryButtonHref && { href: primaryButtonHref })}>
              {primaryButtonText}
            </PrimaryButtonComponent>
          </ShadButton>
          <ShadButton asChild={!!secondaryButtonHref} variant="ghost" onClick={onSecondaryClick}>
            <SecondaryButtonComponent {...(secondaryButtonHref && { href: secondaryButtonHref })}>
              {secondaryButtonText}
            </SecondaryButtonComponent>
          </ShadButton>
        </div>
      </div>
    </BlockContainer>
  );
}

// BlockNote Prop Schema Definition
const callToActionPropsDefinition = {
  heading: { default: 'Ready to get started?' as string },
  description: { default: 'Join thousands of users who are already using our platform.' as string },
  primaryButtonText: { default: 'Get Started' as string },
  primaryButtonHref: { default: '#' as string },
  secondaryButtonText: { default: 'Learn More' as string },
  secondaryButtonHref: { default: '#' as string },
};

// BlockNote Block Configuration
export const callToActionBlockConfig = {
  type: 'callToAction' as const,
  name: 'Call To Action Section',
  content: 'none' as const, // No direct block content, all managed by props
  propSchema: callToActionPropsDefinition,
  icon: MdAdsClick,
} as const;

// BlockNote React Component
export const CallToActionBlockSpec = createReactBlockSpec(callToActionBlockConfig, {
  render: ({ block, editor }) => {
    const [isEditing, setIsEditing] = useState(false);

    // State for editable fields
    const [currentHeading, setCurrentHeading] = useState(block.props.heading);
    const [currentDescription, setCurrentDescription] = useState(block.props.description);
    const [currentPrimaryButtonText, setCurrentPrimaryButtonText] = useState(block.props.primaryButtonText);
    const [currentPrimaryButtonHref, setCurrentPrimaryButtonHref] = useState(block.props.primaryButtonHref);
    const [currentSecondaryButtonText, setCurrentSecondaryButtonText] = useState(block.props.secondaryButtonText);
    const [currentSecondaryButtonHref, setCurrentSecondaryButtonHref] = useState(block.props.secondaryButtonHref);

    useEffect(() => {
      setCurrentHeading(block.props.heading);
      setCurrentDescription(block.props.description);
      setCurrentPrimaryButtonText(block.props.primaryButtonText);
      setCurrentPrimaryButtonHref(block.props.primaryButtonHref);
      setCurrentSecondaryButtonText(block.props.secondaryButtonText);
      setCurrentSecondaryButtonHref(block.props.secondaryButtonHref);
    }, [
      block.props.heading,
      block.props.description,
      block.props.primaryButtonText,
      block.props.primaryButtonHref,
      block.props.secondaryButtonText,
      block.props.secondaryButtonHref,
    ]);

    const handleSave = () => {
      editor.updateBlock(block, {
        props: {
          heading: currentHeading,
          description: currentDescription,
          primaryButtonText: currentPrimaryButtonText,
          primaryButtonHref: currentPrimaryButtonHref,
          secondaryButtonText: currentSecondaryButtonText,
          secondaryButtonHref: currentSecondaryButtonHref,
        },
      });
      setIsEditing(false);
    };

    return (
      <div className="relative group w-full">
        <CTASection
          heading={block.props.heading}
          description={block.props.description}
          primaryButtonText={block.props.primaryButtonText}
          primaryButtonHref={block.props.primaryButtonHref}
          secondaryButtonText={block.props.secondaryButtonText}
          secondaryButtonHref={block.props.secondaryButtonHref}
        />
        {editor.isEditable && (
          <Popover
            open={isEditing}
            onOpenChange={(open) => {
              setIsEditing(open);
              if (open) {
                // Sync with block props when opening
                setCurrentHeading(block.props.heading);
                setCurrentDescription(block.props.description);
                setCurrentPrimaryButtonText(block.props.primaryButtonText);
                setCurrentPrimaryButtonHref(block.props.primaryButtonHref);
                setCurrentSecondaryButtonText(block.props.secondaryButtonText);
                setCurrentSecondaryButtonHref(block.props.secondaryButtonHref);
              }
            }}
          >
            <PopoverTrigger asChild>
              <ShadButton
                variant="outline"
                size="icon"
                className="absolute top-4 right-4 h-8 w-8 bg-white opacity-100 md:opacity-0 group-hover:md:opacity-100 transition-opacity duration-300 z-10"
              >
                <Pencil className="h-4 w-4" />
              </ShadButton>
            </PopoverTrigger>
            <PopoverContent className="w-[500px] p-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <Label htmlFor="ctaHeading">Heading</Label>
                <Input id="ctaHeading" value={currentHeading} onChange={(e) => setCurrentHeading(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="ctaDescription">Description</Label>
                <Textarea
                  id="ctaDescription"
                  value={currentDescription}
                  onChange={(e) => setCurrentDescription(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ctaPrimaryBtnText">Primary Button Text</Label>
                <Input
                  id="ctaPrimaryBtnText"
                  value={currentPrimaryButtonText}
                  onChange={(e) => setCurrentPrimaryButtonText(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ctaPrimaryBtnHref">Primary Button URL</Label>
                <Input
                  id="ctaPrimaryBtnHref"
                  value={currentPrimaryButtonHref}
                  onChange={(e) => setCurrentPrimaryButtonHref(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ctaSecondaryBtnText">Secondary Button Text</Label>
                <Input
                  id="ctaSecondaryBtnText"
                  value={currentSecondaryButtonText}
                  onChange={(e) => setCurrentSecondaryButtonText(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ctaSecondaryBtnHref">Secondary Button URL</Label>
                <Input
                  id="ctaSecondaryBtnHref"
                  value={currentSecondaryButtonHref}
                  onChange={(e) => setCurrentSecondaryButtonHref(e.target.value)}
                />
              </div>
              <div className="my-4 border-t"></div>
              <ShadButton onClick={handleSave} className="w-full">
                Save
              </ShadButton>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  },
});
