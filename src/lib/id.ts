import { randomBytes } from 'crypto';
import { prisma } from './prisma';

/**
 * Alphabet: lowercase + digits (base36). URL-safe, easy to read/copy.
 * 6 chars of base36 = 36^6 ≈ 2.2 billion combinations.
 */
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const ID_LENGTH = 6;

/**
 * Generate a random short ID string.
 */
function randomShortId(): string {
	const bytes = randomBytes(ID_LENGTH);
	let id = '';
	for (let i = 0; i < ID_LENGTH; i++) {
		id += ALPHABET[bytes[i] % ALPHABET.length];
	}
	return id;
}

/**
 * Generate a unique short content ID with collision checking.
 * Retries up to `maxAttempts` times if a collision is detected.
 */
export async function generateContentId(maxAttempts = 5): Promise<string> {
	for (let i = 0; i < maxAttempts; i++) {
		const id = randomShortId();
		const existing = await prisma.content.findUnique({ where: { id } });
		if (!existing) return id;
	}
	throw new Error('Failed to generate a unique content ID after multiple attempts');
}
