import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { render } from 'vitest-browser-vue'
import { RouterLinkStub, createRouterMock } from '@/shared/tests/mocks'
import CreateWalletPage from '../create/page.vue'

let formEmitHandler: (() => void) | null = null

vi.mock('../components/wallet-form.vue', () => ({
  default: defineComponent({
    name: 'WalletFormMock',
    emits: ['success'],
    setup(_, { emit }) {
      formEmitHandler = () => emit('success')
      return () => h('div', { 'data-testid': 'wallet-form-mock' }, 'Wallet Form')
    },
  }),
}))

const mockRouter = createRouterMock()

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
}))

function renderPage() {
  formEmitHandler = null
  return render(CreateWalletPage, {
    global: {
      stubs: { RouterLink: RouterLinkStub },
    },
  })
}

describe('CreateWalletPage', () => {
  beforeEach(() => {
    mockRouter.push.mockClear()
  })

  it('renders page title and back button', async () => {
    const screen = renderPage()

    await expect.element(screen.getByRole('heading', { name: 'New Wallet' })).toBeVisible()

    const backLink = screen.getByRole('link', { name: 'Back to wallets' })
    await expect.element(backLink).toBeVisible()
    await expect.element(backLink).toHaveAttribute('href', '{"name":"wallets"}')
  })

  it('renders wallet form', async () => {
    const screen = renderPage()

    await expect.element(screen.getByTestId('wallet-form-mock')).toBeVisible()
  })

  it('navigates to wallets page on form success', async () => {
    renderPage()

    expect(formEmitHandler).not.toBeNull()
    formEmitHandler!()

    expect(mockRouter.push).toHaveBeenCalledWith({ name: 'wallets' })
  })
})
