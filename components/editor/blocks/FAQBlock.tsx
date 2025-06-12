'use client';

import React, { useState, useEffect } from 'react';
import { createReactBlockSpec } from '@blocknote/react';
import { HelpCircle, Pencil, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface FaqItemDefinition {
  id: string;
  question: string;
  answer: string;
}

// Helper function for color contrast
const getLuminance = (hexColor: string): number => {
  if (!hexColor.startsWith('#') || (hexColor.length !== 4 && hexColor.length !== 7)) return 255; // Treat invalid as white
  const hex = hexColor.slice(1);
  const numericValue = parseInt(hex, 16);
  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else {
    r = (numericValue >> 16) & 0xff;
    g = (numericValue >> 8) & 0xff;
    b = numericValue & 0xff;
  }
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const isColorLight = (hexColor: string): boolean => {
  if (!hexColor || hexColor === 'transparent') return true;
  try {
    return getLuminance(hexColor) > 140; // Adjusted threshold for better differentiation
  } catch (e) {
    return true;
  }
};

const getEffectiveTextColor = (
  blockBgColor: string | undefined,
  blockTextColor: string | undefined,
  defaultDarkColor: string = '#1E1E1E',
  defaultLightColor: string = '#FFFFFF'
): string => {
  const actualBgColor = blockBgColor === 'transparent' ? '#FFFFFF' : blockBgColor || '#FFFFFF';
  const bgIsLight = isColorLight(actualBgColor);

  if (blockTextColor && blockTextColor !== 'default' && blockTextColor !== 'transparent') {
    const textIsLight = isColorLight(blockTextColor);
    if (bgIsLight && textIsLight) {
      return defaultDarkColor; // Light text on light bg -> dark text
    }
    if (!bgIsLight && !textIsLight) {
      return defaultLightColor; // Dark text on dark bg -> light text
    }
    return blockTextColor; // User's choice is fine
  }
  // Default text color based on background
  return bgIsLight ? defaultDarkColor : defaultLightColor;
};

const faqPropsDefinition = {
  heading: {
    default: 'Frequently Asked Questions',
  },
  items: {
    default: JSON.stringify([
      {
        id: crypto.randomUUID(),
        question: 'What is a FAQ?',
        answer: 'A FAQ is a list of frequently asked questions and answers on a particular topic.',
      },
      {
        id: crypto.randomUUID(),
        question: 'What is the purpose of a FAQ?',
        answer:
          'The purpose of a FAQ is to provide answers to common questions and help users find the information they need quickly and easily.',
      },
      {
        id: crypto.randomUUID(),
        question: 'How do I create a FAQ?',
        answer:
          'To create a FAQ, you need to compile a list of common questions and answers on a particular topic and organize them in a clear and easy-to-navigate format.',
      },
    ]),
  },
  backgroundColor: {
    default: '#FFFFFF',
  },
  headingTextColor: {
    default: '#1E1E1E',
  },
};

export const faqBlockConfig = {
  type: 'faq' as const,
  name: 'FAQ Section',
  content: 'none' as const,
  propSchema: faqPropsDefinition,
  icon: HelpCircle,
};

export const FaqBlockSpec = createReactBlockSpec(faqBlockConfig, {
  render: ({ block, editor }) => {
    const initialHeading = block.props.heading;
    let initialItems: FaqItemDefinition[] = [];
    try {
      initialItems = JSON.parse(block.props.items);
    } catch (e) {
      console.error('Failed to parse FAQ items from props', e);
    }

    const [isEditing, setIsEditing] = useState(false);
    const [currentHeading, setCurrentHeading] = useState(initialHeading);
    const [currentItems, setCurrentItems] = useState<FaqItemDefinition[]>(initialItems);
    const [currentBackgroundColor, setCurrentBackgroundColor] = useState(
      block.props.backgroundColor || faqPropsDefinition.backgroundColor.default
    );
    const [currentHeadingTextColor, setCurrentHeadingTextColor] = useState(
      block.props.headingTextColor || faqPropsDefinition.headingTextColor.default
    );

    // Effect to update local state if props change from outside (e.g., collab, undo/redo)
    useEffect(() => {
      setCurrentHeading(block.props.heading);
      try {
        setCurrentItems(JSON.parse(block.props.items));
      } catch (e) {
        setCurrentItems([]);
        console.error('Failed to parse FAQ items from props in useEffect', e);
      }
      setCurrentBackgroundColor(block.props.backgroundColor || faqPropsDefinition.backgroundColor.default);
      setCurrentHeadingTextColor(block.props.headingTextColor || faqPropsDefinition.headingTextColor.default);
    }, [block.props.heading, block.props.items, block.props.backgroundColor, block.props.headingTextColor]);

    // Effect to sync local editing state to component display state when not editing
    // This ensures the static display updates immediately after closing the popover
    useEffect(() => {
      if (!isEditing) {
        // This part is for display only, so it uses the direct props for rendering staticContent
      }
    }, [isEditing, block.props.heading, block.props.items]);

    const handleItemChange = (index: number, field: keyof Omit<FaqItemDefinition, 'id'>, value: string) => {
      const updatedItems = [...currentItems];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      setCurrentItems(updatedItems);
    };

    const addItem = () => {
      setCurrentItems([...currentItems, { id: crypto.randomUUID(), question: 'New Question', answer: 'New Answer' }]);
    };

    const removeItem = (idToRemove: string) => {
      setCurrentItems(currentItems.filter((item) => item.id !== idToRemove));
    };

    const effectiveHeadingColor = getEffectiveTextColor(block.props.backgroundColor, block.props.headingTextColor);
    const currentBlockBackgroundColor = block.props.backgroundColor || faqPropsDefinition.backgroundColor.default;

    return (
      <div
        className="relative group w-full py-8"
        style={{
          backgroundColor: currentBlockBackgroundColor === 'transparent' ? undefined : currentBlockBackgroundColor,
        }}
      >
        <h2 className="mb-4 text-4xl font-semibold md:mb-8 md:text-5xl px-4" style={{ color: effectiveHeadingColor }}>
          {block.props.heading}
        </h2>
        {(JSON.parse(block.props.items) as FaqItemDefinition[]).length > 0 ? (
          <Accordion type="single" collapsible className="w-full px-4">
            {(JSON.parse(block.props.items) as FaqItemDefinition[]).map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-muted-foreground px-4">No FAQ items yet. Click edit to add some!</p>
        )}

        {editor.isEditable && (
          <Popover
            open={isEditing}
            onOpenChange={(open) => {
              setIsEditing(open);
              if (open) {
                // When opening popover, sync local state with block props
                setCurrentHeading(block.props.heading);
                try {
                  setCurrentItems(JSON.parse(block.props.items));
                } catch (e) {
                  setCurrentItems([]);
                }
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="absolute top-4 right-4 h-8 w-8 bg-white opacity-100 md:opacity-0 group-hover:md:opacity-100 transition-opacity duration-300 z-10"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[500px] p-4" side="bottom" align="center">
              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                  <h4 className="font-medium leading-none mb-4">Edit Heading</h4>
                  <div className="grid gap-2">
                    <Label htmlFor="faqHeading">Heading Text</Label>
                    <Input id="faqHeading" value={currentHeading} onChange={(e) => setCurrentHeading(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="grid gap-2">
                      <Label htmlFor="faqBgColor">Background Color</Label>
                      <Input
                        id="faqBgColor"
                        type="color"
                        value={currentBackgroundColor}
                        onChange={(e) => setCurrentBackgroundColor(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="faqHeadingTextColor">Heading Text Color</Label>
                      <Input
                        id="faqHeadingTextColor"
                        type="color"
                        value={currentHeadingTextColor}
                        onChange={(e) => setCurrentHeadingTextColor(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium leading-none mb-4">Edit FAQ Items</h4>
                  <div className="space-y-4">
                    {currentItems.map((item, index) => (
                      <div key={item.id} className="p-4 border rounded-md space-y-3 relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7 text-black"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="grid gap-2">
                          <Label htmlFor={`faqQuestion-${item.id}`}>Question</Label>
                          <Input
                            id={`faqQuestion-${item.id}`}
                            value={item.question}
                            onChange={(e) => handleItemChange(index, 'question', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`faqAnswer-${item.id}`}>Answer</Label>
                          <Textarea
                            id={`faqAnswer-${item.id}`}
                            value={item.answer}
                            onChange={(e) => handleItemChange(index, 'answer', e.target.value)}
                            className="min-h-[80px]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="mt-4 w-full" onClick={addItem}>
                    Add FAQ Item
                  </Button>
                </div>

                <div className="my-4 border-t"></div>
                <Button
                  onClick={() => {
                    editor.updateBlock(block, {
                      props: {
                        heading: currentHeading,
                        items: JSON.stringify(currentItems),
                        backgroundColor: currentBackgroundColor,
                        headingTextColor: currentHeadingTextColor,
                      },
                    });
                    setIsEditing(false);
                  }}
                  className="w-full"
                >
                  Save
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  },
});
