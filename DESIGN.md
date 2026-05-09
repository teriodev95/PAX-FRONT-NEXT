---
version: "alpha"
name: "PAX LMS Interface System"
description: "Design contract for PAX LMS frontend. Colors are intentionally excluded because branding is dynamic by empresa."
typography:
  display:
    fontFamily: "Inter"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0
  h1:
    fontFamily: "Inter"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0
  h2:
    fontFamily: "Inter"
    fontSize: "1.25rem"
    fontWeight: 650
    lineHeight: 1.35
    letterSpacing: 0
  body:
    fontFamily: "Inter"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: "Inter"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  label:
    fontFamily: "Inter"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: 0
  caption:
    fontFamily: "Inter"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
rounded:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
  4xl: "64px"
components:
  app-shell:
    width: "100%"
    padding: "16px"
  content-narrow:
    width: "min(100%, 380px)"
  content-readable:
    width: "min(100%, 672px)"
  card:
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
  card-compact:
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  button:
    height: "48px"
    rounded: "{rounded.md}"
    padding: "0 16px"
    typography: "{typography.label}"
  button-sm:
    height: "40px"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    typography: "{typography.label}"
  input:
    height: "48px"
    rounded: "{rounded.md}"
    padding: "0 16px"
    typography: "{typography.body}"
  header:
    height: "76px"
    padding: "16px 24px"
  mobile-header:
    height: "64px"
    padding: "12px 16px"
  avatar:
    size: "40px"
    rounded: "{rounded.full}"
  icon-button:
    size: "40px"
    rounded: "{rounded.full}"
  badge:
    height: "28px"
    rounded: "{rounded.full}"
    padding: "0 10px"
    typography: "{typography.caption}"
  progress:
    height: "6px"
    rounded: "{rounded.full}"
---

## Overview

PAX LMS is an operational learning platform for financial teams. The interface should feel calm, structured and professional: quick to scan, comfortable on mobile, and precise enough for repeated use.

This file standardizes layout, typography, shape, density and component sizing. It deliberately does not define brand colors. Colors, logos and accent behavior are dynamic and must continue to come from `lib/brand-config.ts`, `lib/use-brand.ts` and CSS variables such as `--brand-primary`, `--brand-accent` and `--brand-on-accent`.

## Typography

Use Inter because it is already loaded in `app/layout.tsx` and keeps the LMS consistent with the current codebase.

Use a compact product scale:

- `display`: only for app identity or prominent empty states.
- `h1`: page titles and primary screen headings.
- `h2`: card titles, section headings and modal titles.
- `body`: form inputs and primary reading text.
- `body-sm`: helper text, descriptions and secondary metadata.
- `label`: form labels and action text.
- `caption`: counters, badges and low-priority metadata.

Do not scale font size with viewport width. Keep `letterSpacing` at `0`. Avoid all-caps labels unless the source content is an acronym.

## Layout

Use a 4px spacing scale with visible rhythm:

- Tight related groups: `8px` to `12px`.
- Form fields and card internals: `16px` to `24px`.
- Section separation: `32px` to `48px`.
- Page-level breathing room: `48px` to `64px` when viewport height allows it.

Mobile layouts should be single-column and max out interactive forms around `380px`. Dense operational screens can use `max-width: 672px` for readable content or wider constrained containers when grids are required.

Avoid nesting cards inside cards. Use dividers, spacing and section headings to create hierarchy inside a card.

## Elevation & Depth

Prefer borders and clear spacing over heavy shadows. Use subtle shadows only when a surface needs to separate from the page, such as auth forms, dropdowns or floating actions.

Depth order should remain predictable:

- Page background
- Content sections
- Cards and tool surfaces
- Sticky headers
- Dropdowns and popovers
- Dialogs and toasts

Do not use decorative glow, glassmorphism or blurred background layers as a default treatment.

## Shapes

Use radius intentionally:

- `6px` to `8px`: dense controls and small tags.
- `12px`: inputs and standard buttons.
- `16px`: cards and repeated list items.
- `24px`: auth containers or prominent mobile panels.
- `full`: avatars, progress tracks and small pills.

Cards should generally use `16px`; use `24px` only for focused surfaces like the login card.

## Components

### Buttons

Primary buttons are `48px` high on mobile and desktop. Small buttons are `40px` high. Button labels should be short commands: "Continuar", "Certificado", "Reintentar".

Button colors must come from brand variables or neutral UI tokens, never hardcoded company colors.

### Inputs

Inputs are `48px` high with `16px` horizontal padding. If an icon is present, keep the icon at `16px` and reserve `44px` left padding so text aligns consistently.

Place labels above fields. Use placeholders only as examples or short hints, not as the only label.

### Cards

Cards represent a distinct object or workflow: course card, profile section, certificate block. Use one card level only. Inside a card, use spacing and dividers instead of nested card surfaces.

### Headers

Desktop header height should stay near `76px`. Mobile header height should stay near `64px`. The logo block must remain stable and not resize based on company name length.

Header brand color and logo are dynamic by empresa.

### Course Cards

Course cards must keep a stable aspect ratio for media. Title and description should clamp to predictable line counts. Progress should not shift layout when updated.

### Certificates

Certificate layout may use brand colors and logo, but sizing, typography hierarchy and spacing should remain consistent across empresas.

## Do's and Don'ts

Do:

- Use brand variables for all company color decisions.
- Keep mobile touch targets at least `44px`; prefer `48px`.
- Keep text inside buttons and cards short enough to fit on 320px screens.
- Use consistent `gap` values instead of ad hoc margins.
- Prefer readable hierarchy through size, weight and spacing before adding visual decoration.

Don't:

- Do not hardcode Xpress or GoCash colors inside components.
- Do not create new one-off radii or spacing values when a token exists.
- Do not put cards inside cards.
- Do not use colored side stripes on cards or callouts.
- Do not use gradient text.
- Do not add explanatory in-app text unless it helps the user complete the immediate task.
