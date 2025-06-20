import { createReactBlockSpec } from '@blocknote/react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Twitter, Linkedin, Github, Globe, Link as LucideLink } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const platformOptions = [
  { value: 'twitter', label: 'Twitter/X', icon: Twitter, defaultDisplayText: 'Twitter' },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, defaultDisplayText: 'LinkedIn' },
  { value: 'github', label: 'GitHub', icon: Github, defaultDisplayText: 'GitHub' },
  { value: 'website', label: 'Website', icon: Globe, defaultDisplayText: 'Website' },
  { value: 'other', label: 'Other', icon: LucideLink, defaultDisplayText: 'Link' },
];

export const SocialBlockSpec = createReactBlockSpec(
  {
    type: 'social',
    propSchema: {
      platform: {
        default: 'twitter',
        values: platformOptions.map((p) => p.value),
      },
      displayText: {
        default: 'Twitter',
      },
      url: {
        default: '',
      },
      startInEditMode: {
        default: false,
      },
      backgroundColor: {
        default: 'default',
      },
      textColor: {
        default: 'default',
      },
    },
    content: 'none',
  },
  {
    render: ({ block, editor }) => {
      const [isEditingPopoverOpen, setIsEditingPopoverOpen] = useState(false);
      const urlInputRef = useRef<HTMLInputElement>(null);
      const { isEditable } = editor;

      useEffect(() => {
        if (block.props.startInEditMode) {
          setIsEditingPopoverOpen(true);
          // Defer the update to avoid the flushSync error by wrapping it in a setTimeout
          setTimeout(() => {
            editor.updateBlock(block, {
              props: { ...block.props, startInEditMode: false },
            });
          }, 0);
        }
      }, [block.props.startInEditMode, editor, block]);

      const currentPlatform = platformOptions.find((p) => p.value === block.props.platform) || platformOptions[0];

      const handlePlatformChange = (newPlatformValue: string) => {
        const oldPlatform = platformOptions.find((p) => p.value === block.props.platform);
        const newPlatform = platformOptions.find((p) => p.value === newPlatformValue);
        let newDisplayText = block.props.displayText;

        if (newPlatform) {
          if ((oldPlatform && block.props.displayText === oldPlatform.defaultDisplayText) || !block.props.displayText) {
            newDisplayText = newPlatform.defaultDisplayText;
          }
        }

        editor.updateBlock(block, {
          props: {
            ...block.props,
            platform: newPlatformValue,
            displayText: newDisplayText,
          },
        });
      };

      const renderLink = (className: string, iconClassName: string) => (
        <div
          className={className}
          role="button"
          tabIndex={0}
          onClick={() => isEditable && setIsEditingPopoverOpen(true)}
          onKeyDown={(e) => {
            if (isEditable && (e.key === 'Enter' || e.key === ' ')) setIsEditingPopoverOpen(true);
          }}
        >
          <currentPlatform.icon className={iconClassName} />
          <span>{block.props.displayText || currentPlatform.defaultDisplayText}</span>
        </div>
      );

      const renderFinalLink = (className: string, iconClassName: string) => (
        <a href={block.props.url} target="_blank" rel="noopener noreferrer" className={className}>
          <currentPlatform.icon className={iconClassName} />
          <span>{block.props.displayText || currentPlatform.defaultDisplayText}</span>
        </a>
      );

      if (isEditable) {
        return (
          <Popover open={isEditingPopoverOpen} onOpenChange={setIsEditingPopoverOpen}>
            <PopoverTrigger asChild>
              {renderLink(
                'inline-flex items-center gap-1.5 text-base hover:underline cursor-pointer p-1 border border-transparent hover:border-gray-300 rounded',
                'h-5 w-5 flex-shrink-0'
              )}
            </PopoverTrigger>
            <PopoverContent
              className="w-96 p-4 space-y-3"
              sideOffset={5}
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                if (urlInputRef.current) {
                  urlInputRef.current.focus();
                  const end = urlInputRef.current.value.length;
                  urlInputRef.current.setSelectionRange(end, end);
                }
              }}
            >
              <div className="space-y-1">
                <h4 className="font-medium leading-none">Edit Social Link</h4>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Platform</label>
                <Select value={block.props.platform} onValueChange={handlePlatformChange}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platformOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center">
                          <option.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Display Text</label>
                <Input
                  type="text"
                  placeholder="Link display text"
                  value={block.props.displayText}
                  className="mt-1"
                  onChange={(e) =>
                    editor.updateBlock(block, { props: { ...block.props, displayText: e.target.value } })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">URL</label>
                <Input
                  ref={urlInputRef}
                  type="url"
                  placeholder="https://example.com"
                  value={block.props.url}
                  className="mt-1"
                  onChange={(e) => editor.updateBlock(block, { props: { ...block.props, url: e.target.value } })}
                />
              </div>
            </PopoverContent>
          </Popover>
        );
      }

      // Non-editable / final display mode
      const className = 'inline-flex items-center gap-1.5 text-base hover:underline';
      const iconClassName = 'h-5 w-5 flex-shrink-0';
      if (block.props.url) {
        return renderFinalLink(className, iconClassName);
      }
      return renderLink(className, iconClassName);
    },
  }
);
