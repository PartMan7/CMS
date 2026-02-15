import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/permissions';
import { hashSync } from 'bcryptjs';
import { ROLES } from '@/lib/config';

export async function GET() {
	const session = await auth();
	if (!session?.user || !isAdmin(session.user.role)) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	const users = await prisma.user.findMany({
		select: {
			id: true,
			username: true,
			role: true,
			createdAt: true,
			updatedAt: true,
			_count: { select: { content: true } },
		},
		orderBy: { createdAt: 'desc' },
	});

	return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
	const session = await auth();
	if (!session?.user || !isAdmin(session.user.role)) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		const body = await req.json();
		const { username, password, role } = body;

		if (!username || !password) {
			return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
		}

		if (username.length < 3 || username.length > 50) {
			return NextResponse.json({ error: 'Username must be 3-50 characters' }, { status: 400 });
		}

		if (password.length < 8) {
			return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
		}

		if (role && !ROLES.includes(role)) {
			return NextResponse.json({ error: `Invalid role. Must be one of: ${ROLES.join(', ')}` }, { status: 400 });
		}

		const existing = await prisma.user.findUnique({ where: { username } });
		if (existing) {
			return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
		}

		const user = await prisma.user.create({
			data: {
				username,
				passwordHash: hashSync(password, 12),
				role: role || 'guest',
			},
			select: {
				id: true,
				username: true,
				role: true,
				createdAt: true,
			},
		});

		return NextResponse.json({ user }, { status: 201 });
	} catch (error) {
		console.error('Create user error:', error);
		return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
	}
}
