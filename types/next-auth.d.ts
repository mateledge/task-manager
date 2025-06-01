import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
  }

  interface JWT {
    access_token?: string;
  }
}
