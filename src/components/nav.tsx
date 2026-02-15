'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NavProps {
	role: string;
	username: string;
}

export function Nav({ role, username }: NavProps) {
	const pathname = usePathname();

	const links = [
		{ href: '/dashboard', label: 'Dashboard', minRole: 'guest' },
		{ href: '/upload', label: 'Upload', minRole: 'uploader' },
		{ href: '/admin/upload', label: 'Admin Upload', minRole: 'admin' },
		{ href: '/admin/users', label: 'Users', minRole: 'admin' },
		{ href: '/admin/content', label: 'Content', minRole: 'admin' },
	];

	const roleLevel: Record<string, number> = {
		guest: 0,
		uploader: 1,
		admin: 2,
	};

	const userLevel = roleLevel[role] ?? 0;

	const visibleLinks = links.filter(link => userLevel >= (roleLevel[link.minRole] ?? 0));

	return (
		<nav className="border-b bg-card">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-14">
					<div className="flex items-center gap-6">
						<Link href="/dashboard" className="font-semibold text-lg">
							CMS
						</Link>
						<div className="flex items-center gap-1">
							{visibleLinks.map(link => (
								<Link
									key={link.href}
									href={link.href}
									className={cn(
										'px-3 py-1.5 text-sm rounded-md transition-colors',
										pathname === link.href
											? 'bg-primary text-primary-foreground'
											: 'text-muted-foreground hover:text-foreground hover:bg-muted'
									)}
								>
									{link.label}
								</Link>
							))}
						</div>
					</div>
					<div className="flex items-center gap-3">
						<span className="text-sm text-muted-foreground">{username}</span>
						<Badge variant="outline">{role}</Badge>
						<Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/login' })}>
							Sign Out
						</Button>
					</div>
				</div>
			</div>
		</nav>
	);
}
