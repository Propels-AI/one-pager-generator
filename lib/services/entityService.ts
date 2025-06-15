import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { nanoid } from 'nanoid';

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
  publicSlug?: string | null;
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

    let onePagers = entities as OnePagerFromSchema[];

    if (status === 'PUBLISHED' && onePagers.length > 0) {
      const onePagersWithSlugs = await Promise.all(
        onePagers.map(async (pager) => {
          if (!pager.PK) return pager; // Should not happen, but good to check
          try {
            const { data: sharedLinks, errors: sharedLinkErrors } = await client.models.Entity.list({
              filter: {
                gsi2PK: {
                  eq: pager.PK,
                },
                entityType: {
                  eq: 'SharedLink',
                },
              },
            });

            if (sharedLinkErrors) {
              console.error(
                `Error fetching shared links for ${pager.PK}:`,
                sharedLinkErrors.map((e) => e.message).join(', ')
              );
              return pager;
            }

            // Find the specific public link. The recipientNameForDisplay might not be in the GSI, so filter client-side.
            const publicLink = sharedLinks.find((sl) => sl.recipientNameForDisplay === 'Public Link');

            if (publicLink && publicLink.PK && publicLink.PK.startsWith('SLINK#')) {
              const slug = publicLink.PK.substring('SLINK#'.length);
              return { ...pager, publicSlug: slug };
            }
            return pager;
          } catch (e: any) {
            console.error(`Exception fetching shared link for ${pager.PK}:`, e.message);
            return pager;
          }
        })
      );
      onePagers = onePagersWithSlugs;
    }

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

export async function deleteOnePager(onePagerPk: string): Promise<{ pk: string }> {
  if (!onePagerPk) {
    throw new Error('OnePager PK is required for deletion.');
  }
  console.log(`Attempting to delete OnePager via service: ${onePagerPk}`);

  // 1. Find and delete associated SharedLink entities
  try {
    const { data: sharedLinks, errors: listErrors } = await client.models.Entity.list({
      filter: {
        gsi2PK: { eq: onePagerPk },
        entityType: { eq: 'SharedLink' },
      },
    });

    if (listErrors) {
      console.error(`Error listing shared links for ${onePagerPk}:`, listErrors.map((e) => e.message).join(', '));
      throw new Error(`Failed to list associated shared links: ${listErrors.map((e) => e.message).join(', ')}`);
    }

    if (sharedLinks && sharedLinks.length > 0) {
      console.log(`Found ${sharedLinks.length} shared links to delete for ${onePagerPk}`);
      for (const link of sharedLinks) {
        if (link.PK && link.SK) {
          // Ensure PK and SK are present for deletion
          const { errors: deleteLinkErrors } = await client.models.Entity.delete({ PK: link.PK, SK: link.SK });
          if (deleteLinkErrors) {
            console.warn(
              `Failed to delete shared link ${link.PK}: ${deleteLinkErrors.map((e) => e.message).join(', ')}`
            );
            // Continue trying to delete other links and the main entity
          }
        } else {
          console.warn(`SharedLink for ${onePagerPk} is missing PK or SK, cannot delete:`, link);
        }
      }
    }
  } catch (e: any) {
    console.error(`Error processing shared links for ${onePagerPk}: ${e.message}`);
    throw new Error(`Error processing shared links: ${e.message}`);
  }

  // 2. Delete the OnePager entity itself
  const { errors: deleteEntityErrors } = await client.models.Entity.delete({ PK: onePagerPk, SK: 'METADATA' });
  if (deleteEntityErrors) {
    console.error(`Error deleting OnePager ${onePagerPk}:`, deleteEntityErrors.map((e) => e.message).join(', '));
    throw new Error(deleteEntityErrors.map((e) => e.message).join(', '));
  }

  return { pk: onePagerPk };
}

export async function publishDraft(onePager: OnePagerFromSchema): Promise<Schema['Entity']['type'] | undefined> {
  if (!onePager || !onePager.PK || !onePager.ownerUserId) {
    throw new Error('Valid OnePager object with PK and ownerUserId is required for publishing.');
  }
  console.log(`Publishing draft via service: ${onePager.PK}`);
  const newStatusUpdatedAt = new Date().toISOString();

  // 1. Update OnePager status to PUBLISHED
  const { data: updatedPager, errors: updateErrors } = await client.models.Entity.update({
    PK: onePager.PK,
    SK: 'METADATA',
    status: 'PUBLISHED',
    statusUpdatedAt: newStatusUpdatedAt,
    gsi1SK: `PUBLISHED#${newStatusUpdatedAt}`,
  });

  if (updateErrors) {
    console.error(
      `Error updating OnePager ${onePager.PK} to published:`,
      updateErrors.map((e) => e.message).join(', ')
    );
    throw new Error(updateErrors.map((e) => e.message).join(', '));
  }

  // 2. Ensure a 'Public Link' SharedLink entity exists.
  try {
    const { data: existingLinks, errors: listLinkErrors } = await client.models.Entity.list({
      filter: {
        gsi2PK: { eq: onePager.PK },
        entityType: { eq: 'SharedLink' },
        recipientNameForDisplay: { eq: 'Public Link' }, // Check if this specific link exists
      },
    });

    if (listLinkErrors) {
      console.error(
        `Error checking for existing public link for ${onePager.PK}:`,
        listLinkErrors.map((e) => e.message).join(', ')
      );
    }

    if (!existingLinks || existingLinks.length === 0) {
      console.log(`No existing public link found for ${onePager.PK}. Creating one.`);
      const sharedLinkSlug = nanoid(6);
      const sharedLinkData = {
        PK: `SLINK#${sharedLinkSlug}`,
        SK: 'METADATA',
        entityType: 'SharedLink' as const,
        baseOnePagerId: onePager.PK,
        ownerUserId: onePager.ownerUserId,
        recipientNameForDisplay: 'Public Link',
        gsi2PK: onePager.PK,
        gsi2SK: newStatusUpdatedAt,
        createdAt: newStatusUpdatedAt,
        updatedAt: newStatusUpdatedAt,
      };
      const { errors: createLinkErrors } = await client.models.Entity.create(sharedLinkData as any);
      if (createLinkErrors) {
        console.error(
          `Failed to create public link for ${onePager.PK}:`,
          createLinkErrors.map((e) => e.message).join(', ')
        );
      }
    } else {
      console.log(`Public link already exists for ${onePager.PK}.`);
    }
  } catch (e: any) {
    console.error(`Error ensuring public link for ${onePager.PK}: ${e.message}`);
  }

  return updatedPager === null ? undefined : updatedPager;
}
