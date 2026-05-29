import { z } from 'zod'

/**
 * A keeper-saved emergency contact (vet, sitter, neighbour, supplier).
 * Persisted globally — preparedness is keeper-level, not per-pet.
 */
export const kitContactSchema = z.object({
  id: z.string(),
  label: z.string().max(40),
  phone: z.string().max(40),
  note: z.string().max(120),
})

export type KitContact = z.infer<typeof kitContactSchema>

/**
 * Persisted shape for the emergency-kit store. `checked` maps a checklist item
 * id (see `KIT_ITEMS`) to whether the keeper has it ready.
 */
export const kitStateSchema = z.object({
  checked: z.record(z.string(), z.boolean()),
  contacts: z.array(kitContactSchema),
})

export type KitState = z.infer<typeof kitStateSchema>

/**
 * Add-contact form. Fields are required (RHF supplies the defaults) so the
 * zodResolver stays friction-free. Error messages are i18n keys under
 * `kit.errors.*` resolved by the page.
 */
export const kitContactFormSchema = z.object({
  label: z.string().trim().min(1, 'kit.errors.labelRequired').max(40, 'kit.errors.labelMax'),
  phone: z.string().trim().min(1, 'kit.errors.phoneRequired').max(40, 'kit.errors.phoneMax'),
  note: z.string().trim().max(120, 'kit.errors.noteMax'),
})

export type KitContactFormValues = z.infer<typeof kitContactFormSchema>
