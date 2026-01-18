import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { render } from 'vitest-browser-vue'
import CreateTransactionPage from '../create-transaction-page.vue'

// Capture props passed to TransactionForm
let capturedProps: { walletId?: string; initialType?: string } = {}

vi.mock('../transaction-form.vue', () => ({
  default: defineComponent({
    name: 'TransactionFormMock',
    props: ['walletId', 'initialType'],
    setup(props) {
      capturedProps = { walletId: props.walletId, initialType: props.initialType }
      return () => h('div', { 'data-testid': 'transaction-form-mock' }, `Mock Form`)
    },
  }),
}))

const mockRoute = {
  params: { id: 'wallet-123' },
  query: {} as Record<string, string | string[]>,
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}))

function renderPage() {
  capturedProps = {}
  return render(CreateTransactionPage)
}

describe('CreateTransactionPage', () => {
  beforeEach(() => {
    mockRoute.query = {}
    capturedProps = {}
  })

  describe('walletId prop', () => {
    it('passes walletId from route params', () => {
      mockRoute.params.id = 'my-wallet-456'
      renderPage()

      expect(capturedProps.walletId).toBe('my-wallet-456')
    })
  })

  describe('initialType prop from query params', () => {
    it.each([
      ['income', 'income'],
      ['expense', 'expense'],
      ['transfer', 'transfer'],
      ['exchange', 'exchange'],
    ])('passes "%s" when query param is "%s"', (queryValue, expectedType) => {
      mockRoute.query = { type: queryValue }
      renderPage()

      expect(capturedProps.initialType).toBe(expectedType)
    })

    it('passes undefined when no query param present', () => {
      mockRoute.query = {}
      renderPage()

      expect(capturedProps.initialType).toBeUndefined()
    })
  })

  describe('invalid query params', () => {
    it('passes undefined for invalid type value', () => {
      mockRoute.query = { type: 'invalid-type' }
      renderPage()

      expect(capturedProps.initialType).toBeUndefined()
    })

    it('passes undefined for uppercase type value', () => {
      mockRoute.query = { type: 'INCOME' }
      renderPage()

      expect(capturedProps.initialType).toBeUndefined()
    })

    it('passes undefined for empty type value', () => {
      mockRoute.query = { type: '' }
      renderPage()

      expect(capturedProps.initialType).toBeUndefined()
    })

    it('passes undefined for numeric type value', () => {
      mockRoute.query = { type: '123' }
      renderPage()

      expect(capturedProps.initialType).toBeUndefined()
    })
  })
})
