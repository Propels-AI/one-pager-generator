'use client';

import React, { useState, useEffect } from 'react';
import { createReactBlockSpec } from '@blocknote/react';
import { Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ImageField from '@/components/ui/ImageField';
import { EditBlockPopover, FormField, FormSection, ItemCard } from '../EditBlockPopover';
import { BlockContainer } from '../BlockContainer';

// Interfaces
interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar: string;
}

interface TeamSectionDisplayProps {
  teamMembers: TeamMember[];
}

// Display Component - Pure Team Grid (no internal headings)
const TeamSectionDisplay: React.FC<TeamSectionDisplayProps> = ({ teamMembers }) => {
  return (
    <BlockContainer>
      <div className="container grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-4 mx-auto">
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
    </BlockContainer>
  );
};

// Default team members data
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

// Simplified BlockNote Props - Only team members
const teamPropsDefinition = {
  teamMembers: { default: JSON.stringify(defaultPeople) as string },
};

// BlockNote Block Configuration
export const teamBlockConfig = {
  type: 'team' as const,
  name: 'Team Grid',
  content: 'none' as const,
  propSchema: teamPropsDefinition,
  icon: Users,
} as const;

// BlockNote React Component
export const TeamBlockSpec = createReactBlockSpec(teamBlockConfig, {
  render: ({ block, editor }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentTeamMembers, setCurrentTeamMembers] = useState<TeamMember[]>([]);

    useEffect(() => {
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
        <TeamSectionDisplay teamMembers={parsedTeamMembers} />
        {editor.isEditable && (
          <EditBlockPopover
            isOpen={isEditing}
            onOpenChange={(open: boolean) => {
              setIsEditing(open);
              if (open) {
                try {
                  setCurrentTeamMembers(JSON.parse(block.props.teamMembers));
                } catch (e) {
                  setCurrentTeamMembers(defaultPeople);
                }
              }
            }}
            onSave={handleSave}
            width="lg"
          >
            <FormSection title="Team Members">
              {currentTeamMembers.map((member, index) => (
                <ItemCard key={member.id} onRemove={() => removeMember(member.id)}>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField>
                      <Label htmlFor={`memberName-${member.id}`}>Name</Label>
                      <Input
                        id={`memberName-${member.id}`}
                        value={member.name}
                        onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                      />
                    </FormField>
                    <FormField>
                      <Label htmlFor={`memberRole-${member.id}`}>Role</Label>
                      <Input
                        id={`memberRole-${member.id}`}
                        value={member.role}
                        onChange={(e) => handleMemberChange(index, 'role', e.target.value)}
                      />
                    </FormField>
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
                  <FormField>
                    <Label htmlFor={`memberDesc-${member.id}`}>Description</Label>
                    <Textarea
                      id={`memberDesc-${member.id}`}
                      value={member.description}
                      onChange={(e) => handleMemberChange(index, 'description', e.target.value)}
                      className="min-h-[60px]"
                    />
                  </FormField>
                </ItemCard>
              ))}
              <Button variant="outline" className="mt-2 w-full" onClick={addMember}>
                Add Team Member
              </Button>
            </FormSection>
          </EditBlockPopover>
        )}
      </div>
    );
  },
});
