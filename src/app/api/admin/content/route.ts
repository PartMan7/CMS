import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/permissions';

export async function GET() {
	const session = await auth();
	if (!session?.user || !isAdmin(session.user.role)) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	const content = await prisma.content.findMany({
		include: {
			uploadedBy: {
				select: { id: true, username: true, role: true },
			},
			shortSlugs: {
				select: { slug: true },
			},
		},
		orderBy: { createdAt: 'desc' },
	});

	return NextResponse.json({ content });
}
