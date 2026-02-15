import { describe, it, expect, vi } from 'vitest';
import { mockPrisma } from '../setup';

// Import the real module (bypassing the global mock)
const { generateContentId } = await vi.importActual<typeof import('@/lib/id')>('@/lib/id');

describe('generateContentId', () => {
	it('returns an 8-character lowercase alphanumeric string', async () => {
		// prisma.content.findUnique is mocked to return null (no collision)
		mockPrisma.content.findUnique.mockResolvedValue(null);
		const id = await generateContentId();
		expect(id).toHaveLength(8);
		expect(id).toMatch(/^[a-z0-9]{8}$/);
	});

	it('generates unique IDs across multiple calls', async () => {
		mockPrisma.content.findUnique.mockResolvedValue(null);
		const ids = new Set<string>();
		for (let i = 0; i < 50; i++) {
			ids.add(await generateContentId());
		}
		// With 8 chars of base36 the chance of any collision in 50 is negligible
		expect(ids.size).toBe(50);
	});

	it('retries on collision and succeeds', async () => {
		// First call finds a collision, second does not
		mockPrisma.content.findUnique
			.mockResolvedValueOnce({ id: 'existing' }) // collision
			.mockResolvedValueOnce(null); // no collision

		const id = await generateContentId();
		expect(id).toHaveLength(8);
		expect(mockPrisma.content.findUnique).toHaveBeenCalledTimes(2);
	});

	it('throws after maxAttempts collisions', async () => {
		// Every attempt finds a collision
		mockPrisma.content.findUnique.mockResolvedValue({ id: 'existing' });

		await expect(generateContentId(3)).rejects.toThrow('Failed to generate a unique content ID');
		expect(mockPrisma.content.findUnique).toHaveBeenCalledTimes(3);
	});
});
