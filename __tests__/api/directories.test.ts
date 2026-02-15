import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/directories/route';
import { mockAdmin, mockUploader, mockGuest, mockUnauthenticated, mockPrisma } from '../setup';
import { parseResponse } from '../helpers';

describe('GET /api/directories', () => {
	it('returns 403 for unauthenticated', async () => {
		mockUnauthenticated();
		const { status } = await parseResponse(await GET());
		expect(status).toBe(403);
	});

	it('returns 403 for guest', async () => {
		mockGuest();
		const { status } = await parseResponse(await GET());
		expect(status).toBe(403);
	});

	it('returns 403 for uploader', async () => {
		mockUploader();
		const { status } = await parseResponse(await GET());
		expect(status).toBe(403);
	});

	it('returns directories for admin', async () => {
		mockAdmin();
		const dirs = [
			{ id: 'd1', name: 'General', path: 'general' },
			{ id: 'd2', name: 'Images', path: 'images' },
		];
		mockPrisma.allowedDirectory.findMany.mockResolvedValue(dirs);

		const { status, body } = await parseResponse(await GET());
		expect(status).toBe(200);
		expect(body?.directories).toHaveLength(2);
		expect((body?.directories as Array<{ name: string }>)[0].name).toBe('General');
	});
});
