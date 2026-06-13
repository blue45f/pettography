import type { Ref, TextareaHTMLAttributes } from 'react'

import { inputBaseClass } from '@/components/ui/Input'
import { cn } from '@/utils/cn'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  ref?: Ref<HTMLTextAreaElement>
}

export function Textarea({ className, rows = 4, ref, ...props }: TextareaProps) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      // Override the fixed input height: textarea grows with rows / resize.
      className={cn(inputBaseClass, 'h-auto min-h-[5rem] resize-y', className)}
      {...props}
    />
  )
}
