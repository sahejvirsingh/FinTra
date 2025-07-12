// 'use client'
// import { useEffect, useState } from 'react'
// import { useSession, useUser } from '@clerk/nextjs'
// import { createClient } from '@supabase/supabase-js'
// const supabaseUrl = process.env.SUPABASE_URL ;
// const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ;
// // Ensure that the Clerk session is loaded and retrieve the JWT token
// const createClerkSupabaseClient = () => {
//   return createClient(supabaseUrl, supabaseAnonKey, {
//     global: {
//       fetch: async (url, options = {}) => {
//         // Check if Clerk is available and retrieve the JWT token
//         let clerkToken = null;

//         if (window.Clerk && window.Clerk.session) {
//           clerkToken = await window.Clerk.session.getToken({ template: 'supabase' });
//         } else {
//           // Optionally, retrieve the token from Expo Secure Store (if stored)
//           clerkToken = await SecureStore.getItemAsync('clerk_jwt');
//         }

//         if (clerkToken) {
//           const headers = new Headers(options?.headers);
//           headers.set('Authorization', `Bearer ${clerkToken}`);

//           return fetch(url, {
//             ...options,
//             headers,
//           });
//         }

//         // If no token is found, return an error response or handle accordingly
//         throw new Error('No Clerk JWT token available');
//       },
//     },
//   });
// };

// export const client = createClerkSupabaseClient();
// "use client";
import { createClient } from "@supabase/supabase-js";
// import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config";
import { Database } from "./database.types";

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) {
  // This error will be thrown if the environment variables for Supabase are not set.
  // Make sure SUPABASE_URL and SUPABASE_ANON_KEY are available in your environment.
  const errorMessage =
    "NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. Check your environment variables or config.ts.";
  console.error(errorMessage);
  throw new Error(errorMessage);
}

// Supabase client, with authentication handled by Clerk.
// A JWT from Clerk will be used to authenticate requests.
export const supabaseClient = async (token: string) => {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false, // We'll handle auth through Clerk
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
  return supabase;
};
