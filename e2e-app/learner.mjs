// APP-0: the one learner the signed-in tests use, shared by the Supabase stand-in and the tests.
export const USER = {
  id: "00000000-0000-4000-8000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "learner@example.com",
  email_confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  created_at: new Date(Date.now() - 86_400_000).toISOString(),
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
};
