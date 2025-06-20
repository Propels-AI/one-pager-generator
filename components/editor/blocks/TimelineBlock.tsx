'use client';

import React, { useState, useEffect } from 'react';
import { createReactBlockSpec } from '@blocknote/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Pencil, PlusCircle } from 'lucide-react';
import { BlockContainer } from '../BlockContainer';

// Interface for individual timeline events
interface TimelineEvent {
  id: string;
  phase: string;
  date: string;
  description: string;
}

// Default timeline data based on the new example
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

// Props definition for the Timeline block
export const timelinePropsDefinition = {
  mainHeading: {
    default: 'Timeline' as string,
  },
  events: {
    default: JSON.stringify(defaultTimelineEvents) as string,
  },
};

// The Timeline Block
export const TimelineBlockSpec = createReactBlockSpec(
  {
    type: 'timeline' as const,
    propSchema: timelinePropsDefinition,
    content: 'none',
  },
  {
    render: ({ block, editor }) => {
      const [isEditing, setIsEditing] = useState(false);
      const [currentHeading, setCurrentHeading] = useState(block.props.mainHeading);
      const [currentEvents, setCurrentEvents] = useState<TimelineEvent[]>(() => {
        try {
          const parsed = JSON.parse(block.props.events);
          return Array.isArray(parsed) ? parsed : defaultTimelineEvents;
        } catch {
          return defaultTimelineEvents;
        }
      });

      useEffect(() => {
        setCurrentHeading(block.props.mainHeading);
        try {
          const parsedEvents = JSON.parse(block.props.events);
          setCurrentEvents(Array.isArray(parsedEvents) ? parsedEvents : defaultTimelineEvents);
        } catch (e) {
          setCurrentEvents(defaultTimelineEvents);
        }
      }, [block.props.mainHeading, block.props.events]);

      const handleSave = () => {
        editor.updateBlock(block, {
          props: {
            ...block.props,
            mainHeading: currentHeading,
            events: JSON.stringify(currentEvents),
          },
        });
        setIsEditing(false);
      };

      const addEvent = () => {
        setCurrentEvents([
          ...currentEvents,
          {
            id: crypto.randomUUID(),
            phase: 'New Phase',
            date: 'New Date',
            description: 'New description.',
          },
        ]);
      };

      const updateEvent = (index: number, field: keyof TimelineEvent, value: string) => {
        const updatedEvents = [...currentEvents];
        updatedEvents[index] = { ...updatedEvents[index], [field]: value };
        setCurrentEvents(updatedEvents);
      };

      const removeEvent = (id: string) => {
        setCurrentEvents(currentEvents.filter((event) => event.id !== id));
      };

      const displayedEvents: TimelineEvent[] = JSON.parse(block.props.events);

      return (
        <div className="relative group w-full">
          <BlockContainer blockType="timeline">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center mb-16">
                <h1 className="text-5xl font-bold text-black mb-2">{block.props.mainHeading}</h1>
              </div>

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

          {/* Edit Popover Trigger */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Popover open={isEditing} onOpenChange={setIsEditing}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full bg-white hover:bg-gray-100">
                  <Pencil size={16} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 max-h-[80vh] overflow-y-auto p-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="timelineHeading">Main Heading</Label>
                    <Input
                      id="timelineHeading"
                      value={currentHeading}
                      onChange={(e) => setCurrentHeading(e.target.value)}
                    />
                  </div>

                  <h4 className="text-md font-semibold mt-4 mb-2 border-b pb-2">Timeline Events</h4>
                  {currentEvents.map((event, index) => (
                    <div key={event.id} className="p-3 border rounded-md space-y-2 relative bg-gray-50">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 w-6 h-6 text-red-500"
                        onClick={() => removeEvent(event.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                      <div>
                        <Label htmlFor={`eventPhase-${event.id}`}>Phase</Label>
                        <Input
                          id={`eventPhase-${event.id}`}
                          value={event.phase}
                          onChange={(e) => updateEvent(index, 'phase', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`eventDate-${event.id}`}>Date</Label>
                        <Input
                          id={`eventDate-${event.id}`}
                          value={event.date}
                          onChange={(e) => updateEvent(index, 'date', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`eventDesc-${event.id}`}>Description</Label>
                        <Textarea
                          id={`eventDesc-${event.id}`}
                          value={event.description}
                          onChange={(e) => updateEvent(index, 'description', e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addEvent} className="w-full mt-2">
                    <PlusCircle size={16} className="mr-2" /> Add Event
                  </Button>

                  <Button onClick={handleSave} className="w-full mt-4">
                    Save Changes
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      );
    },
  }
);
