import { google } from 'googleapis';
import { getToken } from 'next-auth/jwt';
import type { NextApiRequest } from 'next';

export async function getGoogleClient({ req }: { req: NextApiRequest }) {
  const token = await getToken({ req });

  if (!token || !token.accessToken) {
    console.error('❌ トークンが取得できませんでした :', token);
    throw new Error('No token');
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: token.accessToken as string, });

  const calendar = google.calendar({ version: 'v3', auth });

  return { auth, calendar };
}
