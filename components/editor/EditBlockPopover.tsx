import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

interface EditBlockPopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  saveButtonText?: string;
  title?: string;
}

const widthClasses = {
  sm: 'w-[95vw] sm:w-[500px] lg:w-[600px]',
  md: 'w-[95vw] sm:w-[600px] lg:w-[700px]',
  lg: 'w-[95vw] sm:w-[600px] lg:w-[750px]',
  xl: 'w-[95vw] sm:w-[700px] lg:w-[800px]',
};

export const EditBlockPopover: React.FC<EditBlockPopoverProps> = ({
  isOpen,
  onOpenChange,
  onSave,
  children,
  width = 'lg',
  saveButtonText = 'Save Changes',
  title,
}) => {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 right-4 h-8 w-8 bg-white opacity-100 md:opacity-0 group-hover:md:opacity-100 transition-opacity duration-300 z-10"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={`${widthClasses[width]} p-0 max-h-[80vh] flex flex-col`}>
        {title && (
          <div className="p-4 pb-0 flex-shrink-0 border-b">
            <h3 className="font-semibold text-lg">{title}</h3>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-6">{children}</div>

        <div className="p-4 flex-shrink-0 border-t bg-white">
          <Button onClick={onSave} className="w-full">
            {saveButtonText}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Reusable form field components for consistency
export const FormField: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => <div className={`space-y-2 ${className}`}>{children}</div>;

export const FormSection: React.FC<{
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className = '' }) => (
  <div className={`border-t pt-4 mt-4 ${className}`}>
    <h4 className="font-medium leading-none mb-3">{title}</h4>
    {children}
  </div>
);

export const ItemCard: React.FC<{
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}> = ({ children, onRemove, className = '' }) => (
  <div className={`p-3 pt-4 border rounded-md space-y-3 mb-3 relative ${className}`}>
    {onRemove && (
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 h-7 w-7 text-destructive hover:bg-destructive/10"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    )}
    {children}
  </div>
);
