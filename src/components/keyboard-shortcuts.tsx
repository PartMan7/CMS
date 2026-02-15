'use client';

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface Shortcut {
	keys: string[];
	label: string;
}

interface ShortcutGroup {
	title: string;
	shortcuts: Shortcut[];
}

const emptySubscribe = () => () => {};

/** Detect macOS / iOS so we can show the correct modifier symbol. */
function useIsMac() {
	return useSyncExternalStore(
		emptySubscribe,
		() => /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent),
		() => false
	);
}

/** Return the display string for the "Ctrl / Cmd" modifier. */
function useModKey() {
	const isMac = useIsMac();
	return isMac ? '⌘' : 'Ctrl';
}

const KBD_CLASSES =
	'inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 text-xs font-medium text-foreground';

const KBD_SMALL_CLASSES =
	'inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1 text-[10px] font-medium';

export function KeyboardShortcuts() {
	const [open, setOpen] = useState(false);
	const router = useRouter();
	const pathname = usePathname();
	const mod = useModKey();

	const shortcutGroups: ShortcutGroup[] = useMemo(
		() => [
			{
				title: 'General',
				shortcuts: [{ keys: [mod, '/'], label: 'Show keyboard shortcuts' }],
			},
			{
				title: 'Navigation',
				shortcuts: [
					{ keys: ['U'], label: 'Go to Upload' },
					{ keys: ['D'], label: 'Go to Dashboard' },
					{ keys: ['C'], label: 'Go to Content (admin)' },
					{ keys: ['W'], label: 'Go to Users (admin)' },
				],
			},
			{
				title: 'Accessibility',
				shortcuts: [
					{ keys: ['Tab'], label: 'Move focus to next element' },
					{ keys: ['Shift', 'Tab'], label: 'Move focus to previous element' },
					{ keys: ['Enter'], label: 'Activate focused element' },
					{ keys: ['Escape'], label: 'Close dialog / dropdown' },
				],
			},
		],
		[mod]
	);

	const handleGlobalKeyDown = useCallback(
		(e: KeyboardEvent) => {
			// Don't trigger shortcuts when typing in inputs
			const target = e.target as HTMLElement;
			const isInput =
				target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;

			// Ctrl+/ or Cmd+/ — toggle shortcuts dialog
			if ((e.ctrlKey || e.metaKey) && e.key === '/') {
				e.preventDefault();
				setOpen(prev => !prev);
				return;
			}

			// Don't process navigation shortcuts when in an input or when a modifier is held
			if (isInput) return;
			if (e.ctrlKey || e.metaKey || e.altKey) return;

			// Single-key navigation
			const routes: Record<string, string> = {
				u: '/upload',
				d: '/dashboard',
				c: '/admin/content',
				w: '/admin/users',
			};

			const route = routes[e.key.toLowerCase()];
			if (route && route !== pathname) {
				e.preventDefault();
				router.push(route);
			}
		},
		[router, pathname]
	);

	useEffect(() => {
		window.addEventListener('keydown', handleGlobalKeyDown);
		return () => window.removeEventListener('keydown', handleGlobalKeyDown);
	}, [handleGlobalKeyDown]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Keyboard Shortcuts</DialogTitle>
					<DialogDescription>Use these shortcuts to navigate and interact with the CMS.</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 mt-2">
					{shortcutGroups.map((group, gi) => (
						<div key={group.title}>
							{gi > 0 && <Separator className="mb-4" />}
							<h3 className="text-sm font-semibold text-muted-foreground mb-3">{group.title}</h3>
							<div className="space-y-2">
								{group.shortcuts.map((shortcut, si) => (
									<div key={si} className="flex items-center justify-between py-1">
										<span className="text-sm">{shortcut.label}</span>
										<div className="flex items-center gap-1">
											{shortcut.keys.map((key, ki) => (
												<kbd key={ki} className={KBD_CLASSES}>
													{key}
												</kbd>
											))}
										</div>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
				<div className="mt-2 pt-3 border-t">
					<p className="text-xs text-muted-foreground text-center">
						Press <kbd className={KBD_SMALL_CLASSES}>{mod}</kbd> <kbd className={KBD_SMALL_CLASSES}>/</kbd> to close
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
