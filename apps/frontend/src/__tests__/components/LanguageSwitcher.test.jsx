import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LanguageSwitcher from '../../components/LanguageSwitcher'

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: vi.fn(),
      language: 'en'
    }
  })
}))

describe('LanguageSwitcher', () => {
  it('renders language switcher button', () => {
    render(<LanguageSwitcher />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('displays current language', () => {
    render(<LanguageSwitcher />)
    expect(screen.getByText(/EN/i)).toBeInTheDocument()
  })

  it('opens dropdown when clicked', () => {
    render(<LanguageSwitcher />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    // Check if dropdown is visible
    expect(screen.getByText(/English/i)).toBeInTheDocument()
  })
})

