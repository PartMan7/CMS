'use client';

/**
 * Skip-to-content link — visible only on keyboard focus.
 * Allows keyboard users to bypass the nav and jump straight to <main>.
 */
export function SkipLink() {
	return (
		<a
			href="#main-content"
			className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-100 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
		>
			Skip to main content
		</a>
	);
}
