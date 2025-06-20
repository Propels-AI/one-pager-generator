'use client';

import React, { useState, useEffect } from 'react';
import { createReactBlockSpec } from '@blocknote/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { EditBlockPopover, FormField, FormSection } from '../EditBlockPopover';
import { BlockContainer } from '../BlockContainer';

// Interface for individual timeline events
interface TimelineEvent {
  id: string;
  phase: string;
  date: string;
  description: string;
}

// Default timeline data - fixed at 4 phases
const defaultTimelineEvents: TimelineEvent[] = [
  {
    id: crypto.randomUUID(),
    phase: 'Phase I',
    date: 'January 15, 2024',
    description: 'Initial data collection and model architecture design for the AI system.',
  },
  {
    id: crypto.randomUUID(),
    phase: 'Phase II',
    date: 'March 30, 2024',
    description: 'Model training and validation with core dataset implementation.',
  },
  {
    id: crypto.randomUUID(),
    phase: 'Phase III',
    date: 'June 15, 2024',
    description: 'Integration of advanced features and performance optimization.',
  },
  {
    id: crypto.randomUUID(),
    phase: 'Phase IV',
    date: 'September 1, 2024',
    description: 'Final testing, deployment, and continuous improvement system launch.',
  },
];

// Date picker component
const DatePicker = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}) => {
  const [date, setDate] = useState<Date | undefined>();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (value) {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        setDate(parsedDate);
      }
    }
  }, [value]);

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      onChange(format(selectedDate, 'MMMM dd, yyyy'));
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'MMMM dd, yyyy') : <span>{placeholder || 'Pick a date'}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          captionLayout="dropdown"
          fromYear={2000}
          toYear={2050}
        />
      </PopoverContent>
    </Popover>
  );
};

export const timelinePropsDefinition = {
  events: {
    default: JSON.stringify(defaultTimelineEvents) as string,
  },
};

export const TimelineBlockSpec = createReactBlockSpec(
  {
    type: 'timeline' as const,
    propSchema: timelinePropsDefinition,
    content: 'none',
  },
  {
    render: ({ block, editor }) => {
      const [isEditing, setIsEditing] = useState(false);
      const [currentEvents, setCurrentEvents] = useState<TimelineEvent[]>(() => {
        try {
          const parsed = JSON.parse(block.props.events);
          // Ensure we always have exactly 4 events
          if (Array.isArray(parsed) && parsed.length === 4) {
            return parsed;
          }
          return defaultTimelineEvents;
        } catch {
          return defaultTimelineEvents;
        }
      });

      useEffect(() => {
        try {
          const parsedEvents = JSON.parse(block.props.events);
          // Ensure we always have exactly 4 events
          if (Array.isArray(parsedEvents) && parsedEvents.length === 4) {
            setCurrentEvents(parsedEvents);
          } else {
            setCurrentEvents(defaultTimelineEvents);
          }
        } catch (e) {
          setCurrentEvents(defaultTimelineEvents);
        }
      }, [block.props.events]);

      const handleSave = () => {
        editor.updateBlock(block, {
          props: {
            events: JSON.stringify(currentEvents),
          },
        });
        setIsEditing(false);
      };

      const updateEvent = (index: number, field: keyof TimelineEvent, value: string) => {
        const updatedEvents = [...currentEvents];
        updatedEvents[index] = { ...updatedEvents[index], [field]: value };
        setCurrentEvents(updatedEvents);
      };

      const displayedEvents: TimelineEvent[] = JSON.parse(block.props.events);

      return (
        <div className="relative group w-full">
          <BlockContainer blockType="timeline">
            <div className="max-w-6xl mx-auto px-4">
              {/* Desktop Timeline */}
              <div className="hidden md:block">
                <div className="relative">
                  <div className="absolute top-1.5 left-0 right-0 h-0.5 bg-black"></div>
                  <div className="grid grid-cols-4 gap-8">
                    {displayedEvents.map((item, index) => (
                      <div key={item.id} className="relative">
                        <div className="w-3 h-3 bg-white border-2 border-black rounded-full relative z-10"></div>
                        <div className="mt-6 space-y-2">
                          <div className="text-sm text-gray-600">{item.date}</div>
                          <h3 className="text-lg font-bold text-black">{item.phase}</h3>
                          <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Timeline */}
              <div className="md:hidden">
                <div className="relative pl-8">
                  <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-black"></div>
                  <div className="space-y-12">
                    {displayedEvents.map((item, index) => (
                      <div key={item.id} className="relative">
                        <div className="absolute -left-7 w-3 h-3 bg-white border-2 border-black rounded-full"></div>
                        <div className="space-y-2">
                          <div className="text-sm text-gray-600">{item.date}</div>
                          <h3 className="text-lg font-bold text-black">{item.phase}</h3>
                          <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </BlockContainer>

          {editor.isEditable && (
            <EditBlockPopover
              isOpen={isEditing}
              onOpenChange={(open: boolean) => {
                setIsEditing(open);
                if (open) {
                  try {
                    const parsedEvents = JSON.parse(block.props.events);
                    if (Array.isArray(parsedEvents) && parsedEvents.length === 4) {
                      setCurrentEvents(parsedEvents);
                    } else {
                      setCurrentEvents(defaultTimelineEvents);
                    }
                  } catch (e) {
                    setCurrentEvents(defaultTimelineEvents);
                  }
                }
              }}
              onSave={handleSave}
              width="lg"
            >
              <FormSection title="Timeline Events (4 Phases)">
                {currentEvents.map((event, index) => (
                  <div key={event.id} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-muted-foreground">
                        {event.phase} - Event {index + 1}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField>
                        <Label htmlFor={`eventPhase-${event.id}`}>Phase Name</Label>
                        <Input
                          id={`eventPhase-${event.id}`}
                          value={event.phase}
                          onChange={(e) => updateEvent(index, 'phase', e.target.value)}
                          placeholder="Phase name"
                        />
                      </FormField>
                      <FormField>
                        <Label htmlFor={`eventDate-${event.id}`}>Date</Label>
                        <DatePicker
                          value={event.date}
                          onChange={(date) => updateEvent(index, 'date', date)}
                          placeholder="Select event date"
                        />
                      </FormField>
                    </div>
                    <FormField>
                      <Label htmlFor={`eventDesc-${event.id}`}>Description</Label>
                      <Textarea
                        id={`eventDesc-${event.id}`}
                        value={event.description}
                        onChange={(e) => updateEvent(index, 'description', e.target.value)}
                        placeholder="Event description"
                        className="min-h-[80px]"
                      />
                    </FormField>
                  </div>
                ))}
              </FormSection>
            </EditBlockPopover>
          )}
        </div>
      );
    },
  }
);
