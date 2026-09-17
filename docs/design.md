---
version: alpha
name: ConfigShell
description: >-
  A dark, data-dense React component registry for high-stakes screens where precision and reliability are
  non-negotiable. Built for dashboards, tables, charts, and consoles in mission-critical products.
logo:
  src: https://ui.ssych.com/favicon.svg
colors:
  surface: '#090909'
  surface-dim: '#050505'
  surface-bright: '#121212'
  surface-container-lowest: '#0b0b0b'
  surface-container-low: '#0e0e0e'
  surface-container: '#151515'
  surface-container-high: '#1a1a1a'
  surface-container-highest: '#242424'
  on-surface: '#ffffff'
  on-surface-variant: '#a3a3a3'
  inverse-surface: '#f5f5f5'
  inverse-on-surface: '#090909'
  outline: '#737373'
  outline-variant: '#3b3b3b'
  surface-tint: '#5aaaff'
  primary: '#ffffff'
  on-primary: '#000000'
  primary-container: '#e4e4e4'
  on-primary-container: '#1a1a1a'
  inverse-primary: '#090909'
  secondary: '#5aaaff'
  on-secondary: '#000000'
  secondary-container: '#2e7cd4'
  on-secondary-container: '#ffffff'
  tertiary: '#34c28a'
  on-tertiary: '#000000'
  tertiary-container: '#92e552'
  on-tertiary-container: '#000000'
  error: '#e06a6a'
  on-error: '#ffffff'
  error-container: '#8b3a3a'
  on-error-container: '#ffcccc'
  primary-fixed: '#e4e4e4'
  primary-fixed-dim: '#c8c8c8'
  on-primary-fixed: '#000000'
  on-primary-fixed-variant: '#2c2c2c'
  secondary-fixed: '#8cc4ff'
  secondary-fixed-dim: '#5aaaff'
  on-secondary-fixed: '#000000'
  on-secondary-fixed-variant: '#1a3a5c'
  tertiary-fixed: '#92e552'
  tertiary-fixed-dim: '#34c28a'
  on-tertiary-fixed: '#000000'
  on-tertiary-fixed-variant: '#1a4d2e'
  background: '#090909'
  on-background: '#ffffff'
  surface-variant: '#2c2c2c'
typography:
  display:
    fontFamily: Sora
    fontSize: 64px
    fontWeight: '500'
    lineHeight: 72px
    letterSpacing: '-0.02em'
  headline-lg:
    fontFamily: Sora
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: '-0.015em'
  headline-md:
    fontFamily: Sora
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: '-0.01em'
  title-lg:
    fontFamily: Sora
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0em
  body-lg:
    fontFamily: Sora
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0.005em
  body-md:
    fontFamily: Sora
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.003em
  label-md:
    fontFamily: Sora
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Sora
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 4px
  DEFAULT: 8px
  md: 12px
  lg: 20px
  xl: 32px
  full: 9999px
spacing:
  unit: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  container-max: 1280px
elevation:
  sm: inset 0 0 50px 0 rgba(255, 255, 255, 0.02)
  md: inset 0 0 0 1px rgba(255, 255, 255, 0.1)
  lg: 0 8px 32px 0 rgba(0, 0, 0, 0.4)
