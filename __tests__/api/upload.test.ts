import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/app/api/upload/route';
import { mockAdmin, mockUploader, mockGuest, mockUnauthenticated, mockPrisma } from '../setup';
import { uploadRequest, parseResponse } from '../helpers';

describe('POST /api/upload', () => {
	const validFile = { name: 'photo.jpg', content: 'fake-image-data', type: 'image/jpeg' };

	describe('authentication & authorization', () => {
		it('returns 401 when unauthenticated', async () => {
			mockUnauthenticated();
			const req = uploadRequest('/api/upload', { expiry: '1' }, validFile);
			const { status, body } = await parseResponse(await POST(req));
			expect(status).toBe(401);
			expect(body?.error).toBe('Unauthorized');
		});

		it('returns 403 for guest role', async () => {
			mockGuest();
			const req = uploadRequest('/api/upload', { expiry: '1' }, validFile);
			const { status, body } = await parseResponse(await POST(req));
			expect(status).toBe(403);
			expect(body?.error).toContain('insufficient permissions');
		});

		it('allows uploader role', async () => {
			mockUploader();
			mockPrisma.content.aggregate.mockResolvedValue({ _sum: { fileSize: 0 }, _count: 0 });
			const req = uploadRequest('/api/upload', { expiry: '1' }, validFile);
			const { status, body } = await parseResponse(await POST(req));
			expect(status).toBe(200);
			expect(body?.success).toBe(true);
		});

		it('allows admin role', async () => {
			mockAdmin();
			mockPrisma.content.aggregate.mockResolvedValue({ _sum: { fileSize: 0 }, _count: 0 });
			const req = uploadRequest('/api/upload', { expiry: '1' }, validFile);
			const { status, body } = await parseResponse(await POST(req));
			expect(status).toBe(200);
			expect(body?.success).toBe(true);
		});
	});

	describe('file validation', () => {
		beforeEach(() => mockUploader());

		it('returns 400 when no file is provided', async () => {
			mockPrisma.content.aggregate.mockResolvedValue({ _sum: { fileSize: 0 }, _count: 0 });
			const req = uploadRequest('/api/upload', { expiry: '1' });
			const { status, body } = await parseResponse(await POST(req));
			expect(status).toBe(400);
			expect(body?.error).toBe('No file provided');
		});

		it('rejects blocked file extension', async () => {
			mockPrisma.content.aggregate.mockResolvedValue({ _sum: { fileSize: 0 }, _count: 0 });
			const req = uploadRequest(
				'/api/upload',
				{ expiry: '1' },
				{
					name: 'script.js',
					content: 'alert(1)',
					type: 'text/javascript',
				}
			);
			const { status, body } = await parseResponse(await POST(req));
			expect(status).toBe(400);
			expect(body?.error).toContain('blocked');
		});

		it('rejects unknown file extension', async () => {
			mockPrisma.content.aggregate.mockResolvedValue({ _sum: { fileSize: 0 }, _count: 0 });
			const req = uploadRequest(
				'/api/upload',
				{ expiry: '1' },
				{
					name: 'data.xyz',
					content: 'data',
				}
			);
			const { status, body } = await parseResponse(await POST(req));
			expect(status).toBe(400);
			expect(body?.error).toContain('not allowed');
		});
	});

	describe('expiry validation', () => {
		beforeEach(() => {
			mockUploader();
			mockPrisma.content.aggregate.mockResolvedValue({ _sum: { fileSize: 0 }, _count: 0 });
		});

		it('uploader cannot set expiry to off', async () => {
			const req = uploadRequest('/api/upload', { expiry: 'off' }, validFile);
			const { status, body } = await parseResponse(await POST(req));
			expect(status).toBe(400);
			expect(body?.error).toContain('Only admins');
		});

		it('uploader cannot exceed 7-day expiry', async () => {
			const req = uploadRequest('/api/upload', { expiry: '200' }, validFile);
			const { status, body } = await parseResponse(await POST(req));
			expect(status).toBe(400);
			expect(body?.error).toContain('7 days');
		});

		it('defaults to 1h expiry when not specified', async () => {
			const req = uploadRequest('/api/upload', {}, validFile);
			const { status } = await parseResponse(await POST(req));
			expect(status).toBe(200);
			// The content should have been created with an expiresAt ~1h in the future
			expect(mockPrisma.content.create).toHaveBeenCalledTimes(1);
			const callData = mockPrisma.content.create.mock.calls[0][0].data;
			expect(callData.expiresAt).toBeInstanceOf(Date);
		});

		it('admin can set expiry to off', async () => {
			mockAdmin();
			mockPrisma.content.aggregate.mockResolvedValue({ _sum: { fileSize: 0 }, _count: 0 });
			const req = uploadRequest('/api/upload', { expiry: 'off' }, validFile);
			const { status, body } = await parseResponse(await POST(req));
			expect(status).toBe(200);
			expect(body?.success).toBe(true);
		});
	});

	describe('storage limit', () => {
		it('rejects upload when storage limit exceeded', async () => {
			mockUploader();
			// Simulate 499MB already used, uploading a 2MB file (exceeds 500MB limit)
			mockPrisma.content.aggregate.mockResolvedValue({
				_sum: { fileSize: 499 * 1024 * 1024 },
				_count: 10,
			});
			const largeFile = {
				name: 'big.pdf',
				content: 'x'.repeat(2 * 1024 * 1024),
				type: 'application/pdf',
			};
			const req = uploadRequest('/api/upload', { expiry: '1' }, largeFile);
			const { status, body } = await parseResponse(await POST(req));
			expect(status).toBe(400);
			expect(body?.error).toContain('Storage limit exceeded');
		});
	});

	describe('successful upload', () => {
		it('creates content record and returns URL', async () => {
			mockUploader();
			mockPrisma.content.aggregate.mockResolvedValue({ _sum: { fileSize: 0 }, _count: 0 });
			const req = uploadRequest('/api/upload', { expiry: '24' }, validFile);
			const { status, body } = await parseResponse(await POST(req));
			expect(status).toBe(200);
			expect(body?.success).toBe(true);
			const content = body?.content as Record<string, unknown>;
			expect(content.id).toBeDefined();
			expect(content.url).toMatch(/\/c\//);
			expect(content.filename).toBeDefined();
		});

		it('uses short generated ID from generateContentId', async () => {
			mockUploader();
			mockPrisma.content.aggregate.mockResolvedValue({ _sum: { fileSize: 0 }, _count: 0 });
			const req = uploadRequest('/api/upload', { expiry: '1' }, validFile);
			const { status, body } = await parseResponse(await POST(req));
			expect(status).toBe(200);
			const content = body?.content as Record<string, unknown>;
			// The mock returns 'ab12cd34' — verify it's used in the id and URL
			expect(content.id).toBe('ab12cd34');
			expect(content.url).toContain('/c/ab12cd34');
		});

		it('passes generated ID to content.create', async () => {
			mockUploader();
			mockPrisma.content.aggregate.mockResolvedValue({ _sum: { fileSize: 0 }, _count: 0 });
			const req = uploadRequest('/api/upload', { expiry: '1' }, validFile);
			await POST(req);
			const callData = mockPrisma.content.create.mock.calls[0][0].data;
			expect(callData.id).toBe('ab12cd34');
		});
	});
});
