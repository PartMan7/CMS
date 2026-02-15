'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileDropZone } from '@/components/file-drop-zone';
import { RequiredMark } from '@/components/required-mark';
import { toast } from 'sonner';

interface UploadFormProps {
	isAdmin: boolean;
}

const EXPIRY_OPTIONS = [
	{ value: '0.25', label: '15 minutes' },
	{ value: '0.5', label: '30 minutes' },
	{ value: '1', label: '1 hour' },
	{ value: '6', label: '6 hours' },
	{ value: '24', label: '1 day' },
	{ value: '72', label: '3 days' },
	{ value: '168', label: '7 days' },
];

const ADMIN_EXPIRY_OPTIONS = [{ value: 'off', label: 'Never (permanent)' }, ...EXPIRY_OPTIONS];

export function UploadForm({ isAdmin }: UploadFormProps) {
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState('');
	const [result, setResult] = useState<{
		id: string;
		filename: string;
		url: string;
		expiresAt: string | null;
	} | null>(null);
	const [expiry, setExpiry] = useState('1');
	const [filename, setFilename] = useState('');
	const [fileResetKey, setFileResetKey] = useState(0);
	const fileRef = useRef<HTMLInputElement>(null);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError('');
		setResult(null);
		setUploading(true);

		try {
			const formData = new FormData(e.currentTarget);
			formData.set('expiry', expiry);

			const file = formData.get('file') as File;
			if (!file || file.size === 0) {
				setError('Please select a file');
				setUploading(false);
				return;
			}

			const res = await fetch('/api/upload', {
				method: 'POST',
				body: formData,
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || 'Upload failed');
			} else {
				setResult(data.content);
				toast.success('File uploaded successfully');
				// Clear all fields except expiry
				setFilename('');
				setFileResetKey(k => k + 1);
			}
		} catch {
			setError('An error occurred during upload');
		} finally {
			setUploading(false);
		}
	}

	const expiryOptions = isAdmin ? ADMIN_EXPIRY_OPTIONS : EXPIRY_OPTIONS;

	return (
		<div className="space-y-4">
			<div aria-live="polite" aria-atomic="true">
				{result && (
					<Alert>
						<AlertDescription>
							<p className="font-medium">Upload successful!</p>
							<p className="text-sm mt-1">
								File: {result.filename}
								<br />
								URL:{' '}
								<a href={result.url} className="text-primary underline" target="_blank" rel="noopener noreferrer">
									{result.url}
									<span className="sr-only"> (opens in new tab)</span>
								</a>
								<br />
								{result.expiresAt ? `Expires: ${new Date(result.expiresAt).toLocaleString()}` : 'Permanent (no expiry)'}
							</p>
						</AlertDescription>
					</Alert>
				)}
			</div>

			<Card className="border-primary/20">
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4" aria-label="Upload file">
						<div aria-live="assertive" aria-atomic="true">
							{error && (
								<Alert variant="destructive">
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}
						</div>

						<div className="space-y-2">
							<Label>
								File
								<RequiredMark />
							</Label>
							<FileDropZone key={fileResetKey} inputRef={fileRef} name="file" required aria-required="true" />
						</div>

						<div className="space-y-2">
							<Label htmlFor="filename">Custom Filename</Label>
							<Input
								id="filename"
								name="filename"
								type="text"
								placeholder="Leave blank to use original filename."
								value={filename}
								onChange={e => setFilename(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label>
								Expiry
								<RequiredMark />
							</Label>
							<Select value={expiry} onValueChange={setExpiry} required>
								<SelectTrigger aria-required="true">
									<SelectValue placeholder="Select expiry time" />
								</SelectTrigger>
								<SelectContent>
									{expiryOptions.map(opt => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<Button type="submit" className="w-full" disabled={uploading} aria-busy={uploading}>
							{uploading ? 'Uploading...' : 'Upload'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
