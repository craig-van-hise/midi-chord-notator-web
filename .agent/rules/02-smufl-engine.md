---
trigger: always_on

# SMuFL Bravura Font Protocols and Notation Mathematics

## Unicode Constants

You must utilize the following SMuFL standard hex codes exclusively for rendering text nodes:

* Treble Clef (G-Clef): U+E050
* Bass Clef (F-Clef): U+E061
* Brace: U+E000
* Bracket: U+E002
* Single Barline: U+E030
* Standard Notehead (Black): U+E0A4
* Standard Notehead (Whole): U+E0A2
* Sharp: U+E262
* Flat: U+E260
* Natural: U+E261

## Layout Mathematics

* The baseline unit for all notation CSS positioning is the CSS custom property var(--staff-space).
* The Grand Staff consists of two independent 5-line staves.
* The vertical distance separating the bottom line of the Treble staff and the top line of the Bass staff must be mathematically defined as exactly 10 spaces.
* Middle C (MIDI 60) resides mathematically at the exact vertical midpoint between the two staves. All pitch Y-coordinate calculations must originate from this anchor point.
