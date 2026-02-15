'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface User {
	id: string;
	username: string;
	role: string;
	createdAt: string;
	_count: { content: number };
}

interface UserManagerProps {
	currentUserId: string;
}

export function UserManager({ currentUserId }: UserManagerProps) {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [showCreate, setShowCreate] = useState(false);
	const [editUser, setEditUser] = useState<User | null>(null);

	const fetchUsers = useCallback(async () => {
		try {
			const res = await fetch('/api/admin/users');
			const data = await res.json();
			setUsers(data.users || []);
		} catch {
			toast.error('Failed to load users');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	async function handleDelete(user: User) {
		if (!confirm(`Delete user "${user.username}"? This will also delete their content.`)) return;

		try {
			const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
			if (res.ok) {
				toast.success(`User "${user.username}" deleted`);
				fetchUsers();
			} else {
				const data = await res.json();
				toast.error(data.error || 'Failed to delete user');
			}
		} catch {
			toast.error('Failed to delete user');
		}
	}

	if (loading) return <p className="text-muted-foreground">Loading users...</p>;

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<p className="text-muted-foreground">{users.length} user(s)</p>
				<Dialog open={showCreate} onOpenChange={setShowCreate}>
					<DialogTrigger asChild>
						<Button>Add User</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create New User</DialogTitle>
							<DialogDescription>Add a new user to the system. Users cannot register themselves.</DialogDescription>
						</DialogHeader>
						<CreateUserForm
							onSuccess={() => {
								setShowCreate(false);
								fetchUsers();
							}}
						/>
					</DialogContent>
				</Dialog>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Username</TableHead>
						<TableHead>Role</TableHead>
						<TableHead>Content</TableHead>
						<TableHead>Created</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{users.map(user => (
						<TableRow key={user.id}>
							<TableCell className="font-medium">{user.username}</TableCell>
							<TableCell>
								<Badge variant={user.role === 'admin' ? 'default' : 'outline'}>{user.role}</Badge>
							</TableCell>
							<TableCell>{user._count.content}</TableCell>
							<TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
							<TableCell className="text-right space-x-2">
								<Dialog open={editUser?.id === user.id} onOpenChange={open => !open && setEditUser(null)}>
									<DialogTrigger asChild>
										<Button variant="outline" size="sm" onClick={() => setEditUser(user)}>
											Edit
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Edit User: {user.username}</DialogTitle>
											<DialogDescription>Update user details.</DialogDescription>
										</DialogHeader>
										<EditUserForm
											user={user}
											onSuccess={() => {
												setEditUser(null);
												fetchUsers();
											}}
										/>
									</DialogContent>
								</Dialog>
								{user.id !== currentUserId && (
									<Button variant="destructive" size="sm" onClick={() => handleDelete(user)}>
										Delete
									</Button>
								)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

function CreateUserForm({ onSuccess }: { onSuccess: () => void }) {
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [role, setRole] = useState('guest');

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError('');
		setLoading(true);

		const formData = new FormData(e.currentTarget);

		try {
			const res = await fetch('/api/admin/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username: formData.get('username'),
					password: formData.get('password'),
					role,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || 'Failed to create user');
			} else {
				toast.success(`User "${data.user.username}" created`);
				onSuccess();
			}
		} catch {
			setError('An error occurred');
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			<div className="space-y-2">
				<Label htmlFor="new-username">Username</Label>
				<Input id="new-username" name="username" required minLength={3} maxLength={50} />
			</div>
			<div className="space-y-2">
				<Label htmlFor="new-password">Password</Label>
				<Input id="new-password" name="password" type="password" required minLength={8} />
			</div>
			<div className="space-y-2">
				<Label>Role</Label>
				<Select value={role} onValueChange={setRole}>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="guest">Guest</SelectItem>
						<SelectItem value="uploader">Uploader</SelectItem>
						<SelectItem value="admin">Admin</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<Button type="submit" className="w-full" disabled={loading}>
				{loading ? 'Creating...' : 'Create User'}
			</Button>
		</form>
	);
}

function EditUserForm({ user, onSuccess }: { user: User; onSuccess: () => void }) {
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [role, setRole] = useState(user.role);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError('');
		setLoading(true);

		const formData = new FormData(e.currentTarget);
		const password = formData.get('password') as string;
		const username = formData.get('username') as string;

		const body: Record<string, string> = { role };
		if (username && username !== user.username) body.username = username;
		if (password) body.password = password;

		try {
			const res = await fetch(`/api/admin/users/${user.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || 'Failed to update user');
			} else {
				toast.success('User updated');
				onSuccess();
			}
		} catch {
			setError('An error occurred');
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			<div className="space-y-2">
				<Label htmlFor="edit-username">Username</Label>
				<Input id="edit-username" name="username" defaultValue={user.username} minLength={3} maxLength={50} />
			</div>
			<div className="space-y-2">
				<Label htmlFor="edit-password">New Password (leave blank to keep)</Label>
				<Input id="edit-password" name="password" type="password" minLength={8} />
			</div>
			<div className="space-y-2">
				<Label>Role</Label>
				<Select value={role} onValueChange={setRole}>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="guest">Guest</SelectItem>
						<SelectItem value="uploader">Uploader</SelectItem>
						<SelectItem value="admin">Admin</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<Button type="submit" className="w-full" disabled={loading}>
				{loading ? 'Saving...' : 'Save Changes'}
			</Button>
		</form>
	);
}
