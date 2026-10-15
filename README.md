# MatGunHaven Web App

React application using Supabase for authentication and data.

## User account creation

Public registration is removed. Administrators create team accounts from **User management**. This flow uses the `create-user` Supabase Edge Function, which verifies the signed-in user's administrator role before using the server-side Auth Admin API.

Deploy the function to the linked Supabase project:

```sh
supabase functions deploy create-user
```

In the Supabase dashboard, disable public user sign-ups under **Authentication** settings. The admin function can still create users when public sign-ups are disabled. Never expose the Supabase service-role key in the browser or in frontend environment variables.