layout:
  containerMaxWidth: 1280px
  gridColumns: 12
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    typography: '{typography.label-md}'
    rounded: '{rounded.DEFAULT}'
    padding: 12px 20px
    height: 44px
    border: none
    boxShadow: inset 0 0 50px 0 rgba(255, 255, 255, 0.02), inset 0 0 0 1px rgba(255, 255, 255, 0.1)
  button-primary-hover:
    backgroundColor: '{colors.primary-fixed-dim}'
    textColor: '{colors.on-primary}'
    transition: background-color 200ms ease-out
  button-secondary:
    backgroundColor: transparent
    textColor: '{colors.on-surface-variant}'
    typography: '{typography.label-md}'
    rounded: '{rounded.DEFAULT}'
    padding: 12px 20px
    height: 44px
    border: 1px solid {colors.outline-variant}
  button-secondary-hover:
    backgroundColor: '{colors.surface-container-high}'
    textColor: '{colors.on-surface}'
    transition: all 200ms ease-out
  button-ghost:
    backgroundColor: transparent
    textColor: '{colors.secondary}'
    typography: '{typography.label-md}'
    rounded: '{rounded.DEFAULT}'
    padding: 12px 20px
    height: 44px
    border: none
  button-ghost-hover:
    backgroundColor: rgba(90, 170, 255, 0.08)
    transition: background-color 200ms ease-out
  card:
    backgroundColor: '{colors.surface-container-low}'
    rounded: '{rounded.lg}'
    padding: '{spacing.md}'
    border: 1px solid {colors.outline-variant}
    boxShadow: '{elevation.sm}'
  card-hover:
    backgroundColor: '{colors.surface-container-high}'
    transition: background-color 200ms ease-out
  input-field:
    backgroundColor: '{colors.surface-container-lowest}'
    textColor: '{colors.on-surface}'
    typography: '{typography.body-md}'
    rounded: '{rounded.DEFAULT}'
    padding: '{spacing.sm}'
    border: 1px solid {colors.outline-variant}
    height: 40px
  input-field-focus:
    borderColor: '{colors.secondary}'
    boxShadow: 0 0 0 2px rgba(90, 170, 255, 0.15)
    transition: all 200ms ease-out
  badge:
    backgroundColor: '{colors.secondary-container}'
    textColor: '{colors.on-secondary-container}'
    typography: '{typography.label-sm}'
    rounded: '{rounded.full}'
    padding: 4px 12px
    height: 24px
    display: inline-flex
    alignItems: center
  badge-success:
    backgroundColor: '{colors.tertiary-container}'
    textColor: '{colors.on-tertiary-container}'
  badge-error:
    backgroundColor: '{colors.error-container}'
    textColor: '{colors.on-error-container}'
  list-item:
    backgroundColor: transparent
    rounded: '{rounded.md}'
    padding: '{spacing.sm}'
    border: none
  list-item-hover:
    backgroundColor: '{colors.surface-container-high}'
    textColor: '{colors.on-surface}'
    transition: background-color 150ms ease-out
  divider:
    backgroundColor: '{colors.outline-variant}'
    height: 1px
    width: 100%
---

## Overview

