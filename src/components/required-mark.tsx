/**
 * Red asterisk for required form fields.
 * Purely visual — hidden from screen readers. The actual required-ness
 * must be conveyed via `aria-required="true"` on the corresponding input.
 */
export function RequiredMark() {
	return (
		<span aria-hidden="true" className="text-destructive -ml-1.5 select-none">
			*
		</span>
	);
}
