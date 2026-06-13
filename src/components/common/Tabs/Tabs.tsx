import { type ReactNode } from 'react'

import { Tabs as KitTabs } from '@/components/ui/Tabs'
import { cn } from '@/utils/cn'

interface Tab {
  id: string
  label: string
  content: ReactNode
  disabled?: boolean
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  onChange?: (tabId: string) => void
  className?: string
}

/**
 * Legacy common Tabs — now a thin wrapper over the `ui/` kit Tabs (Radix) so
 * existing callers render the canonical kit styling without changing their
 * data-driven API. The kit owns the tablist/trigger/panel roles, roving
 * tabindex and Arrow/Home/End keyboard navigation the legacy implemented by
 * hand. Tab `id`s map to Radix `value`s; `defaultTab` seeds `defaultValue`;
 * `onChange(tabId)` is fed by `onValueChange`.
 */
function Tabs({ tabs, defaultTab, onChange, className = '' }: TabsProps) {
  const initial = defaultTab || tabs[0]?.id || ''

  return (
    <KitTabs defaultValue={initial} onValueChange={onChange} className={cn(className)}>
      <KitTabs.List aria-orientation="horizontal">
        {tabs.map((tab) => (
          <KitTabs.Trigger key={tab.id} value={tab.id} disabled={tab.disabled}>
            {tab.label}
          </KitTabs.Trigger>
        ))}
      </KitTabs.List>
      {tabs.map((tab) => (
        <KitTabs.Content key={tab.id} value={tab.id}>
          {tab.content}
        </KitTabs.Content>
      ))}
    </KitTabs>
  )
}

export default Tabs
