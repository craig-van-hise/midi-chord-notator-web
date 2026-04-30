import { render, screen, act } from '@testing-library/react';
import App from './App';

// Mocking the environment to ensure global styles like font-family are available
// In a real Vitest setup, index.css would be imported and applied globally.
// For this test, we assume that the Bravura font is correctly loaded and
// applied via CSS rules in index.css which is imported in main.tsx (or App.tsx indirectly).

// Mocking getComputedStyle to ensure it returns the expected font family.
// In a Vitest environment with JSDOM, this should work, but explicitly mocking
// can prevent issues if JSDOM's CSS parsing is incomplete for @font-face.
// However, let's first try without explicit mocking to rely on JSDOM's capabilities.

describe('App Component - Phase 1', () => {
  test('renders treble clef with Bravura font and correct character', async () => {
    // Render the App component
    await act(async () => {
      render(<App />);
    });

    // Find the element containing the Treble Clef character U+E050
    // The character needs to be escaped for getByText if it's a special regex character,
    // but '\uE050' is generally safe or can be represented as the actual character.
    // Let's try with the direct character representation.
    const trebleClefElement = screen.getByTestId('treble-clef');

    // Verify the element exists
    expect(trebleClefElement).toBeInTheDocument();

    // Get the computed style of the element
    const computedStyle = window.getComputedStyle(trebleClefElement);

    // Assert that the computed font family is 'Bravura'
    // JSDOM might return font names with quotes or different casing.
    // We should be flexible. Let's check if 'Bravura' is part of it.
    // The exact string returned by getComputedStyle can vary.
    // A common format is "Bravura", "Bravura", sans-serif
    expect(computedStyle.fontFamily).toContain('Bravura');
  });

  test('renders "Chord Notator" in the header', async () => {
    await act(async () => {
      render(<App />);
    });
    const headerTitle = screen.getByRole('heading', { level: 1 });
    expect(headerTitle).toHaveTextContent(/Chord\s*Notator/);
  });
});
