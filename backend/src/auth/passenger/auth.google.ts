import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

export interface GoogleProfile {
  googleId: string;
  email?: string;
  emailVerified?: boolean;
  firstName: string;
  lastName: string;
  fullName: string;
  picture?: string;
}

export const verifyGoogleIdToken = async (idToken: string): Promise<GoogleProfile> => {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Client ID non configuré. Ajoutez GOOGLE_CLIENT_ID dans le fichier .env du backend.');
  }

  const client = new OAuth2Client(GOOGLE_CLIENT_ID);

  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
  } catch {
    throw new Error('Token Google invalide ou expiré.');
  }

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Impossible de lire les informations du compte Google.');
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified === true,
    firstName: payload.given_name || '',
    lastName: payload.family_name || '',
    fullName: payload.name || '',
    picture: payload.picture,
  };
};
