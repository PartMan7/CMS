import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
				'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
				'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
				/* file input styling */
				'file:border-0 file:bg-primary file:text-primary-foreground file:rounded-md file:px-3 file:text-sm file:font-medium file:cursor-pointer file:hover:bg-primary/90 file:transition-colors file:mr-3 file:-ml-3',
				type === 'file' && 'h-auto py-1.5 text-sm text-muted-foreground cursor-pointer',
				className
			)}
			{...props}
		/>
	);
}

export { Input };
