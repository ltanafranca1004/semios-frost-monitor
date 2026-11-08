import { render, screen } from '@testing-library/react'
import App from './App'

// Smoke test: proves Vitest, jsdom and React Testing Library are wired up
it('renders the page heading', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Frost Monitor' })).toBeInTheDocument()
})
