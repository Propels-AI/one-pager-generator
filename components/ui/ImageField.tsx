'use client';

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import ImageUpload from './ImageUpload';
import { cn } from '@/lib/utils';

interface ImageFieldProps {
  label?: string;
  value?: string;
  onChange?: (url: string) => void;
  required?: boolean;
  className?: string;
  metadata?: { onePagerId?: string; blockType?: string };
  placeholder?: string;
}

export default function ImageField({
  label,
  value,
  onChange,
  required = false,
  className,
  metadata,
  placeholder,
}: ImageFieldProps) {
  const [error, setError] = useState<string>('');

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      <ImageUpload value={value} onChange={onChange} onError={setError} metadata={metadata} placeholder={placeholder} />

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
