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
import { Copy, ExternalLink, Edit, Plus, MoreVertical, Trash2, Share2, Loader2 } from 'lucide-react';
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
import { useDeleteOnePager, usePublishDraft } from '@/lib/hooks/useOnePagerMutations';
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
  const [onePagerToDelete, setOnePagerToDelete] = useState<string | null>(null);

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

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!', {
        description: 'The public link has been copied to your clipboard.',
      });
    } catch (err) {
      toast.error('Failed to copy', {
        description: 'Please try copying the link manually.',
      });
    }
  };

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getPublicUrl = (slug?: string | null) => {
    if (!slug) return '';
    // Ensure window is defined (for SSR safety, though this is a client component)
    return typeof window !== 'undefined' ? `${window.location.origin}/${slug}` : `/${slug}`;
  };

  // Use TanStack Query hooks for mutations
  const deleteOnePagerMutation = useDeleteOnePager();
  const publishDraftMutation = usePublishDraft();

  const handleDelete = (pk: string) => {
    setOnePagerToDelete(pk);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (onePagerToDelete) {
      deleteOnePagerMutation.mutate(onePagerToDelete);
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
                      <TableHead>Public Link</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {publishedOnePagers.map((pager) => {
                      const publicUrl = getPublicUrl(pager.publicSlug);
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
                          <TableCell>
                            {pager.publicSlug && publicUrl ? (
                              <div className="flex items-center gap-1 max-w-[200px] sm:max-w-xs">
                                <Link
                                  href={publicUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 hover:underline truncate flex-1 text-sm"
                                  title={publicUrl}
                                >
                                  {publicUrl.replace(/^https?:\/\//, '')}
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0"
                                  onClick={() => copyToClipboard(publicUrl)}
                                  title="Copy link"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                  <span className="sr-only">Copy link</span>
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">No public link</span>
                            )}
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
                                {publicUrl && (
                                  <DropdownMenuItem
                                    onClick={() => openInNewTab(publicUrl)}
                                    className="flex items-center"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" /> Open Public Page
                                  </DropdownMenuItem>
                                )}
                                {/* <DropdownMenuItem className="flex items-center"><Share2 className="h-4 w-4 mr-2" /> Manage Shares</DropdownMenuItem> */}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(pager.PK)}
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
                                onClick={() => handleDelete(pager.PK)}
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the page and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOnePagerToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
