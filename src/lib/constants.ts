
import { User, Users } from 'lucide-react';
import type { OwnerId, UserProfile } from './types';

export const ALLOWED_USERS = [
  'ali@khanevadati.app',
  'fatemeh@khanevadati.app',
];

// This object holds STATIC information. The dynamic UID is now managed via the users collection in Firestore.
export const USER_DETAILS: Record<'ali' | 'fatemeh', Omit<UserProfile, 'id'>> = {
  ali: {
    email: 'ali@khanevadati.app',
    firstName: 'علی',
    lastName: 'کاکایی',
    signatureImage: '/images/ali-signature.png',
  },
  fatemeh: {
    email: 'fatemeh@khanevadati.app',
    firstName: 'فاطمه',
    lastName: 'صالح',
    signatureImage: '/images/fatemeh-signature.png',
  },
};

type OwnerDetails = {
    name: string;
    Icon: React.ElementType;
}

export const OWNER_DETAILS: Record<OwnerId, OwnerDetails> = {
    ali: {
        name: USER_DETAILS.ali.firstName,
        Icon: User,
    },
    fatemeh: {
        name: USER_DETAILS.fatemeh.firstName,
        Icon: User,
    },
    shared: {
        name: "مشترک",
        Icon: Users,
    }
}
