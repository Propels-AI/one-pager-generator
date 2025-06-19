'use client';

import React, { useState, useEffect } from 'react';
import { createReactBlockSpec } from '@blocknote/react';
import { Pencil, Trash2, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ImageField from '@/components/ui/ImageField';

// Interfaces
interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar: string;
}

interface TeamSectionDisplayProps {
  mainHeading: string;
  subHeading: string;
  descriptionParagraph: string;
  teamMembers: TeamMember[];
}

// Display Component (adapted from user's Team2)
const TeamSectionDisplay: React.FC<TeamSectionDisplayProps> = ({
  mainHeading,
  subHeading,
  descriptionParagraph,
  teamMembers,
}) => {
  return (
    <section className="py-8 w-full">
      <div className="container flex flex-col items-start text-left px-4 mx-auto">
        <p className="font-semibold text-primary">{mainHeading}</p>
        <h2 className="my-4 text-3xl font-bold md:text-4xl lg:text-5xl text-pretty">{subHeading}</h2>
        <p className="mb-8 max-w-3xl text-muted-foreground lg:text-xl">{descriptionParagraph}</p>
      </div>
      <div className="container mt-12 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-4 mx-auto">
        {teamMembers.map((person) => (
          <div key={person.id} className="flex flex-col items-start">
            <Avatar className="mb-4 size-20 md:mb-5 lg:size-24">
              {person.avatar && <AvatarImage src={person.avatar} alt={person.name} />}
              <AvatarFallback>{person.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <p className="text-lg font-semibold">{person.name}</p>
            <p className="text-sm text-primary">{person.role}</p>
            <p className="py-2 text-sm text-muted-foreground">{person.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

// Default team members data from user's example
const defaultPeople: TeamMember[] = [
  {
    id: 'person-1',
    name: 'Alice Johnson',
    role: 'Lead Developer',
    description: 'Passionate about creating scalable and efficient web solutions.',
    avatar: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-1.webp',
  },
  {
    id: 'person-2',
    name: 'Bob Williams',
    role: 'UX Designer',
    description: 'Crafting intuitive and engaging user experiences.',
    avatar: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-2.webp',
  },
  {
    id: 'person-3',
    name: 'Carol Davis',
    role: 'Project Manager',
    description: 'Ensuring projects are delivered on time and within budget.',
    avatar: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-3.webp',
  },
  {
    id: 'person-4',
    name: 'David Brown',
    role: 'Marketing Specialist',
    description: 'Driving growth through innovative marketing strategies.',
    avatar: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-4.webp',
  },
];

// BlockNote Prop Schema
const teamPropsDefinition = {
  mainHeading: { default: 'Our Team' as string },
  subHeading: { default: "The A-Players You'll Be Working With" as string },
  descriptionParagraph: {
    default:
      'Meet the dedicated professionals who will bring your project to life with expertise and passion.' as string,
  },
  teamMembers: { default: JSON.stringify(defaultPeople) as string },
};

// BlockNote Block Configuration
export const teamBlockConfig = {
  type: 'team' as const,
  name: 'Team Section',
  content: 'none' as const,
  propSchema: teamPropsDefinition,
  icon: Users,
} as const;

// BlockNote React Component
export const TeamBlockSpec = createReactBlockSpec(teamBlockConfig, {
  render: ({ block, editor }) => {
    const [isEditing, setIsEditing] = useState(false);

    const [currentMainHeading, setCurrentMainHeading] = useState(block.props.mainHeading);
    const [currentSubHeading, setCurrentSubHeading] = useState(block.props.subHeading);
    const [currentDescriptionParagraph, setCurrentDescriptionParagraph] = useState(block.props.descriptionParagraph);
    const [currentTeamMembers, setCurrentTeamMembers] = useState<TeamMember[]>([]);

    useEffect(() => {
      setCurrentMainHeading(block.props.mainHeading);
      setCurrentSubHeading(block.props.subHeading);
      setCurrentDescriptionParagraph(block.props.descriptionParagraph);
      try {
        setCurrentTeamMembers(JSON.parse(block.props.teamMembers));
      } catch (e) {
        console.error('Failed to parse team members from props', e);
        setCurrentTeamMembers(defaultPeople); // Fallback to default
      }
    }, [block.props]);

    const handleMemberChange = (index: number, field: keyof TeamMember, value: string) => {
      const updatedMembers = [...currentTeamMembers];
      updatedMembers[index] = { ...updatedMembers[index], [field]: value };
      setCurrentTeamMembers(updatedMembers);
    };

    const addMember = () => {
      setCurrentTeamMembers([
        ...currentTeamMembers,
        {
          id: crypto.randomUUID(),
          name: 'New Member',
          role: 'Role',
          description: 'Bio',
          avatar: 'https://via.placeholder.com/150',
        },
      ]);
    };

    const removeMember = (idToRemove: string) => {
      setCurrentTeamMembers(currentTeamMembers.filter((member) => member.id !== idToRemove));
    };

    const handleSave = () => {
      editor.updateBlock(block, {
        props: {
          mainHeading: currentMainHeading,
          subHeading: currentSubHeading,
          descriptionParagraph: currentDescriptionParagraph,
          teamMembers: JSON.stringify(currentTeamMembers),
        },
      });
      setIsEditing(false);
    };

    let parsedTeamMembers: TeamMember[] = defaultPeople;
    try {
      parsedTeamMembers = JSON.parse(block.props.teamMembers);
    } catch (e) {
      console.error('Failed to parse team members for display, using default.', e);
    }

    return (
      <div className="relative group w-full">
        <TeamSectionDisplay
          mainHeading={block.props.mainHeading}
          subHeading={block.props.subHeading}
          descriptionParagraph={block.props.descriptionParagraph}
          teamMembers={parsedTeamMembers}
        />
        {editor.isEditable && (
          <Popover
            open={isEditing}
            onOpenChange={(open) => {
              setIsEditing(open);
              if (open) {
                setCurrentMainHeading(block.props.mainHeading);
                setCurrentSubHeading(block.props.subHeading);
                setCurrentDescriptionParagraph(block.props.descriptionParagraph);
                try {
                  setCurrentTeamMembers(JSON.parse(block.props.teamMembers));
                } catch (e) {
                  setCurrentTeamMembers(defaultPeople);
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
            <PopoverContent className="w-[95vw] sm:w-[600px] lg:w-[750px] p-0 max-h-[80vh] flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="teamMainHeading">Main Heading</Label>
                  <Input
                    id="teamMainHeading"
                    value={currentMainHeading}
                    onChange={(e) => setCurrentMainHeading(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamSubHeading">Subheading</Label>
                  <Input
                    id="teamSubHeading"
                    value={currentSubHeading}
                    onChange={(e) => setCurrentSubHeading(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamDesc">Description Paragraph</Label>
                  <Textarea
                    id="teamDesc"
                    value={currentDescriptionParagraph}
                    onChange={(e) => setCurrentDescriptionParagraph(e.target.value)}
                  />
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium leading-none mb-3">Team Members</h4>
                  {currentTeamMembers.map((member, index) => (
                    <div key={member.id} className="p-3 pt-4 border rounded-md space-y-3 mb-3 relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => removeMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`memberName-${member.id}`}>Name</Label>
                          <Input
                            id={`memberName-${member.id}`}
                            value={member.name}
                            onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`memberRole-${member.id}`}>Role</Label>
                          <Input
                            id={`memberRole-${member.id}`}
                            value={member.role}
                            onChange={(e) => handleMemberChange(index, 'role', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="w-full flex justify-center">
                        <div className="max-w-md">
                          <ImageField
                            label="Avatar Image"
                            value={member.avatar}
                            onChange={(url) => handleMemberChange(index, 'avatar', url)}
                            metadata={{ blockType: 'team', onePagerId: block.id }}
                            placeholder="Upload avatar"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`memberDesc-${member.id}`}>Description</Label>
                        <Textarea
                          id={`memberDesc-${member.id}`}
                          value={member.description}
                          onChange={(e) => handleMemberChange(index, 'description', e.target.value)}
                          className="min-h-[60px]"
                        />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="mt-2 w-full" onClick={addMember}>
                    Add Team Member
                  </Button>
                  <div className="pb-4"></div>
                </div>
              </div>

              <div className="p-4 flex-shrink-0 border-t bg-white">
                <Button onClick={handleSave} className="w-full">
                  Save Changes
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  },
});
