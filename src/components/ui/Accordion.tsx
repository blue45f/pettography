import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronRight } from 'lucide-react'

import type { ComponentPropsWithRef, ReactElement } from 'react'

import { cn } from '@/utils/cn'

export type AccordionProps = ComponentPropsWithRef<typeof AccordionPrimitive.Root>
export type AccordionItemProps = ComponentPropsWithRef<typeof AccordionPrimitive.Item>
export type AccordionContentProps = ComponentPropsWithRef<typeof AccordionPrimitive.Content>

export type AccordionHeadingLevel = 2 | 3 | 4 | 5 | 6

export interface AccordionTriggerProps extends ComponentPropsWithRef<
  typeof AccordionPrimitive.Trigger
> {
  /** Heading level for the Radix `Header` host wrapping the trigger (default 3). */
  headingLevel?: AccordionHeadingLevel
}

export function Accordion({ className, ...props }: AccordionProps) {
  // Radix `Root` is a discriminated union on `type` ('single' | 'multiple');
  // forward verbatim so callers pick the variant and its matching value props.
  return (
    <AccordionPrimitive.Root
      className={cn('overflow-hidden rounded-md border border-line', className)}
      {...(props as AccordionProps)}
    />
  )
}

function AccordionItem({ className, ...props }: AccordionItemProps) {
  return (
    <AccordionPrimitive.Item
      className={cn('border-b border-line last:border-b-0', className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  headingLevel = 3,
  children,
  ...props
}: AccordionTriggerProps) {
  return (
    <AccordionPrimitive.Header asChild>
      {wrapHeading(
        headingLevel,
        <AccordionPrimitive.Trigger
          className={cn(
            'group flex w-full cursor-pointer appearance-none items-center justify-between gap-2 ' +
              'bg-panel px-5 py-4 text-left text-base font-medium text-ink ' +
              'transition-colors duration-150 ease-quint ' +
              'hover:not-disabled:bg-panel-muted data-[state=open]:bg-panel-muted ' +
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ' +
              'focus-visible:ring-offset-2 focus-visible:ring-offset-app ' +
              'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          {...props}
        >
          <span>{children}</span>
          <ChevronRight
            aria-hidden="true"
            className="size-5 shrink-0 text-ink-secondary transition-transform duration-150 ease-quint group-data-[state=open]:rotate-90"
          />
        </AccordionPrimitive.Trigger>,
      )}
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({ className, children, ...props }: AccordionContentProps) {
  return (
    <AccordionPrimitive.Content
      className={cn('overflow-hidden text-sm leading-relaxed text-ink-secondary', className)}
      {...props}
    >
      <div className="px-5 py-4">{children}</div>
    </AccordionPrimitive.Content>
  )
}

/** Wrap the trigger in a heading element of the requested level (Radix `Header` host). */
function wrapHeading(level: AccordionHeadingLevel, child: ReactElement) {
  const Tag = `h${level}` as const
  return <Tag className="m-0">{child}</Tag>
}

Accordion.Item = AccordionItem
Accordion.Trigger = AccordionTrigger
Accordion.Content = AccordionContent
