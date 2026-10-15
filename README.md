# MatGunHaven Web App

React application using Supabase for authentication and data.

## User invitations

Public registration is removed. Administrators invite team members from **User management**. The `create-user` Supabase Edge Function verifies the signed-in user's administrator role and sends an invitation with Supabase Auth. The Auth user trigger creates the corresponding profile row. Invitees confirm their email and set a password on the `/reset-password` page before signing in.

Deploy the function to the linked Supabase project:

```sh
supabase functions deploy create-user
```

In the Supabase dashboard, disable public user sign-ups under **Authentication** settings. The admin function can still create users when public sign-ups are disabled. Never expose the Supabase service-role key in the browser or in frontend environment variables.

Add the local and deployed app URLs to **Authentication > URL Configuration > Redirect URLs** in Supabase, including `http://localhost:5173/reset-password` and the deployed `https://<your-pages-hostname>/reset-password`. Configure a working SMTP provider and the **Invite user** email template so invitation emails can be delivered.
