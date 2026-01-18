import { describe, it, expect } from 'vitest'
import { renderWithPlugins } from '@/shared/tests/utils'
import { RouterLinkStub } from '@/shared/tests/mocks'
import QuickActionButtons from '../quick-action-buttons.vue'

function renderComponent(walletId: string = 'wallet-123') {
  return renderWithPlugins(QuickActionButtons, {
    props: { walletId },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

describe('QuickActionButtons', () => {
  const expectedButtons = [
    { type: 'income', label: /Income/, href: '?type=income' },
    { type: 'expense', label: /Expense/, href: '?type=expense' },
    { type: 'transfer', label: /Transfer/, href: '?type=transfer' },
    { type: 'exchange', label: /Exchange/, href: '?type=exchange' },
  ]

  it('renders all buttons with correct hrefs and transaction types', async () => {
    const screen = renderComponent('my-wallet-id')

    for (const { type, label, href } of expectedButtons) {
      const link = screen.getByRole('link', { name: label })
      await expect.element(link).toBeVisible()
      await expect
        .element(link)
        .toHaveAttribute('href', `/wallets/my-wallet-id/transactions/create${href}`)
      await expect.element(link).toHaveAttribute('data-transaction-type', type)
    }
  })

  it('renders icon for each button', async () => {
    const screen = renderComponent()

    for (const { label } of expectedButtons) {
      const link = screen.getByRole('link', { name: label })
      const svg = link.element().querySelector('svg')
      expect(svg).not.toBeNull()
    }
  })

  it('uses walletId prop in href', async () => {
    const screen = renderComponent('custom-wallet-id')

    const incomeLink = screen.getByRole('link', { name: /Income/ })
    await expect
      .element(incomeLink)
      .toHaveAttribute('href', '/wallets/custom-wallet-id/transactions/create?type=income')
  })
})
