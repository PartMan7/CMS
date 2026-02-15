import 'next-auth';

declare module 'next-auth' {
	interface Session {
		user: {
			id: string;
			name: string;
			role: string;
			email?: string | null;
			image?: string | null;
		};
	}

	interface User {
		role?: string;
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		id: string;
		role: string;
	}
}
