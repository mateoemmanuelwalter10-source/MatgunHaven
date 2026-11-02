# MatGunHaven Web App

React application using Supabase for authentication and data.

## User invitations

Public registration is removed. Administrators invite team members from **User management**. The `create-user` Supabase Edge Function verifies the signed-in user's administrator role and sends an invitation with Supabase Auth. The Auth user trigger creates the corresponding profile row. Invitees confirm their email and set a password on the `/reset-password` page before signing in.

Deploy the function to the linked Supabase project:

```sh
supabase functions deploy create-user
```

In the Supabase dashboard, disable public user sign-ups under **Authentication** settings. The admin function can still create users when public sign-ups are disabled. Never expose the Supabase service-role key in the browser or in frontend environment variables.

Add the deployed app callback to **Authentication > URL Configuration > Redirect URLs** in Supabase: `https://matgunhaven-primary.pages.dev/reset-password`. The invitation function always redirects to the deployed app, even when an administrator sends the invitation while testing on localhost. If your production domain changes, set the `APP_URL` Edge Function environment variable to the new HTTPS origin (for example, `https://your-domain.example`) before deploying the function. Configure a working SMTP provider and the **Invite user** email template so invitation emails can be delivered.
