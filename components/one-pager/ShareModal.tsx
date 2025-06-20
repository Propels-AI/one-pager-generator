'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Trash2, ExternalLink, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreatePersonalizedLinks,
  useSharedLinksForOnePager,
  useDeleteSharedLink,
} from '@/lib/hooks/useOnePagerMutations';
import { validateRecipientNames } from '@/lib/utils/slugUtils';
import type { OnePagerFromSchema } from '@/lib/services/entityService';

interface ShareModalProps {
  onePager: OnePagerFromSchema | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ onePager, isOpen, onClose }: ShareModalProps) {
  const [recipientInput, setRecipientInput] = useState('');
  const [validationError, setValidationError] = useState('');

  // TanStack Query hooks
  const createLinkMutation = useCreatePersonalizedLinks();
  const deleteLinkMutation = useDeleteSharedLink();
  const { data: allSharedLinks = [], isLoading: linksLoading } = useSharedLinksForOnePager(onePager?.PK || '');

  // Filter out the public link from personal links section
  const personalLinks = allSharedLinks.filter((link) => link.recipientNameForDisplay !== 'Public Link');

  const handleCreateLink = async () => {
    if (!onePager || !recipientInput.trim()) return;

    // Validate recipient names (supports multiple comma-separated names)
    const validation = validateRecipientNames(recipientInput);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid names');
      return;
    }

    setValidationError('');

    createLinkMutation.mutate(
      {
        baseOnePagerId: onePager.PK!,
        ownerUserId: onePager.ownerUserId!,
        recipientNames: validation.names!,
      },
      {
        onSuccess: () => {
          setRecipientInput('');
        },
      }
    );
  };

  const copyToClipboard = async (slug: string) => {
    try {
      const url = `${window.location.origin}/${slug}`;
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!', {
        description: 'The personalized link has been copied to your clipboard.',
      });
    } catch (err) {
      toast.error('Failed to copy', {
        description: 'Please try copying the link manually.',
      });
    }
  };

  const openInNewTab = (slug: string) => {
    const url = `${window.location.origin}/${slug}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDeleteLink = (sharedLink: any) => {
    if (!onePager) return;

    deleteLinkMutation.mutate({
      sharedLinkPK: sharedLink.PK,
      baseOnePagerId: onePager.PK!,
    });
  };

  const getSlugFromPK = (pk: string): string => {
    return pk.startsWith('SLINK#') ? pk.substring(6) : pk;
  };

  if (!onePager) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share "{onePager.internalTitle}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Personal Link Section */}
          <div className="space-y-6 p-4 border rounded-lg bg-slate-50">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">Create Personal Link</h3>
            </div>

            <div className="space-y-3">
              <div className="space-y-3">
                <Label htmlFor="recipientInput">Recipient Names</Label>
                <Input
                  id="recipientInput"
                  placeholder="e.g., Jennie, Michael Chen, Sarah"
                  value={recipientInput}
                  onChange={(e) => {
                    setRecipientInput(e.target.value);
                    setValidationError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateLink();
                    }
                  }}
                  className={validationError ? 'border-red-500' : ''}
                />
                {validationError && <p className="text-sm text-red-600 mt-1">{validationError}</p>}
              </div>

              <Button
                onClick={handleCreateLink}
                disabled={!recipientInput.trim() || createLinkMutation.isPending}
                className="w-full"
              >
                {createLinkMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Links...
                  </>
                ) : (
                  'Generate Personal Link'
                )}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>
                💡 Example: "Jennie" becomes <code>firstpage.to/Jennie-abc123</code>
              </p>
              <p>Multiple names: "Peter, Joe, Sarah" creates 3 separate links</p>
              <p>Send with: "Here's my first page to Jennie: [link]"</p>
            </div>
          </div>

          {/* Existing Shared Links Section */}
          <div className="space-y-4">
            <h3 className="font-medium">Existing Personal Links ({personalLinks.length})</h3>

            {linksLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading shared links...</span>
                </div>
              </div>
            ) : personalLinks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No personalized links created yet.</p>
                <p className="text-sm">Create one above to get started!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {personalLinks.map((link) => {
                  const slug = getSlugFromPK(link.PK);

                  return (
                    <div
                      key={link.PK}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{link.recipientNameForDisplay}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">firstpage.to/{slug}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(slug)} title="Copy link">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openInNewTab(slug)} title="Open in new tab">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteLink(link)}
                          disabled={deleteLinkMutation.isPending}
                          title="Delete link"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {deleteLinkMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
