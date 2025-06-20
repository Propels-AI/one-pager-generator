import { nanoid } from 'nanoid';

/**
 * Generates a personalized slug from a recipient name
 * Examples:
 * - "Jennie" → "Jennie-abc123"
 * - "Michael Chen" → "MichaelChen-abc123"
 * - "Sarah O'Connor" → "SarahOConnor-abc123"
 */
export function generatePersonalizedSlug(recipientName: string): string {
  // Clean the name: only keep English letters and numbers
  const cleanName = recipientName.trim().replace(/[^a-zA-Z0-9]/g, '');

  // Add random suffix for uniqueness (6 characters, alphanumeric only)
  const randomSuffix = nanoid(6).replace(/[^a-zA-Z0-9]/g, '');

  return `${cleanName}-${randomSuffix}`;
}

/**
 * Parses multiple recipient names from a comma-separated string
 * Handles "peter, joe" → ["peter", "joe"]
 */
export function parseRecipientNames(input: string): string[] {
  return input
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}

/**
 * Validates if a single recipient name is acceptable for slug generation
 */
export function validateSingleRecipientName(name: string): { isValid: boolean; error?: string } {
  const trimmed = name.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Name cannot be empty' };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long' };
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: 'Name must be less than 50 characters' };
  }

  // Check if name contains only valid characters (letters, numbers, spaces, common punctuation)
  const validNameRegex = /^[a-zA-Z0-9\s\-'.,]+$/;
  if (!validNameRegex.test(trimmed)) {
    return { isValid: false, error: 'Name contains invalid characters' };
  }

  return { isValid: true };
}

/**
 * Validates multiple recipient names from comma-separated input
 */
export function validateRecipientNames(input: string): { isValid: boolean; error?: string; names?: string[] } {
  const trimmed = input.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Recipient names are required' };
  }

  const names = parseRecipientNames(trimmed);

  if (names.length === 0) {
    return { isValid: false, error: 'At least one valid name is required' };
  }

  if (names.length > 10) {
    return { isValid: false, error: 'Maximum 10 names allowed at once' };
  }

  // Validate each individual name
  for (const name of names) {
    const validation = validateSingleRecipientName(name);
    if (!validation.isValid) {
      return { isValid: false, error: `"${name}": ${validation.error}` };
    }
  }

  return { isValid: true, names };
}

/**
 * Generates the full personalized URL
 */
export function generatePersonalizedUrl(recipientName: string, baseUrl: string = ''): string {
  const slug = generatePersonalizedSlug(recipientName);
  const domain = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${domain}/${slug}`;
}
