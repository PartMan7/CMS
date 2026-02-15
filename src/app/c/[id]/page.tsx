import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Nav } from '@/components/nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ContentViewProps {
	params: Promise<{ id: string }>;
}

function isImage(mime: string) {
	return mime.startsWith('image/');
}
function isVideo(mime: string) {
	return mime.startsWith('video/');
}
function isAudio(mime: string) {
	return mime.startsWith('audio/');
}
function isPdf(mime: string) {
	return mime === 'application/pdf';
}
function isText(mime: string) {
	return mime === 'text/plain' || mime === 'text/csv';
}

function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function ContentViewPage({ params }: ContentViewProps) {
	const session = await auth();
	if (!session?.user) redirect('/login');

	const { id } = await params;

	const content = await prisma.content.findUnique({
		where: { id },
		include: {
			uploadedBy: { select: { username: true } },
		},
	});

	if (!content) notFound();

	const expired = content.expiresAt && new Date(content.expiresAt) < new Date();
	const rawUrl = `/r/${content.id}`;
	const downloadUrl = `/api/content/${content.id}`;
	const mime = content.mimeType;

	return (
		<div className="min-h-screen">
			<Nav role={session.user.role} username={session.user.name ?? 'Unknown'} />
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{expired ? (
					<Card>
						<CardHeader>
							<CardTitle>Content Expired</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground">
								This content expired on {new Date(content.expiresAt!).toLocaleString()} and is no longer available.
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-4">
						{/* Header */}
						<div className="flex items-center justify-between">
							<h1 className="text-xl font-semibold truncate">{content.filename}</h1>
							<div className="flex gap-2 shrink-0">
								<Link href={rawUrl}>
									<Button variant="outline" size="sm">
										Raw
									</Button>
								</Link>
								<Link href={downloadUrl}>
									<Button size="sm">Download</Button>
								</Link>
							</div>
						</div>

						{/* Inline viewer */}
						<Card>
							<CardContent className="p-4">
								{isImage(mime) && (
									/* eslint-disable-next-line @next/next/no-img-element */
									<img src={rawUrl} alt={content.filename} className="max-w-full h-auto mx-auto rounded" />
								)}

								{isVideo(mime) && (
									<video controls className="max-w-full mx-auto rounded">
										<source src={rawUrl} type={mime} />
										Your browser does not support this video format.
									</video>
								)}

								{isAudio(mime) && (
									<audio controls className="w-full">
										<source src={rawUrl} type={mime} />
										Your browser does not support this audio format.
									</audio>
								)}

								{isPdf(mime) && <iframe src={rawUrl} className="w-full h-[80vh] rounded border-0" title={content.filename} />}

								{isText(mime) && (
									<iframe src={rawUrl} className="w-full h-[60vh] rounded border-0 bg-muted" title={content.filename} />
								)}

								{!isImage(mime) && !isVideo(mime) && !isAudio(mime) && !isPdf(mime) && !isText(mime) && (
									<div className="text-center py-12 space-y-4">
										<p className="text-muted-foreground">This file type ({mime}) cannot be previewed in the browser.</p>
										<Link href={downloadUrl}>
											<Button>Download File</Button>
										</Link>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Metadata */}
						<Card>
							<CardContent className="p-4">
								<div className="grid grid-cols-2 gap-2 text-sm">
									<span className="text-muted-foreground">Original Name</span>
									<span>{content.originalFilename}</span>

									<span className="text-muted-foreground">Size</span>
									<span>{formatSize(content.fileSize)}</span>

									<span className="text-muted-foreground">Type</span>
									<span>{content.mimeType}</span>

									<span className="text-muted-foreground">Extension</span>
									<Badge variant="secondary">{content.fileExtension}</Badge>

									<span className="text-muted-foreground">Uploaded By</span>
									<span>{content.uploadedBy.username}</span>

									<span className="text-muted-foreground">Created</span>
									<span>{new Date(content.createdAt).toLocaleString()}</span>

									<span className="text-muted-foreground">Expires</span>
									<span>{content.expiresAt ? new Date(content.expiresAt).toLocaleString() : 'Never'}</span>
								</div>
							</CardContent>
						</Card>
					</div>
				)}
			</div>
		</div>
	);
}
