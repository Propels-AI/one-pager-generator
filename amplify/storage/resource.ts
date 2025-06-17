import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'onePagerAssets',
  access: (allow) => ({
    // PUBLIC ACCESS: For published one-pager images (publicly viewable)
    'public/shared/*': [
      allow.guest.to(['read']), // Anyone can read published images (for public one-pager pages)
      allow.authenticated.to(['read', 'write']), // Authenticated users can read and write to shared space (for published content)
    ],

    // OWNER-BASED ACCESS: For personal draft/private images
    'private/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']), // Only the owner can read, write, delete their own images
    ],
  }),
});
