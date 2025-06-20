import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/api';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import config from '@/amplify_outputs.json';
import type { Schema } from '@/amplify/data/resource';
import { OnePagerClientView } from '@/components/one-pager/OnePagerClientView';

const client = generateServerClientUsingCookies<Schema>({
  config,
  cookies,
  authMode: 'apiKey',
});

type PageParams = { sharedLinkSlug: string };
type PublicOnePagerPageProps = {
  params: Promise<PageParams>;
};

export default async function PublicOnePagerPage({ params }: PublicOnePagerPageProps) {
  const resolvedParams = await params;

  if (typeof resolvedParams.sharedLinkSlug !== 'string') {
    console.error(
      '[PublicOnePagerPage] sharedLinkSlug is missing or invalid after resolving params. resolvedParams:',
      resolvedParams
    );
    notFound();
    return null;
  }

  const { data: sharedLink, errors: sharedLinkErrors } = await client.models.Entity.get({
    PK: `SLINK#${resolvedParams.sharedLinkSlug}`,
    SK: 'METADATA',
  });

  if (sharedLinkErrors || !sharedLink) {
    console.error('Error fetching shared link or link not found:', sharedLinkErrors);
    notFound();
  }

  if (!sharedLink.baseOnePagerId) {
    console.error('Shared link is missing the required baseOnePagerId:', sharedLink);
    notFound();
  }

  const { data: onePager, errors: onePagerErrors } = await client.models.Entity.get({
    PK: sharedLink.baseOnePagerId,
    SK: 'METADATA',
  });

  // If there was an error fetching the OnePager, it doesn't exist, or it's not published, show 404.
  if (onePagerErrors || !onePager || onePager.status !== 'PUBLISHED') {
    if (onePager && onePager.status !== 'PUBLISHED') {
      console.warn(
        `Attempted to access non-published OnePager (ID: ${onePager.PK}, Status: ${onePager.status}) via shared link.`
      );
    } else {
      console.error('Error fetching onePager or onePager not found:', onePagerErrors);
    }
    notFound();
  }

  // Ensure content exists
  if (!onePager.contentBlocks) {
    console.error('One-pager content is missing.');
    notFound();
  }

  let contentToRender;
  try {
    contentToRender = JSON.parse(onePager.contentBlocks as string);
  } catch (e) {
    console.error('Failed to parse one-pager content:', e);
    notFound();
  }

  if (!contentToRender) {
    console.error('OnePager is missing content blocks');
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Page Under Construction</h1>
          <p>This one-pager does not have any content yet.</p>
        </div>
      </div>
    );
  }

  const content = JSON.parse(onePager.contentBlocks as string);

  return (
    <div className="min-h-screen">
      <main className="container mx-auto p-4 md:p-8">
        <OnePagerClientView content={content} />
      </main>
    </div>
  );
}
