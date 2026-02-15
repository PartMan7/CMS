import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

export const metadata: Metadata = {
	title: 'CMS - Content Management System',
	description: 'Content Management System for partman.dev',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className="antialiased min-h-screen bg-background">
				{children}
				<Toaster />
			</body>
		</html>
	);
}
