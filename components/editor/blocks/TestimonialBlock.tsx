'use client';

import React, { useState } from 'react';
import { createReactBlockSpec } from '@blocknote/react';
import { defaultBlockSpecs } from '@blocknote/core';
import { MdFormatQuote } from 'react-icons/md';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ImageField from '@/components/ui/ImageField';
import { EditBlockPopover, FormField, FormSection, ItemCard } from '../EditBlockPopover';
import { BlockContainer } from '../BlockContainer';

interface SubTestimonialItem {
  id: string;
  quote: string;
  avatarUrl: string;
  authorName: string;
  authorTitle: string;
}

const testimonialPropsDefinition = {
  mainImageUrl: {
    default: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg',
  },
  mainQuote: {
    default:
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Atque eveniet suscipit corporis sequi usdam alias fugiat iusto perspiciatis.',
  },
  mainAuthorName: {
    default: 'John Doe',
  },
  mainAuthorTitle: {
    default: 'CEO, Company Name',
  },
  subItems: {
    default: '[]',
  },
};

export const testimonialBlockConfig = {
  type: 'testimonial' as const,
  name: 'Testimonial Section',
  content: 'none' as const,
  propSchema: testimonialPropsDefinition,
  icon: MdFormatQuote,
};

export const testimonialBlockSpec = createReactBlockSpec(testimonialBlockConfig, {
  render: ({ block, editor }) => {
    const { mainImageUrl, mainQuote, mainAuthorName, mainAuthorTitle } = block.props;
    let subItemsArray: SubTestimonialItem[] = [];
    try {
      subItemsArray = JSON.parse(block.props.subItems);
    } catch (e) {
      console.error('Failed to parse subItems from props', e);
    }

    const staticContent = (
      <BlockContainer>
        <div className="container mx-auto">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 items-stretch gap-x-0 gap-y-4 lg:grid-cols-3 lg:gap-4">
              {mainImageUrl && (
                <img
                  src={mainImageUrl}
                  alt="Main testimonial visual"
                  className="h-72 w-full rounded-md object-cover lg:h-auto"
                />
              )}
              <Card className="col-span-2 flex items-center justify-center p-6">
                <div className="flex flex-col gap-4">
                  <q className="text-xl font-medium lg:text-3xl">{mainQuote}</q>
                  <div className="flex flex-col items-start">
                    <p className="font-semibold">{mainAuthorName}</p>
                    <p className="text-muted-foreground">{mainAuthorTitle}</p>
                  </div>
                </div>
              </Card>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {subItemsArray.map((item: SubTestimonialItem) => (
                <Card
                  key={item.id}
                  className="w-full md:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)] flex-grow-0 flex-shrink-0"
                >
                  <CardContent className="px-6 pt-6 leading-7 text-foreground/70 h-full flex flex-col">
                    <q className="flex-grow">{item.quote}</q>
                  </CardContent>
                  <CardFooter>
                    <div className="flex gap-4 leading-5 items-center">
                      <Avatar className="size-9 rounded-full ring-1 ring-input">
                        {item.avatarUrl && <AvatarImage src={item.avatarUrl} alt={item.authorName} />}
                        <AvatarFallback>{(item.authorName || 'A').substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <p className="font-medium">{item.authorName}</p>
                        <p className="text-muted-foreground">{item.authorTitle}</p>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </BlockContainer>
    );

    if (!editor.isEditable) {
      return staticContent;
    }

    const [isEditing, setIsEditing] = useState(false);
    const [currentMainImageUrl, setCurrentMainImageUrl] = useState(block.props.mainImageUrl);
    const [currentMainQuote, setCurrentMainQuote] = useState(block.props.mainQuote);
    const [currentMainAuthorName, setCurrentMainAuthorName] = useState(block.props.mainAuthorName);
    const [currentMainAuthorTitle, setCurrentMainAuthorTitle] = useState(block.props.mainAuthorTitle);
    const [currentSubItems, setCurrentSubItems] = useState<SubTestimonialItem[]>([]);

    React.useEffect(() => {
      if (isEditing) {
        setCurrentMainImageUrl(block.props.mainImageUrl);
        setCurrentMainQuote(block.props.mainQuote);
        setCurrentMainAuthorName(block.props.mainAuthorName);
        setCurrentMainAuthorTitle(block.props.mainAuthorTitle);
        setCurrentSubItems(subItemsArray);
      }
    }, [isEditing, block.props]);

    const handleSubItemChange = (index: number, field: keyof SubTestimonialItem, value: string) => {
      const updatedItems = [...currentSubItems];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      setCurrentSubItems(updatedItems);
    };

    const addSubItem = () => {
      const newItem: SubTestimonialItem = {
        id: `temp-${Date.now()}`,
        quote: '',
        avatarUrl: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-2.svg',
        authorName: '',
        authorTitle: '',
      };
      setCurrentSubItems([...currentSubItems, newItem]);
    };

    const removeSubItem = (index: number) => {
      const updatedItems = currentSubItems.filter((_, i) => i !== index);
      setCurrentSubItems(updatedItems);
    };

    return (
      <div className="relative group">
        {staticContent}
        {editor.isEditable && (
          <EditBlockPopover
            isOpen={isEditing}
            onOpenChange={setIsEditing}
            onSave={() => {
              editor.updateBlock(block, {
                props: {
                  mainImageUrl: currentMainImageUrl,
                  mainQuote: currentMainQuote,
                  mainAuthorName: currentMainAuthorName,
                  mainAuthorTitle: currentMainAuthorTitle,
                  subItems: JSON.stringify(currentSubItems),
                },
              });
              setIsEditing(false);
            }}
            width="lg"
          >
            <FormField>
              <ImageField
                label="Main Testimonial Image"
                value={currentMainImageUrl}
                onChange={setCurrentMainImageUrl}
                metadata={{ blockType: 'testimonial', onePagerId: block.id }}
                placeholder="Upload main testimonial image"
              />
            </FormField>
            <FormField>
              <Label htmlFor="mainQuote">Main Quote</Label>
              <Input id="mainQuote" value={currentMainQuote} onChange={(e) => setCurrentMainQuote(e.target.value)} />
            </FormField>
            <FormField>
              <Label htmlFor="mainAuthorName">Author Name</Label>
              <Input
                id="mainAuthorName"
                value={currentMainAuthorName}
                onChange={(e) => setCurrentMainAuthorName(e.target.value)}
              />
            </FormField>
            <FormField>
              <Label htmlFor="mainAuthorTitle">Author Title</Label>
              <Input
                id="mainAuthorTitle"
                value={currentMainAuthorTitle}
                onChange={(e) => setCurrentMainAuthorTitle(e.target.value)}
              />
            </FormField>

            <FormSection title="Sub-Testimonials">
              {currentSubItems.map((item, index) => (
                <ItemCard key={item.id} onRemove={() => removeSubItem(index)}>
                  <FormField>
                    <Label>Quote</Label>
                    <Input value={item.quote} onChange={(e) => handleSubItemChange(index, 'quote', e.target.value)} />
                  </FormField>
                  <FormField>
                    <div className="w-full flex justify-center">
                      <div className="max-w-sm">
                        <ImageField
                          label="Avatar Image"
                          value={item.avatarUrl}
                          onChange={(url) => handleSubItemChange(index, 'avatarUrl', url)}
                          metadata={{ blockType: 'testimonial-avatar', onePagerId: block.id }}
                          placeholder="Upload testimonial avatar"
                        />
                      </div>
                    </div>
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField>
                      <Label>Author Name</Label>
                      <Input
                        value={item.authorName}
                        onChange={(e) => handleSubItemChange(index, 'authorName', e.target.value)}
                      />
                    </FormField>
                    <FormField>
                      <Label>Author Title</Label>
                      <Input
                        value={item.authorTitle}
                        onChange={(e) => handleSubItemChange(index, 'authorTitle', e.target.value)}
                      />
                    </FormField>
                  </div>
                </ItemCard>
              ))}
              <Button variant="outline" className="mt-4 w-full" onClick={addSubItem}>
                Add Testimonial
              </Button>
            </FormSection>
          </EditBlockPopover>
        )}
      </div>
    );
  },
});
