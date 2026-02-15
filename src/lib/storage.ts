import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { UPLOAD_BASE_DIR } from './config';

/**
 * Ensure the upload base directory exists.
 */
export function ensureUploadDir(subDir?: string): string {
	const dir = subDir ? path.join(UPLOAD_BASE_DIR, subDir) : UPLOAD_BASE_DIR;

	// SECURITY: Validate the directory is within the upload base
	const resolvedDir = path.resolve(dir);
	const resolvedBase = path.resolve(UPLOAD_BASE_DIR);
	if (resolvedDir !== resolvedBase && !resolvedDir.startsWith(resolvedBase + path.sep)) {
		throw new Error('Path traversal detected in directory');
	}

	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
	return dir;
}

/**
 * Save a file buffer to disk. Returns the relative storage path.
 */
export async function saveFile(buffer: Buffer, filename: string, subDir?: string): Promise<string> {
	const dir = ensureUploadDir(subDir);
	const filePath = path.join(dir, filename);

	// SECURITY: Ensure the resolved path is within the upload directory
	const resolvedPath = path.resolve(filePath);
	const resolvedBase = path.resolve(UPLOAD_BASE_DIR);
	if (resolvedPath !== resolvedBase && !resolvedPath.startsWith(resolvedBase + path.sep)) {
		throw new Error('Path traversal detected');
	}

	await fs.writeFile(filePath, buffer);

	// Return relative path from UPLOAD_BASE_DIR
	return path.relative(UPLOAD_BASE_DIR, filePath);
}

/**
 * Read a file from storage. Returns the full path.
 */
export function getFilePath(storagePath: string): string {
	const fullPath = path.resolve(path.join(UPLOAD_BASE_DIR, storagePath));
	const resolvedBase = path.resolve(UPLOAD_BASE_DIR);

	// SECURITY: Prevent path traversal (use separator to avoid prefix bypass)
	if (fullPath !== resolvedBase && !fullPath.startsWith(resolvedBase + path.sep)) {
		throw new Error('Path traversal detected');
	}

	return fullPath;
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(storagePath: string): Promise<void> {
	const fullPath = getFilePath(storagePath);
	try {
		await fs.unlink(fullPath);
	} catch (err) {
		// File might already be deleted
		if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
			throw err;
		}
	}
}

/**
 * Check if a file exists in storage.
 */
export async function fileExists(storagePath: string): Promise<boolean> {
	const fullPath = getFilePath(storagePath);
	return existsSync(fullPath);
}
