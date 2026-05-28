import { useState, useCallback, type ChangeEvent, type FormEvent } from 'react'

type ValidationRule<T> = {
  validate: (value: T[keyof T], values: T) => boolean
  message: string
}

type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T>[]
}

type FormErrors<T> = Partial<Record<keyof T, string>>

interface UseFormOptions<T extends Record<string, unknown>> {
  initialValues: T
  rules?: ValidationRules<T>
  onSubmit: (values: T) => void | Promise<void>
}

interface UseFormReturn<T extends Record<string, unknown>> {
  values: T
  errors: FormErrors<T>
  touched: Partial<Record<keyof T, boolean>>
  isSubmitting: boolean
  isValid: boolean
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  handleBlur: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void
  setFieldValue: (field: keyof T, value: T[keyof T]) => void
  setFieldError: (field: keyof T, error: string) => void
  reset: () => void
}

function useForm<T extends Record<string, unknown>>({
  initialValues,
  rules = {} as ValidationRules<T>,
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<FormErrors<T>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateField = useCallback(
    (field: keyof T, value: T[keyof T], allValues: T): string | undefined => {
      const fieldRules = rules[field]
      if (!fieldRules) return undefined

      for (const rule of fieldRules) {
        if (!rule.validate(value, allValues)) {
          return rule.message
        }
      }
      return undefined
    },
    [rules],
  )

  const validateAll = useCallback(
    (vals: T): FormErrors<T> => {
      const newErrors: FormErrors<T> = {}
      for (const field of Object.keys(vals) as Array<keyof T>) {
        const error = validateField(field, vals[field], vals)
        if (error) {
          newErrors[field] = error
        }
      }
      return newErrors
    },
    [validateField],
  )

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target
      const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value

      setValues((prev) => {
        const next = { ...prev, [name]: fieldValue } as T
        if (touched[name as keyof T]) {
          const error = validateField(name as keyof T, fieldValue as T[keyof T], next)
          setErrors((prevErrors) => {
            if (error) return { ...prevErrors, [name]: error }
            const { [name as keyof T]: _, ...rest } = prevErrors
            void _
            return rest as FormErrors<T>
          })
        }
        return next
      })
    },
    [touched, validateField],
  )

  const handleBlur = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name } = e.target
      setTouched((prev) => ({ ...prev, [name]: true }))

      const error = validateField(name as keyof T, values[name as keyof T], values)
      setErrors((prev) => {
        if (error) return { ...prev, [name]: error }
        const { [name as keyof T]: _, ...rest } = prev
        void _
        return rest as FormErrors<T>
      })
    },
    [values, validateField],
  )

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Record<keyof T, boolean>,
      )
      setTouched(allTouched)

      const validationErrors = validateAll(values)
      setErrors(validationErrors)

      if (Object.keys(validationErrors).length > 0) return

      setIsSubmitting(true)
      try {
        await onSubmit(values)
      } finally {
        setIsSubmitting(false)
      }
    },
    [values, validateAll, onSubmit],
  )

  const setFieldValue = useCallback((field: keyof T, value: T[keyof T]) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }, [])

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }))
  }, [])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  const isValid = Object.keys(errors).length === 0

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    reset,
  }
}

export default useForm
