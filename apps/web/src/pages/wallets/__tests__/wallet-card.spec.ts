import { describe, it, expect } from 'vitest'
import { renderWithPlugins } from '@/shared/tests/utils'
import { RouterLinkStub } from '@/shared/tests/mocks'
import WalletCard from '../components/wallet-card.vue'

interface WalletWithBalances {
  id: string
  name: string
  description: string | null
  balances: { id: string; balance: number; currency_code: string }[]
}

const mockWallet: WalletWithBalances = {
  id: 'wallet-123',
  name: 'My Savings',
  description: 'Personal savings account',
  balances: [
    { id: 'bal-1', balance: 1000, currency_code: 'USD' },
    { id: 'bal-2', balance: 500, currency_code: 'EUR' },
  ],
}

function renderCard(wallet: WalletWithBalances = mockWallet) {
  return renderWithPlugins(WalletCard, {
    props: { wallet },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

describe('WalletCard', () => {
  it('renders wallet info and links to detail page', async () => {
    const screen = renderCard()

    // Name and description
    await expect.element(screen.getByText('My Savings')).toBeVisible()
    await expect.element(screen.getByText('Personal savings account')).toBeVisible()

    // Link to wallet detail
    const link = screen.getByRole('link')
    await expect.element(link).toHaveAttribute('href', '/wallets/wallet-123')
  })

  it('does not render description when null', async () => {
    const walletWithoutDescription = { ...mockWallet, description: null }
    const screen = renderCard(walletWithoutDescription)

    await expect.element(screen.getByText('My Savings')).toBeVisible()
    await expect.element(screen.getByText('Personal savings account')).not.toBeInTheDocument()
  })

  it('renders balances via WalletBalanceDisplay', async () => {
    const screen = renderCard()

    await expect.element(screen.getByText('$1,000.00')).toBeVisible()
    await expect.element(screen.getByText('\u20AC500.00')).toBeVisible()
  })

  it('shows "No balances" when wallet has empty balances', async () => {
    const walletWithoutBalances = { ...mockWallet, balances: [] }
    const screen = renderCard(walletWithoutBalances)

    await expect.element(screen.getByText('No balances')).toBeVisible()
  })
})
