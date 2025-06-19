import { defineAuth, secret } from '@aws-amplify/backend';
import { postConfirmation } from './post-confirmation/resource';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: secret('GOOGLE_CLIENT_ID'),
        clientSecret: secret('GOOGLE_CLIENT_SECRET'),
        scopes: ['email', 'profile', 'openid'],
      },
      callbackUrls: [
        'http://localhost:3000/',
        'https://main.amplifyapp.com/', // Replace with actual Amplify app domain when deploy
      ],
      logoutUrls: [
        'http://localhost:3000/',
        'https://main.amplifyapp.com/', // Replace with actual Amplify app domain when deploy
      ],
    },
  },
  triggers: {
    postConfirmation,
  },
});
