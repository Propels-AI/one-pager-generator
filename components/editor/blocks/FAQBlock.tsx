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
import { BlockContainer } from '../BlockContainer';

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
};

export const faqBlockConfig = {
  type: 'faq' as const,
  name: 'FAQ List',
  content: 'none' as const,
  propSchema: faqPropsDefinition,
  icon: HelpCircle,
};

export const FaqBlockSpec = createReactBlockSpec(faqBlockConfig, {
  render: ({ block, editor }) => {
    let initialItems: FaqItemDefinition[] = [];
    try {
      initialItems = JSON.parse(block.props.items);
    } catch (e) {
      console.error('Failed to parse FAQ items from props', e);
    }

    const [isEditing, setIsEditing] = useState(false);
    const [currentItems, setCurrentItems] = useState<FaqItemDefinition[]>(initialItems);
    const [currentBackgroundColor, setCurrentBackgroundColor] = useState(
      block.props.backgroundColor || faqPropsDefinition.backgroundColor.default
    );

    // Effect to update local state if props change from outside (e.g., collab, undo/redo)
    useEffect(() => {
      try {
        setCurrentItems(JSON.parse(block.props.items));
      } catch (e) {
        setCurrentItems([]);
        console.error('Failed to parse FAQ items from props in useEffect', e);
      }
      setCurrentBackgroundColor(block.props.backgroundColor || faqPropsDefinition.backgroundColor.default);
    }, [block.props.items, block.props.backgroundColor]);

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

    const handleSave = () => {
      editor.updateBlock(block, {
        props: {
          items: JSON.stringify(currentItems),
          backgroundColor: currentBackgroundColor,
        },
      });
      setIsEditing(false);
    };

    const currentBlockBackgroundColor = block.props.backgroundColor || faqPropsDefinition.backgroundColor.default;

    return (
      <div className="relative group w-full">
        <div
          style={{
            backgroundColor: currentBlockBackgroundColor === 'transparent' ? undefined : currentBlockBackgroundColor,
          }}
        >
          <BlockContainer blockType="faq">
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
          </BlockContainer>
        </div>

        {editor.isEditable && (
          <Popover open={isEditing} onOpenChange={setIsEditing}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="absolute top-4 right-4 h-8 w-8 bg-white opacity-100 md:opacity-0 group-hover:md:opacity-100 transition-opacity duration-300 z-10"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[95vw] sm:w-[600px] md:w-[700px] lg:w-[800px] max-h-[70vh] overflow-y-auto p-4 space-y-4"
              side="top"
              align="end"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Edit FAQ List</h3>
                <Button onClick={handleSave} className="flex-shrink-0">
                  Save Changes
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="bgColor">Background Color</Label>
                  <Input
                    id="bgColor"
                    type="color"
                    value={currentBackgroundColor}
                    onChange={(e) => setCurrentBackgroundColor(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div>
                  <Label>FAQ Items</Label>
                  <div className="space-y-4 mt-2">
                    {currentItems.map((item, index) => (
                      <div key={item.id} className="border border-border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-muted-foreground">FAQ Item {index + 1}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-destructive hover:text-destructive h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <Label htmlFor={`question-${item.id}`}>Question</Label>
                            <Input
                              id={`question-${item.id}`}
                              value={item.question}
                              onChange={(e) => handleItemChange(index, 'question', e.target.value)}
                              placeholder="Enter question..."
                            />
                          </div>
                          <div>
                            <Label htmlFor={`answer-${item.id}`}>Answer</Label>
                            <Textarea
                              id={`answer-${item.id}`}
                              value={item.answer}
                              onChange={(e) => handleItemChange(index, 'answer', e.target.value)}
                              placeholder="Enter answer..."
                              className="min-h-[80px]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" onClick={addItem} className="w-full">
                      Add FAQ Item
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  },
});
