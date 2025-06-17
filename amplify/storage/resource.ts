import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'onePagerAssets',
  access: (allow) => ({
    'public/media/{entity_id}/*': [
      // Allow the file owner to read, write, and delete their own images
      allow.entity('identity').to(['read', 'write', 'delete']),
      // Allow guests (unauthenticated users) to read images for public one-pager pages
      allow.guest.to(['read']),
      // Allow authenticated users to read all images
      allow.authenticated.to(['read']),
    ],
  }),
});
