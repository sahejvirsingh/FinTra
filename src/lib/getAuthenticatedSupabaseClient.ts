// import { supabase } from "../lib/supabaseClient";

// type GetToken = (options?: { template?: string }) => Promise<string | null>;

// /**
//  * Returns a Supabase client instance with the Authorization header set.
//  * @param getToken - The `getToken` function from Clerk's `useAuth` hook.
//  */
// export const getAuthenticatedSupabaseClient = async (getToken: GetToken) => {
//   const token = await getToken({ template: "supabase" });

//   if (!token) throw new Error("No Supabase token from Clerk");

//   // Authenticate Supabase with the JWT
//   await supabase.auth.setSession({
//     access_token: token,
//     refresh_token: token,
//   });

//   return supabase;
// };
