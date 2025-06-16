import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  createOnePager,
  updateOnePager,
  deleteOnePager,
  publishDraft,
  type CreateOnePagerInput,
  type UpdateOnePagerInput,
  type OnePagerFromSchema,
} from '@/lib/services/entityService';

export function useCreateOnePager() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: createOnePager,
    onSuccess: (data, variables) => {
      const { onePager, publicSlug } = data;
      const ownerUserId = variables.ownerUserId;
      const userPK = `USER#${ownerUserId}`;

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['allOnePagers', userPK] });

      // Show success message
      const message = variables.status === 'PUBLISHED' ? 'published' : 'saved as draft';
      toast.success('Success!', {
        description: `One-pager "${variables.internalTitle}" ${message} successfully.`,
      });

      // Navigate based on status
      if (variables.status === 'PUBLISHED' && publicSlug) {
        router.push(`/${publicSlug}`);
      } else {
        // Extract UUID from PK for editor URL
        const uuid = onePager.PK?.replace('ONEPAGER#', '');
        if (uuid) {
          router.push(`/editor/${uuid}`);
        }
      }
    },
    onError: (error: Error) => {
      console.error('Create OnePager error:', error);
      toast.error('Error Creating', {
        description: error.message || 'An unexpected error occurred while creating the one-pager.',
      });
    },
  });
}

export function useUpdateOnePager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOnePager,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['onePager', variables.PK.replace('ONEPAGER#', '')] });

      // Snapshot previous value for rollback
      const previousOnePager = queryClient.getQueryData(['onePager', variables.PK.replace('ONEPAGER#', '')]);

      // Optimistically update
      queryClient.setQueryData(['onePager', variables.PK.replace('ONEPAGER#', '')], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          internalTitle: variables.internalTitle,
          status: variables.status,
          contentBlocks: JSON.stringify(variables.contentBlocks),
        };
      });

      return { previousOnePager };
    },
    onSuccess: (data, variables) => {
      const uuid = variables.PK.replace('ONEPAGER#', '');
      const ownerUserId = data.ownerUserId?.replace('USER#', '');

      // Update the specific query with fresh data
      queryClient.setQueryData(['onePager', uuid], data);

      // Invalidate list queries
      if (ownerUserId) {
        queryClient.invalidateQueries({ queryKey: ['allOnePagers', `USER#${ownerUserId}`] });
      }

      // Show success message
      const message = variables.status === 'PUBLISHED' ? 'published' : 'updated';
      toast.success('Success!', {
        description: `One-pager "${variables.internalTitle}" ${message} successfully.`,
      });
    },
    onError: (error: Error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousOnePager) {
        queryClient.setQueryData(['onePager', variables.PK.replace('ONEPAGER#', '')], context.previousOnePager);
      }

      console.error('Update OnePager error:', error);
      toast.error('Error Updating', {
        description: error.message || 'An unexpected error occurred while updating the one-pager.',
      });
    },
  });
}

export function useDeleteOnePager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (onePagerPk: string) => deleteOnePager(onePagerPk),
    onSuccess: (data, variables) => {
      // Find the ownerUserId from existing query data for cache invalidation
      const existingQueries = queryClient.getQueriesData({ queryKey: ['allOnePagers'] });

      existingQueries.forEach(([queryKey]) => {
        queryClient.invalidateQueries({ queryKey });
      });

      toast.success('One-Pager Deleted', {
        description: `Successfully deleted one-pager.`,
      });
    },
    onError: (error: Error) => {
      console.error('Delete OnePager error:', error);
      toast.error('Error Deleting', {
        description: error.message || 'An unexpected error occurred while deleting the one-pager.',
      });
    },
  });
}

export function usePublishDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (onePager: OnePagerFromSchema) => publishDraft(onePager),
    onSuccess: (data, variables) => {
      const ownerUserId = variables.ownerUserId;

      // Invalidate list queries
      if (ownerUserId) {
        queryClient.invalidateQueries({ queryKey: ['allOnePagers', ownerUserId] });
      }

      toast.success('Draft Published', {
        description: `Successfully published "${variables.internalTitle || 'one-pager'}".`,
      });
    },
    onError: (error: Error) => {
      console.error('Publish draft error:', error);
      toast.error('Error Publishing', {
        description: error.message || 'An unexpected error occurred while publishing the draft.',
      });
    },
  });
}

// Action-specific mutation hooks for editor
interface SaveDraftParams {
  ownerUserId?: string;
  PK?: string;
  internalTitle: string;
  contentBlocks: any[];
  isNewDocument: boolean;
}

interface SaveAndPublishParams {
  ownerUserId?: string;
  PK?: string;
  internalTitle: string;
  contentBlocks: any[];
  isNewDocument: boolean;
}

export function useSaveDraft() {
  const createMutation = useCreateOnePager();
  const updateMutation = useUpdateOnePager();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ ownerUserId, PK, internalTitle, contentBlocks, isNewDocument }: SaveDraftParams) => {
      if (isNewDocument && ownerUserId) {
        return createMutation.mutateAsync({
          ownerUserId,
          internalTitle,
          status: 'DRAFT',
          contentBlocks,
        });
      } else if (PK) {
        return updateMutation.mutateAsync({
          PK,
          internalTitle,
          status: 'DRAFT',
          contentBlocks,
        });
      }
      throw new Error('Invalid parameters for save draft');
    },
    onSuccess: (data, variables) => {
      toast.success('Draft Saved', {
        description: `"${variables.internalTitle}" saved successfully.`,
      });

      // Navigate to editor with document ID if it's a new document
      if (variables.isNewDocument && data && 'onePager' in data && data.onePager?.PK) {
        const uuid = data.onePager.PK.replace('ONEPAGER#', '');
        router.push(`/editor/${uuid}`);
      }
    },
    onError: (error: Error) => {
      console.error('Save draft error:', error);
      toast.error('Error Saving Draft', {
        description: error.message || 'An unexpected error occurred while saving the draft.',
      });
    },
  });
}

export function useSaveAndPublish() {
  const createMutation = useCreateOnePager();
  const updateMutation = useUpdateOnePager();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ ownerUserId, PK, internalTitle, contentBlocks, isNewDocument }: SaveAndPublishParams) => {
      if (isNewDocument && ownerUserId) {
        return createMutation.mutateAsync({
          ownerUserId,
          internalTitle,
          status: 'PUBLISHED',
          contentBlocks,
        });
      } else if (PK) {
        return updateMutation.mutateAsync({
          PK,
          internalTitle,
          status: 'PUBLISHED',
          contentBlocks,
        });
      }
      throw new Error('Invalid parameters for publish');
    },
    onSuccess: (data, variables) => {
      toast.success('One-Pager Published', {
        description: `"${variables.internalTitle}" published successfully.`,
      });

      // Navigate to public page if published
      if (data && 'publicSlug' in data && data.publicSlug) {
        router.push(`/${data.publicSlug}`);
      } else if (variables.isNewDocument && data && 'onePager' in data && data.onePager?.PK) {
        const uuid = data.onePager.PK.replace('ONEPAGER#', '');
        router.push(`/editor/${uuid}`);
      }
    },
    onError: (error: Error) => {
      console.error('Publish error:', error);
      toast.error('Error Publishing', {
        description: error.message || 'An unexpected error occurred while publishing.',
      });
    },
  });
}
