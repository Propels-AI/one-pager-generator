import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  UserProfile: a
    .model({
      userId: a.id().required(), // This will be the Cognito User Sub
      email: a.email().required(),
      displayName: a.string(),
      // Amplify automatically adds createdAt and updatedAt
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('userId').to(['read', 'update']),
    ]),

  OnePager: a
    .model({
      baseOnePagerId: a.string().required(),
      itemSK: a.string().required().default("METADATA"),
      ownerUserId: a.string().required(), // Links to Cognito user sub
      statusUpdatedAt: a.string().required(), // Composite: STATUS#<status>#<updatedAtISOString>
      internalTitle: a.string().required(),
      status: a.string().required(), // e.g., 'DRAFT', 'PUBLISHED'
      templateId: a.string().required(),
      contentBlocks: a.json().required(), // For BlockNote content
      // Amplify automatically adds createdAt and updatedAt
    })
    .identifier(['baseOnePagerId', 'itemSK']) // Custom primary key
    .secondaryIndexes(index => [
      index('ownerUserId').sortKeys(['statusUpdatedAt']).name('UserPagesIndex') // GSI1 - Corrected syntax
    ])
    .authorization((allow) => [
      allow.ownerDefinedIn('ownerUserId').to(['create', 'read', 'update', 'delete']),
      allow.publicApiKey().to(['read']) // Public read via API Key - Corrected syntax
    ]),
  // Define SharedLink model here in later sprints
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: { // Added API Key auth mode for public access
      expiresInDays: 30,
    },
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
