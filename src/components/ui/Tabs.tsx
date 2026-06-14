import * as TabsPrimitive from '@radix-ui/react-tabs'

import type { ComponentPropsWithRef } from 'react'

import { cn } from '@/utils/cn'

export type TabsProps = ComponentPropsWithRef<typeof TabsPrimitive.Root>
export type TabsListProps = ComponentPropsWithRef<typeof TabsPrimitive.List>
export type TabsTriggerProps = ComponentPropsWithRef<typeof TabsPrimitive.Trigger>
export type TabsContentProps = ComponentPropsWithRef<typeof TabsPrimitive.Content>

export function Tabs({ className, ...props }: TabsProps) {
  return <TabsPrimitive.Root className={cn('w-full', className)} {...props} />
}

function TabsList({ className, ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn(
        'flex gap-1 overflow-x-auto border-b-2 border-line [-webkit-overflow-scrolling:touch]',
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        '-mb-0.5 whitespace-nowrap border-b-2 border-transparent px-4 py-2 text-base font-medium ' +
          'text-ink-secondary transition-colors duration-150 ease-quint cursor-pointer ' +
          'hover:not-disabled:bg-panel hover:not-disabled:text-ink ' +
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ' +
          'focus-visible:ring-offset-2 focus-visible:ring-offset-app ' +
          'disabled:cursor-not-allowed disabled:opacity-50 ' +
          'data-[state=active]:border-brand data-[state=active]:text-brand',
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsContentProps) {
  return (
    <TabsPrimitive.Content
      className={cn(
        'py-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ' +
          'focus-visible:ring-offset-2 focus-visible:ring-offset-app',
        className
      )}
      {...props}
    />
  )
}

Tabs.List = TabsList
Tabs.Trigger = TabsTrigger
Tabs.Content = TabsContent
