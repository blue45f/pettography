import type { Ref, TextareaHTMLAttributes } from 'react'

import { Field } from '@/components/ui/Field'
import { Textarea as KitTextarea } from '@/components/ui/Textarea'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  ref?: Ref<HTMLTextAreaElement>
}

/**
 * Legacy common Textarea — now a thin wrapper over the `ui/` kit Field +
 * Textarea so every existing caller renders the canonical kit styling without
 * changing its API. The kit Field owns id wiring, label, error/description copy
 * and the `aria-invalid` / `aria-describedby` plumbing the legacy markup did by
 * hand. Legacy `helperText` maps onto the field description (hidden while an
 * error shows, matching the old behaviour).
 */
function Textarea({ label, error, helperText, className, id, ref, ...props }: TextareaProps) {
  return (
    <Field id={id} error={error} description={helperText}>
      {label ? <Field.Label>{label}</Field.Label> : null}
      <Field.Control>
        {(controlProps) => (
          <KitTextarea ref={ref} className={className} {...controlProps} {...props} />
        )}
      </Field.Control>
    </Field>
  )
}

export default Textarea
