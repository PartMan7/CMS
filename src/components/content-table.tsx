'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ContentItem {
	id: string;
	filename: string;
	originalFilename: string;
	directory: string | null;
	shortSlugs: { slug: string }[];
	fileSize: number;
	fileExtension: string;
	mimeType: string;
	expiresAt: string | null;
	createdAt: string;
	uploadedBy: {
		id: string;
		username: string;
		role: string;
	};
}

function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function isExpired(expiresAt: string | null): boolean {
	if (!expiresAt) return false;
	return new Date(expiresAt) < new Date();
}

export function ContentManager() {
	const [content, setContent] = useState<ContentItem[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchContent = useCallback(async () => {
		try {
			const res = await fetch('/api/admin/content');
			const data = await res.json();
			setContent(data.content || []);
		} catch {
			toast.error('Failed to load content');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchContent();
	}, [fetchContent]);

	async function handleDelete(item: ContentItem) {
		if (!confirm(`Delete "${item.filename}"? This cannot be undone.`)) return;

		try {
			const res = await fetch(`/api/admin/content/${item.id}`, { method: 'DELETE' });
			if (res.ok) {
				toast.success(`"${item.filename}" deleted`);
				fetchContent();
			} else {
				const data = await res.json();
				toast.error(data.error || 'Failed to delete content');
			}
		} catch {
			toast.error('Failed to delete content');
		}
	}

	async function handleAddSlug(item: ContentItem) {
		const slug = prompt('Enter a new short slug for /s/ URL:');
		if (!slug) return;

		try {
			const res = await fetch(`/api/admin/content/${item.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ addSlugs: [slug] }),
			});
			if (res.ok) {
				toast.success(`Short URL added: /s/${slug}`);
				fetchContent();
			} else {
				const data = await res.json();
				toast.error(data.error || 'Failed to add slug');
			}
		} catch {
			toast.error('Failed to add slug');
		}
	}

	async function handleRemoveSlug(item: ContentItem, slug: string) {
		if (!confirm(`Remove short URL /s/${slug}?`)) return;

		try {
			const res = await fetch(`/api/admin/content/${item.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ removeSlugs: [slug] }),
			});
			if (res.ok) {
				toast.success(`Short URL /s/${slug} removed`);
				fetchContent();
			} else {
				const data = await res.json();
				toast.error(data.error || 'Failed to remove slug');
			}
		} catch {
			toast.error('Failed to remove slug');
		}
	}

	async function handleRemoveExpiry(item: ContentItem) {
		try {
			const res = await fetch(`/api/admin/content/${item.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ expiresAt: null }),
			});
			if (res.ok) {
				toast.success('Expiry removed');
				fetchContent();
			} else {
				toast.error('Failed to update content');
			}
		} catch {
			toast.error('Failed to update content');
		}
	}

	if (loading) return <p className="text-muted-foreground">Loading content...</p>;

	return (
		<div className="space-y-4">
			<p className="text-muted-foreground">{content.length} item(s)</p>

			<div className="rounded-md border overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Filename</TableHead>
							<TableHead>Short URLs</TableHead>
							<TableHead>Directory</TableHead>
							<TableHead>Size</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Uploaded By</TableHead>
							<TableHead>Expiry</TableHead>
							<TableHead>Created</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{content.map(item => (
							<TableRow key={item.id} className={isExpired(item.expiresAt) ? 'opacity-50' : ''}>
								<TableCell className="font-medium max-w-48 truncate">{item.filename}</TableCell>
								<TableCell>
									<div className="flex flex-col gap-1">
										{item.shortSlugs.length > 0 ? (
											item.shortSlugs.map(({ slug }) => (
												<div key={slug} className="flex items-center gap-1">
													<a href={`/s/${slug}`} className="text-primary underline text-sm" target="_blank">
														/s/{slug}
													</a>
													<button
														onClick={() => handleRemoveSlug(item, slug)}
														className="text-destructive hover:text-destructive/80 text-xs ml-1"
														title="Remove slug"
													>
														x
													</button>
												</div>
											))
										) : (
											<span className="text-muted-foreground text-sm">-</span>
										)}
									</div>
								</TableCell>
								<TableCell>
									{item.directory ? (
										<Badge variant="outline">{item.directory}</Badge>
									) : (
										<span className="text-muted-foreground">-</span>
									)}
								</TableCell>
								<TableCell>{formatSize(item.fileSize)}</TableCell>
								<TableCell>
									<Badge variant="secondary">{item.fileExtension}</Badge>
								</TableCell>
								<TableCell>{item.uploadedBy.username}</TableCell>
								<TableCell>
									{item.expiresAt ? (
										isExpired(item.expiresAt) ? (
											<Badge variant="destructive">Expired</Badge>
										) : (
											<span className="text-sm">{new Date(item.expiresAt).toLocaleString()}</span>
										)
									) : (
										<Badge>Permanent</Badge>
									)}
								</TableCell>
								<TableCell className="text-sm">{new Date(item.createdAt).toLocaleDateString()}</TableCell>
								<TableCell className="text-right space-x-2">
									<Button variant="outline" size="sm" onClick={() => window.open(`/c/${item.id}`, '_blank')}>
										View
									</Button>
									<Button variant="outline" size="sm" onClick={() => handleAddSlug(item)}>
										Add Slug
									</Button>
									{item.expiresAt && !isExpired(item.expiresAt) && (
										<Button variant="outline" size="sm" onClick={() => handleRemoveExpiry(item)}>
											Make Permanent
										</Button>
									)}
									<Button variant="destructive" size="sm" onClick={() => handleDelete(item)}>
										Delete
									</Button>
								</TableCell>
							</TableRow>
						))}
						{content.length === 0 && (
							<TableRow>
								<TableCell colSpan={9} className="text-center text-muted-foreground py-8">
									No content uploaded yet.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
