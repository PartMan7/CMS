import { Suspense } from 'react';
import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
	return (
		<main id="main-content">
			<Suspense
				fallback={
					<div className="min-h-screen flex items-center justify-center p-4">
						<p className="text-muted-foreground">Loading...</p>
					</div>
				}
			>
				<LoginForm />
			</Suspense>
		</main>
	);
}
