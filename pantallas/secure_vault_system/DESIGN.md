---
name: Secure Vault System
colors:
  surface: '#12131b'
  surface-dim: '#12131b'
  surface-bright: '#383942'
  surface-container-lowest: '#0c0e16'
  surface-container-low: '#1a1b23'
  surface-container: '#1e1f28'
  surface-container-high: '#282932'
  surface-container-highest: '#33343d'
  on-surface: '#e2e1ed'
  on-surface-variant: '#c4c5d7'
  inverse-surface: '#e2e1ed'
  inverse-on-surface: '#2f3039'
  outline: '#8e8fa1'
  outline-variant: '#444655'
  surface-tint: '#bac3ff'
  primary: '#bac3ff'
  on-primary: '#00218d'
  primary-container: '#4361ee'
  on-primary-container: '#f4f2ff'
  inverse-primary: '#2e4edc'
  secondary: '#b7c8e1'
  on-secondary: '#213145'
  secondary-container: '#3a4a5f'
  on-secondary-container: '#a9bad3'
  tertiary: '#ffb692'
  on-tertiary: '#562000'
  tertiary-container: '#ba4e00'
  on-tertiary-container: '#fff1eb'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dee1ff'
  primary-fixed-dim: '#bac3ff'
  on-primary-fixed: '#001159'
  on-primary-fixed-variant: '#0031c4'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb692'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#793000'
  background: '#12131b'
  on-background: '#e2e1ed'
  surface-variant: '#33343d'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 57px
    fontWeight: '400'
    lineHeight: 64px
    letterSpacing: -0.25px
  headline-sm:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: 0px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: 0.15px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.5px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.25px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.5px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 24px
  margin: 32px
---

## Brand & Style

This design system is engineered for a high-stakes security environment, prioritizing the user's peace of mind through a "Professional, Secure, and High-Tech" aesthetic. It follows the structural logic of Google Material 3 (M3) while refining it for a sophisticated enterprise "Personal Password Vault" experience.

The visual language balances **Minimalism** with **Corporate Reliability**. It avoids unnecessary decorative elements to focus on clarity and speed of use. The emotional response is one of absolute control: every transition is intentional, every hierarchy is clear, and the interface feels like a precision tool designed for safeguarding sensitive data.

## Colors

The palette is anchored in a **Refined Dark Mode** that utilizes deep slate and charcoal tones rather than pure black to reduce eye strain and maintain a premium feel.

- **Primary:** Electric Indigo (#4361EE) serves as the primary action color, providing a high-tech pulse to the interface.
- **Surface Palette:** The background utilizes a deep Navy-Slate (#0F172A), while containers and cards use a lighter Slate (#1E293B) to create tonal depth.
- **Semantic Accents:** Status colors are vibrant and unambiguous. Emerald Green signifies security, Amber suggests caution, and Crimson indicates immediate vulnerability.
- **Neutral/Typography:** Text follows a hierarchy of High, Medium, and Disabled emphasis using varying shades of Slate and White.

## Typography

This design system utilizes **Inter** for all levels of the hierarchy. Its neutral, systematic nature ensures maximum legibility in data-heavy environments.

Headlines should be used sparingly, primarily for view-level navigation. Titles are reserved for card headers and list items. For password visibility, a monospaced font-stack (e.g., JetBrains Mono or Roboto Mono) should be used specifically for the password strings themselves to distinguish ambiguous characters (like '1' and 'l'). Use `body-md` for standard data entry and `label-sm` for metadata and micro-copy.

## Layout & Spacing

The layout follows a **Fluid Grid** system based on a 12-column structure for desktop and a 4-column structure for mobile. A consistent **8px baseline grid** governs all spatial relationships.

- **Margins & Gutters:** Desktop views use 32px external margins and 24px gutters to ensure high-density data doesn't feel cluttered.
- **Density:** For data-heavy password lists, a "Comfortable" density is preferred, using 16px vertical padding between items to prevent mis-clicks. 
- **Alignment:** All interactive elements must align to the baseline grid to maintain the "high-tech" mathematical precision required for a security product.

## Elevation & Depth

This design system uses **Tonal Layers** as the primary method of communicating depth, consistent with Material 3. In the dark theme, higher elevation levels are represented by lighter surface colors (using opacity overlays of the primary color) rather than traditional heavy shadows.

- **Level 0 (Background):** Deepest Slate, used for the main application canvas.
- **Level 1 (Cards):** Slightly lighter surface, used for secondary content or inactive states.
- **Level 2 (Active Cards/Buttons):** Uses a subtle primary-tinted overlay.
- **Shadows:** When used, shadows must be ambient and diffused—never harsh. Use a low-opacity Indigo tint in the shadow to maintain the high-tech brand personality.

## Shapes

The shape language is **Rounded**, using a 0.5rem (8px) corner radius as the standard for cards and input fields. This balances the professional "enterprise" feel with a modern, approachable edge.

- **Small Components:** Checkboxes and small tags use a 4px (Soft) radius.
- **Medium Components:** Buttons and Cards use the 8px (Rounded) standard.
- **Large Components:** Modals and bottom sheets use a 1.5rem (24px) top-radius to signal a clear shift in the user's focus.

## Components

- **Buttons:** Primary buttons use a solid Indigo fill with white text. Secondary buttons use an outlined style with a subtle Slate border. Ghost buttons are reserved for low-priority actions like "Cancel."
- **Status Chips:** Small, pill-shaped indicators using the semantic status colors. They should have a 10% opacity background of the status color with a 100% opacity text color for maximum readability without visual noise.
- **Input Fields:** Outlined Material 3 style. When focused, the border transitions to the primary Cobalt color with a subtle outer glow.
- **Vault Cards:** Elevation-based containers with a 1px border (#FFFFFF10) to define edges against the dark background. They must include a clear visual indicator of password strength (the semantic status colors).
- **Security Gauge:** A custom component—a linear or circular progress bar—that utilizes the Emerald, Amber, and Crimson colors to provide immediate feedback on vault health.
- **Data Tables:** High-density rows with subtle dividers and hover states that elevate the row slightly to guide the eye across wide data sets.