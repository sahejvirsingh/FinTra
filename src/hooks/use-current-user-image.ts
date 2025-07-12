
import { useUser as useClerkUser } from '@clerk/clerk-react';

export const useCurrentUserImage = (): string => {
    const { user } = useClerkUser();
    
    // Clerk's `user.imageUrl` provides a fallback to a default
    // or initials-based avatar if one isn't uploaded.
    return user ? user.imageUrl : '';
};
