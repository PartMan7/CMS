'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, ClipboardPaste, X, FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileDropZoneProps {
	/** Ref exposed so parent forms can read `.files` / reset `.value` */
	inputRef?: React.RefObject<HTMLInputElement | null>;
	/** HTML name attribute for the hidden file input */
	name?: string;
	id?: string;
	required?: boolean;
	/** Passed through to the drop-zone for screen readers */
	'aria-required'?: boolean | 'true' | 'false';
	/** Called whenever the selected file changes (including clear) */
	onFileChange?: (file: File | null) => void;
}

function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileDropZone({
	inputRef: externalRef,
	name = 'file',
	id,
	required,
	'aria-required': ariaRequired,
	onFileChange,
}: FileDropZoneProps) {
	const internalRef = useRef<HTMLInputElement>(null);
	const fileInputRef = externalRef ?? internalRef;
	const zoneRef = useRef<HTMLDivElement>(null);

	const [dragging, setDragging] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const dragCounter = useRef(0);

	/** Apply a file to the hidden input and update state */
	const applyFile = useCallback(
		(file: File) => {
			// Set the file on the hidden input via DataTransfer
			const dt = new DataTransfer();
			dt.items.add(file);
			if (fileInputRef.current) {
				fileInputRef.current.files = dt.files;
			}
			setSelectedFile(file);
			onFileChange?.(file);
		},
		[fileInputRef, onFileChange]
	);

	const clearFile = useCallback(() => {
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
		setSelectedFile(null);
		onFileChange?.(null);
	}, [fileInputRef, onFileChange]);

	/* ── Drag & Drop ─────────────────────────────────────────────────────── */
	const handleDragEnter = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		dragCounter.current++;
		if (e.dataTransfer.types.includes('Files')) {
			setDragging(true);
		}
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		dragCounter.current--;
		if (dragCounter.current === 0) {
			setDragging(false);
		}
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			dragCounter.current = 0;
			setDragging(false);

			const file = e.dataTransfer.files?.[0];
			if (file) applyFile(file);
		},
		[applyFile]
	);

	/* ── Clipboard paste (global) ────────────────────────────────────────── */
	useEffect(() => {
		function handlePaste(e: ClipboardEvent) {
			// Don't intercept if user is typing in an input/textarea
			const target = e.target as HTMLElement;
			if (
				target.tagName === 'INPUT' &&
				(target as HTMLInputElement).type !== 'file' &&
				(target as HTMLInputElement).type !== 'hidden'
			) return;
			if (target.tagName === 'TEXTAREA' || target.isContentEditable) return;

			const items = e.clipboardData?.items;
			if (!items) return;

			for (const item of items) {
				if (item.kind === 'file') {
					const file = item.getAsFile();
					if (file) {
						e.preventDefault();
						applyFile(file);
						return;
					}
				}
			}
		}

		document.addEventListener('paste', handlePaste);
		return () => document.removeEventListener('paste', handlePaste);
	}, [applyFile]);

	/* ── Click to browse ─────────────────────────────────────────────────── */
	const handleClick = useCallback(() => {
		fileInputRef.current?.click();
	}, [fileInputRef]);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0] ?? null;
			setSelectedFile(file);
			onFileChange?.(file);
		},
		[onFileChange]
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				handleClick();
			}
		},
		[handleClick]
	);

	return (
		<div className="space-y-2">
			{/* Hidden native file input */}
			<input
				ref={fileInputRef}
				type="file"
				name={name}
				id={id}
				required={required && !selectedFile}
				className="sr-only"
				tabIndex={-1}
				onChange={handleInputChange}
				aria-hidden="true"
			/>

			{/* Drop zone */}
			<div
				ref={zoneRef}
				role="button"
				tabIndex={0}
				aria-label={selectedFile ? `Selected file: ${selectedFile.name}. Click to change file, or drag and drop, or paste from clipboard.` : 'Choose a file. Click to browse, drag and drop, or paste from clipboard.'}
				aria-required={ariaRequired}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
				className={cn(
					'relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-8 transition-colors cursor-pointer',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
					dragging
						? 'border-primary bg-primary/5 text-primary'
						: selectedFile
							? 'border-primary/40 bg-primary/5'
							: 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
				)}
			>
				{selectedFile ? (
					/* ── File selected state ───────────────────────────────── */
					<div className="flex items-center gap-3 w-full">
						<div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
							<FileIcon className="h-5 w-5 text-primary" aria-hidden="true" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium truncate">{selectedFile.name}</p>
							<p className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</p>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-8 w-8 p-0 shrink-0"
							onClick={e => {
								e.stopPropagation();
								clearFile();
							}}
							aria-label="Remove selected file"
						>
							<X className="h-4 w-4" aria-hidden="true" />
						</Button>
					</div>
				) : (
					/* ── Empty state ───────────────────────────────────────── */
					<>
						{dragging ? (
							<Upload className="h-8 w-8 text-primary animate-bounce" aria-hidden="true" />
						) : (
							<Upload className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
						)}
						<div className="text-center space-y-1">
							<p className="text-sm font-medium">
								{dragging ? 'Drop file here' : 'Click to browse, drag & drop'}
							</p>
							<p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
								<ClipboardPaste className="h-3 w-3" aria-hidden="true" />
								or paste from clipboard
							</p>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
