import { defineAuth } from "@aws-amplify/backend";
import { postConfirmation } from './post-confirmation/resource';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    // add social providers if required
    // externalProviders: {
    //   callbackUrls: ['http://localhost:3000/'],
    //   logoutUrls: ['http://localhost:3000/'],
    // },
  },
  triggers: {
    postConfirmation 
  }
});
