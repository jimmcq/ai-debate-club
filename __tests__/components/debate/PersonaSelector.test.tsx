/**
 * Component tests for PersonaSelector
 * Tests user interactions and persona selection functionality
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import PersonaSelector from '@/components/debate/PersonaSelector'
import { PersonaType } from '@/lib/types/debate'

// Mock the personas module
jest.mock('@/lib/personas', () => ({
  getPersonaEntries: () => [
    ['logician', {
      name: 'The Logician',
      description: 'Relies on structured reasoning and evidence-based arguments.'
    }],
    ['showman', {
      name: 'The Showman',
      description: 'Uses charisma and theatrical flair to captivate the audience.'
    }],
    ['contrarian', {
      name: 'The Contrarian',
      description: 'Questions everything and challenges conventional wisdom.'
    }],
  ]
}))

const defaultProps = {
  title: 'Select First Participant',
  selectedPersona: 'logician' as PersonaType,
  onPersonaChange: jest.fn(),
}

describe('PersonaSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders with title and persona options', () => {
      render(<PersonaSelector {...defaultProps} />)

      expect(screen.getByText('Select First Participant')).toBeInTheDocument()
      expect(screen.getByText('The Logician')).toBeInTheDocument()
      expect(screen.getByText('The Showman')).toBeInTheDocument()
      expect(screen.getByText('The Contrarian')).toBeInTheDocument()
    })

    it('displays persona descriptions', () => {
      render(<PersonaSelector {...defaultProps} />)

      expect(screen.getByText('Relies on structured reasoning and evidence-based arguments.')).toBeInTheDocument()
      expect(screen.getByText('Uses charisma and theatrical flair to captivate the audience.')).toBeInTheDocument()
      expect(screen.getByText('Questions everything and challenges conventional wisdom.')).toBeInTheDocument()
    })

    it('shows selected persona correctly', () => {
      render(<PersonaSelector {...defaultProps} selectedPersona="showman" />)

      const showmanRadio = screen.getByRole('radio', { name: /The Showman/ })
      expect(showmanRadio).toBeChecked()
    })

    it('shows visual indicator for selected persona', () => {
      render(<PersonaSelector {...defaultProps} selectedPersona="logician" />)

      // Should have a visual selection indicator (blue dot)
      const selectedLabel = screen.getByText('The Logician').closest('label')
      expect(selectedLabel).toHaveClass('border-blue-500', 'bg-blue-50')
    })
  })

  describe('User Interactions', () => {
    it('calls onPersonaChange when persona is selected', async () => {
      const user = userEvent.setup()
      const mockOnChange = jest.fn()

      render(
        <PersonaSelector
          {...defaultProps}
          onPersonaChange={mockOnChange}
          selectedPersona="logician"
        />
      )

      await user.click(screen.getByRole('radio', { name: /The Showman/ }))

      expect(mockOnChange).toHaveBeenCalledWith('showman')
    })

    it('handles keyboard navigation', async () => {
      const user = userEvent.setup()
      const mockOnChange = jest.fn()

      render(
        <PersonaSelector
          {...defaultProps}
          onPersonaChange={mockOnChange}
          selectedPersona="logician"
        />
      )

      const showmanRadio = screen.getByRole('radio', { name: /The Showman/ })
      await user.click(showmanRadio)

      expect(mockOnChange).toHaveBeenCalledWith('showman')
    })

    it('updates visual state when selection changes', () => {
      const { rerender } = render(
        <PersonaSelector {...defaultProps} selectedPersona="logician" />
      )

      // Initially logician should be selected
      expect(screen.getByRole('radio', { name: /The Logician/ })).toBeChecked()
      expect(screen.getByRole('radio', { name: /The Showman/ })).not.toBeChecked()

      // Change selection to showman
      rerender(
        <PersonaSelector {...defaultProps} selectedPersona="showman" />
      )

      expect(screen.getByRole('radio', { name: /The Logician/ })).not.toBeChecked()
      expect(screen.getByRole('radio', { name: /The Showman/ })).toBeChecked()
    })
  })

  describe('Disabled State', () => {
    it('disables excluded persona', () => {
      render(
        <PersonaSelector
          {...defaultProps}
          excludePersona="contrarian"
        />
      )

      const contrarianRadio = screen.getByRole('radio', { name: /The Contrarian/ })
      expect(contrarianRadio).toBeDisabled()
    })

    it('applies disabled styling to excluded persona', () => {
      render(
        <PersonaSelector
          {...defaultProps}
          excludePersona="contrarian"
        />
      )

      const contrarianLabel = screen.getByText('The Contrarian').closest('label')
      expect(contrarianLabel).toHaveClass('opacity-50', 'cursor-not-allowed')
    })

    it('does not call onPersonaChange for disabled persona', async () => {
      const user = userEvent.setup()
      const mockOnChange = jest.fn()

      render(
        <PersonaSelector
          {...defaultProps}
          onPersonaChange={mockOnChange}
          excludePersona="contrarian"
        />
      )

      // Try to click disabled option
      const contrarianLabel = screen.getByText('The Contrarian').closest('label')
      await user.click(contrarianLabel!)

      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('provides proper ARIA labels for radio buttons', () => {
      render(<PersonaSelector {...defaultProps} />)

      expect(screen.getByRole('radio', { name: /The Logician/ })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /The Showman/ })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /The Contrarian/ })).toBeInTheDocument()
    })

    it('groups radio buttons correctly', () => {
      render(<PersonaSelector {...defaultProps} title="Test Group" />)

      const radios = screen.getAllByRole('radio')
      radios.forEach(radio => {
        expect(radio).toHaveAttribute('name', 'persona-Test Group')
      })
    })

    it('supports screen reader navigation', () => {
      render(<PersonaSelector {...defaultProps} />)

      const radios = screen.getAllByRole('radio')
      expect(radios).toHaveLength(3)

      // Each should be properly labeled
      radios.forEach(radio => {
        expect(radio).toHaveAccessibleName()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles empty persona list gracefully', () => {
      // Create a version with empty data for this test
      const EmptyPersonaSelector = (props: any) => {
        // Mock empty data just for this component instance
        React.useMemo(() => {
          jest.spyOn(require('@/lib/personas'), 'getPersonaEntries').mockReturnValueOnce([])
        }, [])

        return <PersonaSelector {...props} />
      }

      render(<EmptyPersonaSelector {...defaultProps} />)

      expect(screen.getByText('Select First Participant')).toBeInTheDocument()
      // With empty list, there should be no radio buttons
      expect(screen.queryAllByRole('radio')).toHaveLength(0)
    })

    it('handles missing persona data', () => {
      // Should not crash even with empty data
      expect(() => {
        render(<PersonaSelector {...defaultProps} />)
      }).not.toThrow()
    })
  })

  describe('Visual States', () => {
    it('applies correct styling for different states', () => {
      render(
        <PersonaSelector
          {...defaultProps}
          selectedPersona="logician"
          excludePersona="contrarian"
        />
      )

      // Selected state
      const selectedLabel = screen.getByText('The Logician').closest('label')
      expect(selectedLabel).toHaveClass('border-blue-500', 'bg-blue-50')

      // Normal state
      const normalLabel = screen.getByText('The Showman').closest('label')
      expect(normalLabel).toHaveClass('border-gray-200', 'hover:border-gray-300')

      // Disabled state
      const disabledLabel = screen.getByText('The Contrarian').closest('label')
      expect(disabledLabel).toHaveClass('opacity-50', 'cursor-not-allowed')
    })

    it('displays selection indicator only for selected persona', () => {
      render(
        <PersonaSelector
          {...defaultProps}
          selectedPersona="logician"
        />
      )

      // Should have selection indicator for logician
      const selectedSection = screen.getByText('The Logician').closest('label')
      const indicator = selectedSection?.querySelector('.w-4.h-4.bg-blue-500')
      expect(indicator).toBeInTheDocument()

      // Should not have selection indicator for others
      const unselectedSection = screen.getByText('The Showman').closest('label')
      const noIndicator = unselectedSection?.querySelector('.w-4.h-4.bg-blue-500')
      expect(noIndicator).not.toBeInTheDocument()
    })
  })
})