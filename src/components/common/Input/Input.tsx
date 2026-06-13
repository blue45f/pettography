import type { InputHTMLAttributes, Ref } from 'react'

import { Field } from '@/components/ui/Field'
import { Input as KitInput } from '@/components/ui/Input'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  ref?: Ref<HTMLInputElement>
}

/**
 * Legacy common Input — now a thin wrapper over the `ui/` kit Field + Input so
 * every existing caller renders the canonical kit styling without changing its
 * API. The kit Field owns id wiring, label, error/description copy and the
 * `aria-invalid` / `aria-describedby` plumbing the legacy markup did by hand.
 * Legacy `helperText` maps onto the field description (hidden while an error
 * shows, matching the old behaviour).
 */
function Input({ label, error, helperText, className, id, ref, ...props }: InputProps) {
  return (
    <Field id={id} error={error} description={helperText}>
      {label ? <Field.Label>{label}</Field.Label> : null}
      <Field.Control>
        {(controlProps) => (
          <KitInput ref={ref} className={className} {...controlProps} {...props} />
        )}
      </Field.Control>
    </Field>
  )
}

export default Input
