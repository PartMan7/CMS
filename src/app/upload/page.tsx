import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Nav } from '@/components/nav';
import { UploadForm } from '@/components/upload-form';
import { canUpload, isAdmin } from '@/lib/permissions';

export default async function UploadPage() {
	const session = await auth();
	if (!session?.user) redirect('/login');
	if (!canUpload(session.user.role)) redirect('/dashboard');

	return (
		<div className="min-h-screen">
			<Nav role={session.user.role} username={session.user.name ?? 'Unknown'} />
			<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<h1 className="text-3xl font-bold mb-6">Upload Content</h1>
				<UploadForm isAdmin={isAdmin(session.user.role)} />
			</div>
		</div>
	);
}
