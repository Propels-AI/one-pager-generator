import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { postConfirmation } from '../auth/post-confirmation/resource'; // Will be created in next step

const schema = a
  .schema({
    Entity: a
      .model({
        PK: a.string().required(), // e.g., USER#<id>, ONEPAGER#<id>
        SK: a.string().required(), // e.g., METADATA, DRAFT#<timestamp>
        entityType: a.string().required(), // "UserProfile", "OnePager"

        // UserProfile attributes
        email: a.email(),
        displayName: a.string(),

        // OnePager attributes
        ownerUserId: a.string(), // Stores PK of the UserProfile item (e.g., USER#<id>)
        internalTitle: a.string(),
        status: a.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
        statusUpdatedAt: a.datetime(), // Actual datetime for sorting, used to construct gsi1SK
        templateId: a.string(),
        contentBlocks: a.json(),

        // GSI attributes for byOwnerAndStatusDate
        gsi1PK: a.string(), // Will store ownerUserId (e.g., USER#<id>) for OnePager items
        gsi1SK: a.string(), // Will store <STATUS>#<statusUpdatedAt_ISO_string> for OnePager items

        // Amplify automatically adds createdAt, updatedAt, _version, _lastChangedAt, _deleted
      })
      .identifier(['PK', 'SK'])
      .secondaryIndexes((index) => [
        index('gsi1PK') // Define GSI on gsi1PK
          .sortKeys(['gsi1SK']) // Add gsi1SK as the sort key for this GSI
          .name('byOwnerAndStatusDate'),
      ])
      .authorization((allow) => [
        // The postConfirmation function has schema-level access granted below.
        // Specific operations are handled by its client calls.
        allow.authenticated().to(['create', 'read', 'update', 'delete']),
        allow.publicApiKey().to(['read']),
      ]),
    // Define SharedLink items within AppItem in later sprints
  })
  .authorization((allow) => [
    allow.resource(postConfirmation), // Grant function resource access to the schema
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      // Added API Key auth mode for public access
      expiresInDays: 30,
    },
  },
});
