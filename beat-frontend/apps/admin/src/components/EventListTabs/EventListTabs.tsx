import type { AdminEventsTab } from '@beat/types'

import { ADMIN_EVENTS_COPY } from '@/constants/events.constants'

export interface EventListTabsProps {
  activeTab: AdminEventsTab
  onTabChange: (tab: AdminEventsTab) => void
}

const TABS: { id: AdminEventsTab; label: string }[] = [
  { id: 'pending', label: ADMIN_EVENTS_COPY.TAB_PENDING },
  { id: 'accepted', label: ADMIN_EVENTS_COPY.TAB_ACCEPTED },
  { id: 'rejected', label: ADMIN_EVENTS_COPY.TAB_REJECTED },
]

export function EventListTabs({ activeTab, onTabChange }: EventListTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ADMIN_EVENTS_COPY.TABS_ARIA_LABEL}
      className="mb-4 flex flex-wrap gap-2 border-b border-border pb-3"
    >
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
