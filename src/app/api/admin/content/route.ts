import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/permissions';
import type { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
	const session = await auth();
	if (!session?.user || !isAdmin(session.user.role)) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	const expiredFilter = request.nextUrl.searchParams.get('expired');

	const where: Prisma.ContentWhereInput = {};
	if (expiredFilter === 'active') {
		where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];
	} else if (expiredFilter === 'expired') {
		where.expiresAt = { lte: new Date() };
	}

	const content = await prisma.content.findMany({
		where,
		select: {
			id: true,
			filename: true,
			originalFilename: true,
			directory: true,
			fileSize: true,
			fileExtension: true,
			mimeType: true,
			expiresAt: true,
			createdAt: true,
			previewPath: true, // used only to derive hasPreview below
			uploadedBy: {
				select: { id: true, username: true, role: true },
			},
			shortSlugs: {
				select: { slug: true },
			},
		},
		orderBy: { createdAt: 'desc' },
	});

	// SECURITY: Strip internal filesystem paths; expose only a boolean preview flag
	const safeContent = content.map(({ previewPath, ...rest }) => ({
		...rest,
		hasPreview: !!previewPath,
	}));

	return NextResponse.json({ content: safeContent });
}
