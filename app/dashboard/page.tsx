'use client';

import { useState, useMemo } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit, Plus, Trash2, Share2, Loader2, ExternalLink, MoreVertical } from 'lucide-react';
import { ShareModal } from '@/components/one-pager/ShareModal';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuthWall';
import { ProtectPage } from '@/components/auth/AuthComponents';
import { useQuery } from '@tanstack/react-query';
import { fetchUserOnePagers, type OnePagerFromSchema as OnePagerEntity } from '@/lib/services/entityService';
import { useDeleteOnePager, usePublishDraft, useUpdateOnePager } from '@/lib/hooks/useOnePagerMutations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function DashboardContent() {
  const { user, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState('published');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [onePagerToDelete, setOnePagerToDelete] = useState<OnePagerEntity | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedOnePagerForShare, setSelectedOnePagerForShare] = useState<OnePagerEntity | null>(null);

  const ownerUserId = user ? `USER#${user.userId}` : undefined;

  // Fetch all one-pagers (both published and drafts)
  const {
    data: allOnePagers = [],
    isLoading: onePagersIsLoading,
    error: onePagersError,
  } = useQuery<OnePagerEntity[], Error>({
    queryKey: ['allOnePagers', ownerUserId],
    queryFn: async () => {
      if (!ownerUserId) return [];
      const published = await fetchUserOnePagers(ownerUserId, 'PUBLISHED');
      const drafts = await fetchUserOnePagers(ownerUserId, 'DRAFT');
      return [...published, ...drafts];
    },
    enabled: !!ownerUserId,
  });

  const publishedOnePagers = useMemo(() => allOnePagers.filter((p) => p.status === 'PUBLISHED'), [allOnePagers]);
  const draftOnePagers = useMemo(() => allOnePagers.filter((p) => p.status === 'DRAFT'), [allOnePagers]);

  // Use TanStack Query hooks for mutations
  const deleteOnePagerMutation = useDeleteOnePager();
  const publishDraftMutation = usePublishDraft();
  const updateOnePagerMutation = useUpdateOnePager();

  const handleDelete = (pager: OnePagerEntity) => {
    setOnePagerToDelete(pager);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (onePagerToDelete?.PK) {
      deleteOnePagerMutation.mutate(onePagerToDelete.PK);
    }
    setIsDeleteDialogOpen(false);
    setOnePagerToDelete(null);
  };

  const handleUnpublish = () => {
    if (onePagerToDelete?.PK && onePagerToDelete?.contentBlocks) {
      // Parse the content blocks and update status to DRAFT
      const contentBlocks = JSON.parse(onePagerToDelete.contentBlocks);
      updateOnePagerMutation.mutate(
        {
          PK: onePagerToDelete.PK,
          internalTitle: onePagerToDelete.internalTitle || 'Untitled Page',
          status: 'DRAFT',
          contentBlocks,
        },
        {
          onSuccess: () => {
            setActiveTab('draft'); // Switch to draft tab to show the unpublished page
          },
        }
      );
    }
    setIsDeleteDialogOpen(false);
    setOnePagerToDelete(null);
  };

  const handlePublish = (pager: OnePagerEntity) => {
    publishDraftMutation.mutate(pager, {
      onSuccess: () => {
        setActiveTab('published'); // Switch to published tab
      },
    });
  };

  const handleOpenShareModal = (pager: OnePagerEntity) => {
    setSelectedOnePagerForShare(pager);
    setShareModalOpen(true);
  };

  // Don't show a separate loading state - let the content render with loading indicators inline

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">My Pages</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2">
            Manage your draft and published pages, {user?.signInDetails?.loginId || user?.username || 'user'}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={signOut} variant="outline">
            Sign Out
          </Button>
          <Button asChild>
            <Link href="/editor">
              <Plus className="h-4 w-4 mr-2" /> Create Page
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="published" className="flex items-center gap-2">
            Published ({publishedOnePagers.length})
          </TabsTrigger>
          <TabsTrigger value="draft" className="flex items-center gap-2">
            Draft ({draftOnePagers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="published" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Published Pages</CardTitle>
              <CardDescription>Your live pages that are publicly accessible.</CardDescription>
            </CardHeader>
            <CardContent>
              {onePagersIsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading published pages...</span>
                  </div>
                </div>
              ) : publishedOnePagers.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No published pages yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden md:table-cell">Published</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {publishedOnePagers.map((pager) => {
                      return (
                        <TableRow key={pager.PK}>
                          <TableCell className="font-medium">
                            <Link href={`/editor/${pager.PK.split('#')[1]}`} className="hover:underline">
                              {pager.internalTitle || 'Untitled Page'}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden md:table-cell">
                            {pager.statusUpdatedAt ? new Date(pager.statusUpdatedAt).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/editor/${pager.PK.split('#')[1]}`} className="flex items-center">
                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOpenShareModal(pager)}
                                  className="flex items-center"
                                >
                                  <Share2 className="h-4 w-4 mr-2" /> Manage Shares
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(pager)}
                                  className="text-red-600 dark:text-red-500 flex items-center"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Draft Pages</CardTitle>
              <CardDescription>Your work-in-progress pages that haven't been published yet.</CardDescription>
            </CardHeader>
            <CardContent>
              {onePagersIsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading draft pages...</span>
                  </div>
                </div>
              ) : draftOnePagers.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No drafts yet. Start by creating your first page!
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden md:table-cell">Last Modified</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {draftOnePagers.map((pager) => (
                      <TableRow key={pager.PK}>
                        <TableCell className="font-medium">
                          <Link href={`/editor/${pager.PK.split('#')[1]}`} className="hover:underline">
                            {pager.internalTitle || 'Untitled Draft'}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden md:table-cell">
                          {pager.updatedAt ? new Date(pager.updatedAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/editor/${pager.PK.split('#')[1]}`} className="flex items-center">
                                  <Edit className="h-4 w-4 mr-2" /> Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePublish(pager)} className="flex items-center">
                                <ExternalLink className="h-4 w-4 mr-2" /> Publish
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(pager)}
                                className="text-red-600 dark:text-red-500 flex items-center"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete or Unpublish Page?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <div>
                Deleting this page will permanently delete the page and all shared links. Your recipients will no longer
                have access to the page <strong>This action cannot be undone.</strong>
              </div>

              <div>
                Alternatively, you can unpublish the page to temporarily disable all shared links. They will be
                reactivated once you publish the page again.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setOnePagerToDelete(null)} className="order-3 sm:order-1">
              Cancel
            </AlertDialogCancel>
            <Button
              variant="default"
              onClick={handleUnpublish}
              className="order-2"
              disabled={updateOnePagerMutation.isPending}
            >
              {updateOnePagerMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Unpublishing...
                </>
              ) : (
                'Unpublish'
              )}
            </Button>
            <AlertDialogAction
              onClick={confirmDelete}
              className="order-1 sm:order-3 bg-red-600 hover:bg-red-700"
              disabled={deleteOnePagerMutation.isPending}
            >
              {deleteOnePagerMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Permanently'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ShareModal
        onePager={selectedOnePagerForShare}
        isOpen={shareModalOpen}
        onClose={() => {
          setShareModalOpen(false);
          setSelectedOnePagerForShare(null);
        }}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectPage>
      <DashboardContent />
    </ProtectPage>
  );
}
