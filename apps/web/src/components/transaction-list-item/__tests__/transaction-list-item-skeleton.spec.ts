import { describe, it, expect } from 'vitest'
import { renderWithPlugins } from '@/shared/tests/utils'
import TransactionListItemSkeleton from '../transaction-list-item-skeleton.vue'

describe('TransactionListItemSkeleton', () => {
  it('renders as li element with aria-hidden', async () => {
    const screen = renderWithPlugins(TransactionListItemSkeleton)

    // aria-hidden="true" hides from accessibility tree, so use container query
    const listitem = screen.container.querySelector('li')
    expect(listitem).not.toBeNull()
    expect(listitem?.getAttribute('aria-hidden')).toBe('true')
  })

  it('renders skeleton elements for icon, content, and amount', async () => {
    const screen = renderWithPlugins(TransactionListItemSkeleton)

    const skeletons = screen.container.querySelectorAll('[data-slot="skeleton"]')
    // Icon (1) + Title (1) + Date (1) + Amount (1) + Balance (1) = 5 skeletons
    expect(skeletons.length).toBe(5)
  })

  it('renders circular skeleton for icon', async () => {
    const screen = renderWithPlugins(TransactionListItemSkeleton)

    const skeletons = screen.container.querySelectorAll('[data-slot="skeleton"]')
    const iconSkeleton = skeletons[0]
    expect(iconSkeleton.classList.contains('rounded-full')).toBe(true)
  })
})
