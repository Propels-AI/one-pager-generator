'use client';

import React, { useState, useEffect } from 'react';
import { createReactBlockSpec } from '@blocknote/react';
import { Images } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageField from '@/components/ui/ImageField';
import { EditBlockPopover, FormField, FormSection, ItemCard } from '../EditBlockPopover';
import { BlockContainer } from '../BlockContainer';

// Interfaces
interface CarouselImage {
  id: string;
  src: string;
  alt: string;
}

interface ImageCarouselDisplayProps {
  images: CarouselImage[];
  autoPlay: boolean;
  interval: number;
  size: string;
}

// Size options for the carousel
const sizeClasses = {
  small: 'max-w-md',
  medium: 'max-w-2xl',
  large: 'max-w-4xl',
  fullWidth: 'max-w-full',
};

// Display Component
const ImageCarouselDisplay: React.FC<ImageCarouselDisplayProps> = ({ images, autoPlay, interval, size }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoPlay || images.length <= 1) return;

    const intervalId = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(intervalId);
  }, [autoPlay, interval, images.length]);

  if (images.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <Images className="mx-auto h-12 w-12 mb-4" />
        <p>No images added to carousel yet</p>
      </div>
    );
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const containerSizeClass = sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.large;

  return (
    <BlockContainer>
      <div className="container mx-auto px-4">
        <div className={`${containerSizeClass} mx-auto`}>
          <div className="relative">
            {/* Main carousel */}
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg">
              <img
                src={images[currentIndex]?.src || '/placeholder.svg'}
                alt={images[currentIndex]?.alt || 'Carousel image'}
                className="w-full h-full object-cover"
              />

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
                    aria-label="Previous image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
                    aria-label="Next image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Slide indicators */}
            {images.length > 1 && (
              <div className="flex justify-center mt-4 gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2 rounded-full transition-all ${
                      currentIndex === index ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </BlockContainer>
  );
};

// Default images data
const defaultImages: CarouselImage[] = [
  {
    id: '1',
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop',
    alt: 'Beautiful landscape 1',
  },
  {
    id: '2',
    src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=500&fit=crop',
    alt: 'Beautiful landscape 2',
  },
  {
    id: '3',
    src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=500&fit=crop',
    alt: 'Beautiful landscape 3',
  },
];

// BlockNote Prop Schema
const imageCarouselPropsDefinition = {
  images: { default: JSON.stringify(defaultImages) as string },
  autoPlay: { default: true as boolean },
  interval: { default: 5000 as number },
  size: { default: 'large' as string },
};

// BlockNote Block Configuration
export const imageCarouselBlockConfig = {
  type: 'imageCarousel' as const,
  name: 'Image Carousel',
  content: 'none' as const,
  propSchema: imageCarouselPropsDefinition,
  icon: Images,
} as const;

// BlockNote React Component
export const ImageCarouselBlockSpec = createReactBlockSpec(imageCarouselBlockConfig, {
  render: ({ block, editor }) => {
    const [isEditing, setIsEditing] = useState(false);

    const [currentImages, setCurrentImages] = useState<CarouselImage[]>([]);
    const [currentAutoPlay, setCurrentAutoPlay] = useState(block.props.autoPlay);
    const [currentInterval, setCurrentInterval] = useState(block.props.interval);
    const [currentSize, setCurrentSize] = useState(block.props.size);

    useEffect(() => {
      setCurrentAutoPlay(block.props.autoPlay);
      setCurrentInterval(block.props.interval);
      setCurrentSize(block.props.size);
      try {
        setCurrentImages(JSON.parse(block.props.images));
      } catch (e) {
        console.error('Failed to parse images from props', e);
        setCurrentImages(defaultImages); // Fallback to default
      }
    }, [block.props]);

    const handleImageChange = (index: number, field: keyof CarouselImage, value: string) => {
      const updatedImages = [...currentImages];
      updatedImages[index] = { ...updatedImages[index], [field]: value };
      setCurrentImages(updatedImages);
    };

    const addImage = () => {
      setCurrentImages([
        ...currentImages,
        {
          id: crypto.randomUUID(),
          src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop',
          alt: 'New image',
        },
      ]);
    };

    const removeImage = (idToRemove: string) => {
      setCurrentImages(currentImages.filter((image) => image.id !== idToRemove));
    };

    const handleSave = () => {
      editor.updateBlock(block, {
        props: {
          images: JSON.stringify(currentImages),
          autoPlay: currentAutoPlay,
          interval: currentInterval,
          size: currentSize,
        },
      });
      setIsEditing(false);
    };

    let parsedImages: CarouselImage[] = defaultImages;
    try {
      parsedImages = JSON.parse(block.props.images);
    } catch (e) {
      console.error('Failed to parse images for display, using default.', e);
    }

    return (
      <div className="relative group w-full">
        <ImageCarouselDisplay
          images={parsedImages}
          autoPlay={block.props.autoPlay}
          interval={block.props.interval}
          size={block.props.size}
        />
        {editor.isEditable && (
          <EditBlockPopover
            isOpen={isEditing}
            onOpenChange={(open: boolean) => {
              setIsEditing(open);
              if (open) {
                setCurrentAutoPlay(block.props.autoPlay);
                setCurrentInterval(block.props.interval);
                setCurrentSize(block.props.size);
                try {
                  setCurrentImages(JSON.parse(block.props.images));
                } catch (e) {
                  setCurrentImages(defaultImages);
                }
              }
            }}
            onSave={handleSave}
            width="xl"
          >
            <FormField>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoplay"
                  checked={currentAutoPlay}
                  onChange={(e) => setCurrentAutoPlay(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="autoplay">Auto-play carousel</Label>
              </div>
            </FormField>

            <FormField>
              <Label htmlFor="interval">Interval (milliseconds)</Label>
              <Input
                id="interval"
                type="number"
                value={currentInterval}
                onChange={(e) => setCurrentInterval(Number(e.target.value))}
                min="1000"
                step="500"
              />
            </FormField>

            <FormField>
              <Label htmlFor="size">Carousel Size</Label>
              <Select value={currentSize} onValueChange={setCurrentSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select carousel size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (384px)</SelectItem>
                  <SelectItem value="medium">Medium (672px)</SelectItem>
                  <SelectItem value="large">Large (896px)</SelectItem>
                  <SelectItem value="fullWidth">Full Width</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormSection title="Carousel Images">
              {currentImages.map((image, index) => (
                <ItemCard key={image.id} onRemove={() => removeImage(image.id)}>
                  <FormField>
                    <Label htmlFor={`imageAlt-${image.id}`}>Image Description</Label>
                    <Input
                      id={`imageAlt-${image.id}`}
                      value={image.alt}
                      onChange={(e) => handleImageChange(index, 'alt', e.target.value)}
                      placeholder="Describe this image"
                    />
                  </FormField>
                  <FormField>
                    <div className="w-full flex justify-center">
                      <div className="max-w-sm">
                        <ImageField
                          label="Carousel Image"
                          value={image.src}
                          onChange={(url) => handleImageChange(index, 'src', url)}
                          metadata={{ blockType: 'carousel', onePagerId: block.id }}
                          placeholder="Upload carousel image"
                        />
                      </div>
                    </div>
                  </FormField>
                </ItemCard>
              ))}
              <Button variant="outline" className="mt-2 w-full" onClick={addImage}>
                Add Image
              </Button>
            </FormSection>
          </EditBlockPopover>
        )}
      </div>
    );
  },
});
