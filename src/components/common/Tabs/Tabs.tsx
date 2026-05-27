import { useState, useId, type ReactNode } from 'react'

import styles from './Tabs.module.css'

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

function Tabs({ tabs, defaultTab, onChange, className = '' }: TabsProps) {
  const baseId = useId()
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '')

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    onChange?.(tabId)
  }

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const enabledTabs = tabs.filter((t) => !t.disabled)
    const currentIndex = enabledTabs.findIndex((t) => t.id === tabs[index].id)

    let newIndex: number | undefined
    if (e.key === 'ArrowRight') {
      newIndex = (currentIndex + 1) % enabledTabs.length
    } else if (e.key === 'ArrowLeft') {
      newIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length
    } else if (e.key === 'Home') {
      newIndex = 0
    } else if (e.key === 'End') {
      newIndex = enabledTabs.length - 1
    }

    if (newIndex !== undefined) {
      e.preventDefault()
      const newTab = enabledTabs[newIndex]
      handleTabClick(newTab.id)
      document.getElementById(`${baseId}-tab-${newTab.id}`)?.focus()
    }
  }

  const activeContent = tabs.find((t) => t.id === activeTab)

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.tabList} role="tablist" aria-orientation="horizontal">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`${baseId}-tab-${tab.id}`}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            role="tab"
            type="button"
            aria-selected={activeTab === tab.id}
            aria-controls={`${baseId}-panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => handleTabClick(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeContent && (
        <div
          id={`${baseId}-panel-${activeContent.id}`}
          className={styles.panel}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${activeContent.id}`}
          tabIndex={0}
        >
          {activeContent.content}
        </div>
      )}
    </div>
  )
}

export default Tabs
