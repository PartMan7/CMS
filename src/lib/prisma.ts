import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

function resolveDbUrl(): string {
	const raw = process.env.DATABASE_URL || 'file:./dev.db';
	if (raw.startsWith('file:')) {
		const filePath = raw.slice(5);
		const absPath = path.resolve(process.cwd(), filePath);
		return `file:${absPath}`;
	}
	return raw;
}

function createPrismaClient() {
	const url = resolveDbUrl();
	const adapter = new PrismaBetterSqlite3({ url });
	return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma;
}