ssych ui is a dark-mode-first component registry engineered for mission-critical, data-dense interfaces where precision and reliability are non-negotiable. The brand serves high-stakes product teams building dashboards, trading floors, monitoring consoles, and analytics platforms—environments where a single misread value or delayed interaction can have material consequences. The aesthetic is 'Austere Technical Precision': a near-black canvas (#090909) paired with surgical accent colors (bright white CTAs, electric blue secondary actions at #5aaaff, and accent greens at #34c28a) that cut through the darkness with absolute clarity. The UI evokes the feeling of a professional control room—calm, focused, unadorned, and utterly trustworthy.

The brand voice is direct, confident, and unambiguous. Vocabulary favors specificity over marketing flourish: 'copy-paste React' instead of 'seamless integration', 'SVG-only charts' instead of 'lightweight visualizations', 'every file is yours after install' instead of 'full ownership'. The tone assumes the user is a senior engineer or product lead who has no patience for hype and every reason to be skeptical. Example sentence in brand voice: 'Every chart is SVG-only, every colour is a token, and every file is yours after install—no runtime bloat, no vendor lock-in.'

## Colors

The color system is built on a near-black foundation (#090909 surface, #0b0b0b surface-container-lowest) that maximizes contrast and reduces eye strain during extended data-analysis sessions. This is not a neutral dark mode—it is a deliberate choice to create visual authority and reduce cognitive load in high-pressure environments.

Primary (#ffffff) is the call-to-action white used on 'Get started' buttons and critical interactive elements. Its high contrast against the dark background (21:1 WCAG AAA) ensures it commands attention without shouting. Secondary (#5aaaff, a vivid electric blue from the --color-accent-500 token) is reserved for secondary actions, links, and data highlights—it provides visual hierarchy without competing with primary. Tertiary (#34c28a, a surgical green) is used

## Typography

The type system uses Sora (a geometric, humanist sans-serif) exclusively, avoiding system fonts to maintain brand consistency across platforms. Display (64px, 500 weight, -0.02em tracking) is reserved for hero headlines and major section titles; it reads as confident and authoritative without excess weight. Headline-lg (40px, 600 weight) and headline-md (28px, 600 weight) establish visual hierarchy for subsections and card titles. Body-lg (18px, 400 weight, 28px line-height) and body-md (16px, 400 weight, 24px line-height) are the workhorses for descriptive copy and data labels—the 24px line-height on body-md ensures readability even when text is rendered at small sizes over complex backgrounds. Label-md (14px, 500 weight, 0.01em tracking) and label-sm (12px, 500 weight, 0.02em tracking) a

## Layout

The layout uses a 12-column grid with a max-width of 1280px, allowing for flexible content arrangement from mobile (single column) to desktop (multi-column dashboards). The gutter is consistently 24px (md spacing), creating breathing room between sections without introducing excessive whitespace. Container max-widths vary by section (930px, 880px, 860px observed) to accommodate different content types—wider for data tables, narrower for narrative copy. White-space philosophy is 'minimal but intentional': the dark background provides visual weight, so spacing is used sparingly to separate concerns rather than to fill the page. Section separation uses lg spacing (40px) for major breaks and md spacing (24px) for subsections. Cards and containers use md padding (24px) internally, with sm paddi

## Elevation & Depth

Depth is conveyed through a combination of inset shadows (for subtle surface definition) and border treatments (for clear layer separation). Level 1 (Base surface) has no shadow—it is the canvas itself (#090909). Level 2 (Standard card) uses a 1px solid border at rgba(255, 255, 255, 0.1) inset, paired with an inset shadow of 0 0 50px 0 rgba(255, 255, 255, 0.02) to create a barely-perceptible inner glow. Level 3 (Elevated card or modal) thickens the border to 2px and increases the inset shadow opacity to rgba(255, 255, 255, 0.04). Hover states transition the background-color from surface-contai

## Shapes

The shape philosophy is 'Surgical Minimalism': border-radius values are chosen to feel precise and intentional, never organic or playful. Buttons and inputs use DEFAULT (8px) for a subtle softness that reads as 'refined' rather than 'rounded'. Cards and elevated containers use lg (20px) to create visual separation from the background without appearing bubbly. Modals and full-width overlays use xl (32px) for a more pronounced corner treatment that signals 'important content'. Icon buttons and circular elements use full (9999px) for perfect circles. The reasoning: 8px is the minimum radius that

## Components

### Action Elements
Buttons are the primary interaction surface and must command attention without distraction. The primary button (button-primary) uses white (#ffffff) background with black text (#000000), 12px vertical / 20px horizontal padding, 8px border-radius, and a 44px minimum height. It includes an inset shadow (0 0 50px 0 rgba(255, 255, 255, 0.02)) and a 1px inset border (rgba(255, 255, 255, 0.1)) to create subtle depth. On hover (button-primary-hover), the background transitions to primary-fixed-dim (#c8c8c8) over 200ms ease-out, signaling interactivity without jarring the user. The secondary button (button-secondary) uses a transparent background with a 1px outline-variant border (#3b3b3b) and on-surface-variant text (#a3a3a3). On hover, it fills with surface-container-high (#1

## Do's and Don'ts

**Do**
- Do use white (#ffffff) for primary CTAs and critical interactive elements—it has 21:1 contrast against the dark background and commands attention without aggression.
- Do apply the inset shadow (0 0 50px 0 rgba(255, 255, 255, 0.02)) and 1px inset border (rgba(255, 255, 255, 0.1)) to all elevated surfaces to create subtle depth without visual clutter.
- Do transition all interactive state changes (hover, focus, active) over 200ms ease-out to provide tactile feedback without animation bloat.
- Do use the surface-container stack (8 levels from #0b0b0b to #242424) to create clear visual hierarchy in nested layouts—never skip levels or introduce arbitrary grays.
- Do reserve secondary (#5aaaff) for secondary actions, links, and data highlights—it is the only accent color that should appear frequently in the UI.

**Don't**
- Don't use rounded corners smaller than 8px or larger than 32px—hard corners feel broken, and radii larger than 32px read as whimsical and undermine the austere brand.
- Don't apply shadows (box-shadow: 0 X Y Z) to surfaces—use inset shadows and borders instead to maintain the flat, technical aesthetic.
- Don't introduce new accent colors beyond primary (#ffffff), secondary (#5aaaff), tertiary (#34c28a), and error (#e06a6a)—the color palette is intentionally constrained to reduce cognitive load.
- Don't animate transitions longer than 200ms or use easing functions other than ease-out—the brand favors snappy, responsive interactions over ornamental motion.
- Don't use system fonts or fallback sans-serifs—always specify Sora to maintain brand consistency and the geometric, humanist character that defines the visual identity.
