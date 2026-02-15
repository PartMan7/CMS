import { auth as proxy } from '@/lib/auth';

export default proxy;

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
