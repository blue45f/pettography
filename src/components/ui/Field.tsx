import { createContext, useContext, useId } from 'react'

import type { LabelProps } from '@/components/ui/Label'
import type { HTMLAttributes, ReactNode } from 'react'

import { Label } from '@/components/ui/Label'
import { cn } from '@/utils/cn'

interface FieldContextValue {
  controlId: string
  descriptionId: string
  errorId: string
  hasError: boolean
  hasDescription: boolean
}

const FieldContext = createContext<FieldContextValue | null>(null)

function useFieldContext(component: string): FieldContextValue {
  const ctx = useContext(FieldContext)
  if (!ctx) {
    throw new Error(`<${component}> must be used within <Field>.`)
  }
  return ctx
}

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'id'> {
  /** Base id; control / description / error ids derive from it. Auto-generated otherwise. */
  id?: string
  error?: ReactNode
  description?: ReactNode
}

/**
 * Accessible form-field wrapper. Provides ids to its `Field.Label` /
 * `Field.Control` / `Field.Description` / `Field.Error` children and wires
 * `htmlFor`, `aria-describedby`, and `aria-invalid` automatically.
 */
export function Field({ id, error, description, className, children, ...props }: FieldProps) {
  const generatedId = useId()
  const controlId = id ?? generatedId
  const value: FieldContextValue = {
    controlId,
    descriptionId: `${controlId}-description`,
    errorId: `${controlId}-error`,
    hasError: Boolean(error),
    hasDescription: Boolean(description),
  }

  return (
    <FieldContext.Provider value={value}>
      <div className={cn('flex flex-col gap-1.5', className)} {...props}>
        {children}
        {description && !error ? <FieldDescription>{description}</FieldDescription> : null}
        {error ? <FieldError>{error}</FieldError> : null}
      </div>
    </FieldContext.Provider>
  )
}

export type FieldLabelProps = Omit<LabelProps, 'htmlFor'>

function FieldLabel(props: FieldLabelProps) {
  const { controlId } = useFieldContext('Field.Label')
  return <Label htmlFor={controlId} {...props} />
}

export interface FieldControlProps {
  /**
   * Render-prop that receives the wired control props
   * (`id`, `aria-describedby`, `aria-invalid`). Spread them onto your control.
   */
  children: (controlProps: {
    id: string
    'aria-describedby': string | undefined
    'aria-invalid': boolean | undefined
  }) => ReactNode
}

function FieldControl({ children }: FieldControlProps) {
  const { controlId, descriptionId, errorId, hasError, hasDescription } =
    useFieldContext('Field.Control')
  const describedBy =
    [hasError ? errorId : null, hasDescription && !hasError ? descriptionId : null]
      .filter(Boolean)
      .join(' ') || undefined

  return children({
    id: controlId,
    'aria-describedby': describedBy,
    'aria-invalid': hasError || undefined,
  })
}

function FieldDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  const { descriptionId } = useFieldContext('Field.Description')
  return (
    <p
      id={descriptionId}
      className={cn('text-sm leading-tight text-ink-muted', className)}
      {...props}
    />
  )
}

function FieldError({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  const { errorId } = useFieldContext('Field.Error')
  return (
    <p
      id={errorId}
      role="alert"
      className={cn('text-sm font-medium leading-tight text-state-error', className)}
      {...props}
    />
  )
}

Field.Label = FieldLabel
Field.Control = FieldControl
Field.Description = FieldDescription
Field.Error = FieldError
