import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

// Explicit type definition for OnePagerFromSchema
export type OnePagerFromSchema = {
  PK: string;
  SK: string;
  entityType: 'OnePager';
  ownerUserId?: string | null;
  internalTitle?: string | null;
  status?: 'PUBLISHED' | 'DRAFT' | string | null;
  statusUpdatedAt?: string | null;
  templateId?: string | null;
  contentBlocks?: string | null;
  gsi1PK?: string | null;
  gsi1SK?: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function fetchOnePagerById(id: string): Promise<OnePagerFromSchema | null> {
  try {
    const { data: entity, errors } = await client.models.Entity.get({
      PK: id,
      SK: 'METADATA',
    });

    if (errors) {
      console.error('Error fetching OnePager by ID:', errors);
      throw new Error(errors.map((e: any) => e.message).join(', '));
    }

    if (!entity) {
      console.log(`No entity found for ID: ${id}`);
      return null;
    }

    if (entity.entityType !== 'OnePager') {
      console.warn(`Entity with ID ${id} is not a OnePager, but a ${entity.entityType}`);
      return null;
    }

    return entity as OnePagerFromSchema;
  } catch (error) {
    console.error('An unexpected error occurred in fetchOnePagerById:', error);
    return null;
  }
}

export async function fetchUserOnePagers(
  ownerUserId: string,
  status: 'PUBLISHED' | 'DRAFT'
): Promise<OnePagerFromSchema[]> {
  if (!ownerUserId) {
    console.error('fetchUserOnePagers: ownerUserId is required');
    return [];
  }

  try {
    const { data: entities, errors } = await client.models.Entity.list({
      filter: {
        gsi1PK: {
          eq: ownerUserId,
        },
        gsi1SK: {
          beginsWith: status, // e.g., 'PUBLISHED#' or 'DRAFT#'
        },
        entityType: {
          eq: 'OnePager',
        },
      },
    });

    if (errors) {
      console.error('Error fetching one-pagers:', errors);
      throw new Error(errors.map((e) => e.message).join(', '));
    }

    const onePagers = entities as OnePagerFromSchema[];

    return onePagers.sort((a, b) => {
      if (a.statusUpdatedAt && b.statusUpdatedAt) {
        return new Date(b.statusUpdatedAt).getTime() - new Date(a.statusUpdatedAt).getTime();
      }
      return 0;
    });
  } catch (error) {
    console.error('Failed to fetch user one-pagers:', error);
    throw error;
  }
}
