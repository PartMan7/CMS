import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compareSync } from 'bcryptjs';
import { prisma } from './prisma';
import { authConfig } from './auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
	...authConfig,
	providers: [
		Credentials({
			name: 'credentials',
			credentials: {
				username: { label: 'Username', type: 'text' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				if (!credentials?.username || !credentials?.password) {
					return null;
				}

				const username = credentials.username as string;
				const password = credentials.password as string;

				const user = await prisma.user.findUnique({
					where: { username },
				});

				if (!user) {
					return null;
				}

				const passwordValid = compareSync(password, user.passwordHash);
				if (!passwordValid) {
					return null;
				}

				return {
					id: user.id,
					name: user.username,
					role: user.role,
				};
			},
		}),
	],
});
