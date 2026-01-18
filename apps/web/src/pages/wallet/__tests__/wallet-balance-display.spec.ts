import { describe, it, expect } from 'vitest'
import { userEvent } from 'vitest/browser'
import { renderWithPlugins } from '@/shared/tests/utils'
import WalletBalanceDisplay from '../wallet-balance-display.vue'

interface Balance {
  id: string
  balance: number
  currency_code: string
}

function createBalance(overrides: Partial<Balance> = {}): Balance {
  return {
    id: 'balance-1',
    balance: 1000,
    currency_code: 'USD',
    ...overrides,
  }
}

const FIVE_BALANCES = [
  createBalance({ id: '1', balance: 100, currency_code: 'USD' }),
  createBalance({ id: '2', balance: 200, currency_code: 'EUR' }),
  createBalance({ id: '3', balance: 300, currency_code: 'GBP' }),
  createBalance({ id: '4', balance: 400, currency_code: 'JPY' }),
  createBalance({ id: '5', balance: 500, currency_code: 'CHF' }),
]

const THREE_BALANCES = FIVE_BALANCES.slice(0, 3)

function getBalanceElements(container: Element): HTMLElement[] {
  return Array.from(container.querySelectorAll('span'))
}

describe('WalletBalanceDisplay', () => {
  it('renders balances with currency formatting', async () => {
    const balances = [createBalance({ balance: 1234.56, currency_code: 'EUR' })]
    const screen = renderWithPlugins(WalletBalanceDisplay, {
      props: { balances },
    })

    await expect.element(screen.getByText('\u20AC1,234.56')).toBeVisible()
  })

  it('renders empty container when no balances', async () => {
    const screen = renderWithPlugins(WalletBalanceDisplay, {
      props: { balances: [] },
    })

    expect(screen.getByRole('button').query()).toBeNull()
    expect(getBalanceElements(screen.container)).toHaveLength(0)
  })

  it('renders zero balance correctly', async () => {
    const balances = [createBalance({ balance: 0 })]
    const screen = renderWithPlugins(WalletBalanceDisplay, {
      props: { balances },
    })

    await expect.element(screen.getByText('$0.00')).toBeVisible()
  })

  it('sorts by absolute amount descending', async () => {
    const balances = [
      createBalance({ id: '1', balance: 100, currency_code: 'USD' }),
      createBalance({ id: '2', balance: -500, currency_code: 'EUR' }),
      createBalance({ id: '3', balance: 300, currency_code: 'GBP' }),
    ]
    const screen = renderWithPlugins(WalletBalanceDisplay, {
      props: { balances },
    })

    const spans = getBalanceElements(screen.container)

    // EUR (-500) first, then GBP (300), then USD (100)
    expect(spans[0].textContent).toContain('500')
    expect(spans[1].textContent).toContain('300')
    expect(spans[2].textContent).toContain('100')
  })

  it('shows top N balances by default and displays "+N more" button', async () => {
    const screen = renderWithPlugins(WalletBalanceDisplay, {
      props: { balances: FIVE_BALANCES },
    })

    const spans = getBalanceElements(screen.container)
    expect(spans).toHaveLength(3)

    // Top 3 by absolute value: CHF 500, JPY 400, GBP 300
    expect(spans[0].textContent).toContain('500')
    expect(spans[1].textContent).toContain('400')
    expect(spans[2].textContent).toContain('300')

    await expect.element(screen.getByRole('button', { name: /\+2 more/i })).toBeVisible()
  })

  it('expands to show all balances and collapses back', async () => {
    const screen = renderWithPlugins(WalletBalanceDisplay, {
      props: { balances: FIVE_BALANCES },
    })

    // Expand
    await userEvent.click(screen.getByRole('button', { name: /\+2 more/i }))

    expect(getBalanceElements(screen.container)).toHaveLength(5)
    await expect.element(screen.getByRole('button', { name: /show less/i })).toBeVisible()

    // Collapse
    await userEvent.click(screen.getByRole('button', { name: /show less/i }))

    expect(getBalanceElements(screen.container)).toHaveLength(3)
    await expect.element(screen.getByRole('button', { name: /\+2 more/i })).toBeVisible()
  })

  it('hides button when balances count equals maxVisible', async () => {
    const screen = renderWithPlugins(WalletBalanceDisplay, {
      props: { balances: THREE_BALANCES },
    })

    expect(getBalanceElements(screen.container)).toHaveLength(3)
    expect(screen.getByRole('button').query()).toBeNull()
  })

  it('handles negative amounts in display', async () => {
    const balances = [createBalance({ balance: -500.25 })]
    const screen = renderWithPlugins(WalletBalanceDisplay, {
      props: { balances },
    })

    await expect.element(screen.getByText('-$500.25')).toBeVisible()
  })

  it('respects custom maxVisible prop', async () => {
    const screen = renderWithPlugins(WalletBalanceDisplay, {
      props: { balances: FIVE_BALANCES, maxVisible: 2 },
    })

    expect(getBalanceElements(screen.container)).toHaveLength(2)
    await expect.element(screen.getByRole('button', { name: /\+3 more/i })).toBeVisible()
  })

  it('shows single balance with maxVisible=1', async () => {
    const screen = renderWithPlugins(WalletBalanceDisplay, {
      props: { balances: THREE_BALANCES, maxVisible: 1 },
    })

    const spans = getBalanceElements(screen.container)
    expect(spans).toHaveLength(1)
    // Highest absolute value is GBP 300
    expect(spans[0].textContent).toContain('300')
    await expect.element(screen.getByRole('button', { name: /\+2 more/i })).toBeVisible()
  })
})
