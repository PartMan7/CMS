import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/permissions';

export async function GET() {
	const session = await auth();
	if (!session?.user || !isAdmin(session.user.role)) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	const directories = await prisma.allowedDirectory.findMany({
		orderBy: { name: 'asc' },
	});

	return NextResponse.json({ directories });
}
