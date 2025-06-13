import type { PostConfirmationTriggerHandler } from 'aws-lambda';
import { type Schema } from '../../data/resource'; // Adjusted path to your schema
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
// Ensure you have this import if you are using Amplify Gen 2's backend functions
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime'; 
import { env } from '$amplify/env/post-confirmation'; // Environment variables for the function

// Asynchronously initialize the Amplify client for the function environment
const initializeAmplifyClient = async () => {
  const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
  Amplify.configure(resourceConfig, libraryOptions);
};

// Call initialization
const amplifyClientInitialized = initializeAmplifyClient();

const client = generateClient<Schema>();

export const handler: PostConfirmationTriggerHandler = async (event) => {
  // Ensure Amplify client is initialized before proceeding
  await amplifyClientInitialized;

  console.log('PostConfirmation Trigger Event:', JSON.stringify(event, null, 2));

  const { sub, email, name } = event.request.userAttributes;

  if (!sub || !email) {
    console.error('Missing user sub or email in event.request.userAttributes');
    return event; // Or throw an error
  }

  try {
    await client.models.Entity.create({
      PK: `USER#${sub}`,
      SK: 'METADATA',
      entityType: 'UserProfile',
      email: email,
      displayName: name, // 'name' attribute from Cognito, if available
      // ownerUserId, internalTitle, status, etc. are not applicable here
    });
    console.log(`Successfully created UserProfile (Entity) for PK: USER#${sub}`);
  } catch (error) {
    console.error(`Error creating UserProfile (Entity) for PK: USER#${sub}:`, error);
    // Depending on your error handling strategy, you might want to:
    // - Log the error and allow Cognito to proceed (as done here)
    // - Throw the error to potentially halt the confirmation (not usually recommended for profile creation)
  }

  return event;
};
