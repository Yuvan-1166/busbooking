# Bus Booking Application - Design System

**Version:** 1.0  
**Last Updated:** September 19, 2026

This document defines the complete design system for the bus booking application, inspired by Zoho's clean, professional design language.

---

## Design Principles

1. **Clarity First** - Information should be easy to find and understand
2. **Professional** - Enterprise-grade quality and polish
3. **Consistent** - Same patterns everywhere
4. **Accessible** - WCAG AA compliant
5. **Efficient** - Fast to use, minimal friction
6. **Trustworthy** - Reliable, secure feeling

---

## Color System

### Primary Palette (Blue)
Professional, trustworthy, calm

```css
--primary-50:  #eff6ff;  /* Lightest - backgrounds, hover states */
--primary-100: #dbeafe;  /* Very light - selected states */
--primary-200: #bfdbfe;  /* Light */
--primary-300: #93c5fd;  /* Medium light */
--primary-400: #60a5fa;  /* Medium */
--primary-500: #3b82f6;  /* Base - primary buttons, links */
--primary-600: #2563eb;  /* Medium dark - hover states */
--primary-700: #1d4ed8;  /* Dark - pressed states */
--primary-800: #1e40af;  /* Very dark */
--primary-900: #1e3a8a;  /* Darkest */
```

### Neutral Palette (Gray)
Base UI, text, borders

```css
--neutral-50:  #fafbfc;  /* Page background */
--neutral-100: #f4f6f8;  /* Card background, disabled */
--neutral-200: #e8ecef;  /* Borders, dividers */
--neutral-300: #d0d7de;  /* Disabled text, secondary borders */
--neutral-400: #9ba6b1;  /* Placeholder text, muted content */
--neutral-500: #6e7a87;  /* Secondary text */
--neutral-600: #4e5a65;  /* Body text */
--neutral-700: #36404a;  /* Headings, emphasized text */
--neutral-800: #1f2831;  /* Dark headings */
--neutral-900: #0f1419;  /* Darkest text */
```

### Success Palette (Green)
Confirmations, success states

```css
--success-50:  #f0fdf4;
--success-100: #dcfce7;
--success-500: #22c55e;  /* Base */
--success-600: #16a34a;  /* Hover */
--success-700: #15803d;  /* Pressed */
```

### Warning Palette (Orange)
Warnings, important notices

```css
--warning-50:  #fff7ed;
--warning-100: #ffedd5;
--warning-500: #f97316;  /* Base */
--warning-600: #ea580c;  /* Hover */
--warning-700: #c2410c;  /* Pressed */
```

### Error Palette (Red)
Errors, destructive actions

```css
--error-50:  #fef2f2;
--error-100: #fee2e2;
--error-500: #ef4444;  /* Base */
--error-600: #dc2626;  /* Hover */
--error-700: #b91c1c;  /* Pressed */
```

### Info Palette (Blue)
Information, tips

```css
--info-50:  #eff6ff;
--info-100: #dbeafe;
--info-500: #3b82f6;  /* Base */
--info-600: #2563eb;  /* Hover */
--info-700: #1d4ed8;  /* Pressed */
```

### Usage Guidelines
- **Primary:** CTAs, links, interactive elements
- **Neutral:** Text, backgrounds, borders
- **Success:** Confirmations, completed states
- **Warning:** Cautions, attention needed
- **Error:** Errors, validation failures
- **Info:** Helpful information, tips

---

## Typography

### Font Families

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
```

**Why Inter?**
- Professional, clean, highly readable
- Excellent for UI (designed for screens)
- Wide language support
- Free and open source

### Font Sizes

```css
--text-xs:   0.75rem;    /* 12px - Captions, helper text, badges */
--text-sm:   0.875rem;   /* 14px - Secondary text, labels, small buttons */
--text-base: 1rem;       /* 16px - Body text, inputs, buttons */
--text-lg:   1.125rem;   /* 18px - Emphasized body text */
--text-xl:   1.25rem;    /* 20px - Small headings, large buttons */
--text-2xl:  1.5rem;     /* 24px - Section headings */
--text-3xl:  1.875rem;   /* 30px - Page headings */
--text-4xl:  2.25rem;    /* 36px - Hero headings */
--text-5xl:  3rem;       /* 48px - Large hero */
--text-6xl:  3.75rem;    /* 60px - Extra large hero */
```

### Font Weights

```css
--font-normal:    400;  /* Body text */
--font-medium:    500;  /* Slightly emphasized */
--font-semibold:  600;  /* Buttons, labels, headings */
--font-bold:      700;  /* Strong emphasis, important headings */
```

### Line Heights

```css
--leading-none:    1;     /* Tight headings */
--leading-tight:   1.25;  /* Headings */
--leading-snug:    1.375; /* Large text */
--leading-normal:  1.5;   /* Body text */
--leading-relaxed: 1.625; /* Long-form content */
--leading-loose:   2;     /* Spaced content */
```

### Letter Spacing

```css
--tracking-tighter: -0.05em;
--tracking-tight:   -0.025em;
--tracking-normal:  0;
--tracking-wide:    0.025em;
--tracking-wider:   0.05em;
--tracking-widest:  0.1em;
```

### Typography Scale Usage

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| Hero H1 | 48px | 700 | 1.1 | Landing page hero |
| Page H1 | 36px | 600 | 1.2 | Main page heading |
| Section H2 | 24px | 600 | 1.3 | Section headings |
| Card H3 | 20px | 600 | 1.4 | Card titles |
| Body | 16px | 400 | 1.5 | Main content |
| Small | 14px | 400 | 1.5 | Secondary text |
| Caption | 12px | 400 | 1.4 | Captions, labels |

---

## Spacing System

Based on 4px grid (0.25rem)

```css
--space-0:   0;
--space-1:   0.25rem;  /* 4px  - Tight spacing */
--space-2:   0.5rem;   /* 8px  - Compact spacing */
--space-3:   0.75rem;  /* 12px - Small spacing */
--space-4:   1rem;     /* 16px - Base spacing */
--space-5:   1.25rem;  /* 20px - Medium spacing */
--space-6:   1.5rem;   /* 24px - Large spacing */
--space-8:   2rem;     /* 32px - Extra large */
--space-10:  2.5rem;   /* 40px - Section spacing */
--space-12:  3rem;     /* 48px - Large section */
--space-16:  4rem;     /* 64px - Hero spacing */
--space-20:  5rem;     /* 80px - Extra large section */
--space-24:  6rem;     /* 96px - Massive spacing */
```

### Spacing Guidelines
- **Buttons:** 12px vertical, 20px horizontal
- **Cards:** 24px padding
- **Sections:** 48-64px vertical margin
- **Form fields:** 16px spacing between
- **List items:** 12px spacing between

---

## Border Radius

```css
--radius-none: 0;
--radius-sm:   0.125rem;  /* 2px  - Tight elements */
--radius-base: 0.25rem;   /* 4px  - Inputs, buttons, badges */
--radius-md:   0.375rem;  /* 6px  - Cards, containers */
--radius-lg:   0.5rem;    /* 8px  - Modals, large cards */
--radius-xl:   0.75rem;   /* 12px - Special cards */
--radius-2xl:  1rem;      /* 16px - Hero cards */
--radius-full: 9999px;    /* Circular - Pills, avatars */
```

---

## Shadows & Elevation

```css
--shadow-xs:   0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm:   0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
--shadow-base: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
--shadow-md:   0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
--shadow-lg:   0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
--shadow-xl:   0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

### Elevation Levels
- **Level 0:** Flat on page (default)
- **Level 1:** `--shadow-sm` - Cards, inputs
- **Level 2:** `--shadow-base` - Dropdowns, tooltips
- **Level 3:** `--shadow-md` - Modals, dialogs
- **Level 4:** `--shadow-lg` - Overlays, drawers
- **Level 5:** `--shadow-xl` - High-priority modals

---

## Component Specifications

### Buttons

#### Primary Button
```css
background: var(--primary-500);
color: white;
padding: 10px 20px;         /* Medium: base size */
border-radius: var(--radius-base);
font-size: var(--text-sm);
font-weight: var(--font-semibold);
transition: all 150ms ease;

:hover {
  background: var(--primary-600);
  box-shadow: var(--shadow-sm);
}

:active {
  background: var(--primary-700);
}

:disabled {
  background: var(--neutral-300);
  color: var(--neutral-500);
  cursor: not-allowed;
}
```

#### Secondary Button
```css
background: white;
color: var(--neutral-700);
border: 1px solid var(--neutral-300);
padding: 10px 20px;
border-radius: var(--radius-base);
font-size: var(--text-sm);
font-weight: var(--font-semibold);

:hover {
  background: var(--neutral-50);
  border-color: var(--neutral-400);
}

:active {
  background: var(--neutral-100);
}
```

#### Ghost Button
```css
background: transparent;
color: var(--primary-600);
padding: 8px 16px;
font-size: var(--text-sm);
font-weight: var(--font-medium);

:hover {
  background: var(--primary-50);
}

:active {
  background: var(--primary-100);
}
```

#### Sizes
- **Small:** padding: 6px 12px, font-size: 12px
- **Medium:** padding: 10px 20px, font-size: 14px
- **Large:** padding: 12px 24px, font-size: 16px

### Inputs

```css
width: 100%;
padding: 10px 12px;
border: 1px solid var(--neutral-300);
border-radius: var(--radius-base);
font-size: var(--text-sm);
color: var(--neutral-800);
background: white;
transition: all 150ms ease;

::placeholder {
  color: var(--neutral-400);
}

:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px var(--primary-100);
}

:disabled {
  background: var(--neutral-100);
  color: var(--neutral-400);
  cursor: not-allowed;
}

.error {
  border-color: var(--error-500);
}

.error:focus {
  box-shadow: 0 0 0 3px var(--error-100);
}
```

### Cards

```css
background: white;
border: 1px solid var(--neutral-200);
border-radius: var(--radius-md);
padding: var(--space-6);
transition: all 150ms ease;

.interactive:hover {
  border-color: var(--neutral-300);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
}
```

### Badges

```css
display: inline-flex;
align-items: center;
padding: 4px 10px;
border-radius: var(--radius-base);
font-size: var(--text-xs);
font-weight: var(--font-medium);
text-transform: uppercase;
letter-spacing: 0.025em;

.success {
  background: var(--success-100);
  color: var(--success-700);
}

.warning {
  background: var(--warning-100);
  color: var(--warning-700);
}

.error {
  background: var(--error-100);
  color: var(--error-700);
}

.neutral {
  background: var(--neutral-100);
  color: var(--neutral-600);
}
```

### Alerts

```css
padding: 16px;
border-radius: var(--radius-md);
border-left: 4px solid;
font-size: var(--text-sm);

.success {
  background: var(--success-50);
  border-color: var(--success-500);
  color: var(--success-800);
}

.warning {
  background: var(--warning-50);
  border-color: var(--warning-500);
  color: var(--warning-800);
}

.error {
  background: var(--error-50);
  border-color: var(--error-500);
  color: var(--error-800);
}

.info {
  background: var(--info-50);
  border-color: var(--info-500);
  color: var(--info-800);
}
```

---

## Layout Patterns

### Page Container
```css
max-width: 1200px;
margin: 0 auto;
padding: 0 24px;
```

### Section Spacing
```css
margin-top: var(--space-12);    /* 48px between sections */
margin-bottom: var(--space-12);
```

### Card Grid
```css
display: grid;
gap: var(--space-6);            /* 24px gap */
grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
```

---

## Animation & Transitions

### Standard Transitions
```css
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;
```

### Usage
- **Hover states:** 150ms
- **Focus states:** 150ms
- **Modal open/close:** 200ms
- **Page transitions:** 300ms

### Easing Functions
```css
--ease-in:      cubic-bezier(0.4, 0, 1, 1);
--ease-out:     cubic-bezier(0, 0, 0.2, 1);
--ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1);
```

---

## Responsive Breakpoints

```css
--breakpoint-sm:  640px;   /* Mobile landscape */
--breakpoint-md:  768px;   /* Tablet */
--breakpoint-lg:  1024px;  /* Desktop */
--breakpoint-xl:  1280px;  /* Large desktop */
--breakpoint-2xl: 1536px;  /* Extra large */
```

### Mobile-First Approach
Design for mobile first, then enhance for larger screens.

---

## Accessibility Guidelines

### Color Contrast
- **Normal text:** 4.5:1 minimum (WCAG AA)
- **Large text (18px+):** 3:1 minimum
- **UI components:** 3:1 minimum

### Focus States
- All interactive elements must have visible focus indicators
- Use `box-shadow` for focus rings (outline can be cut off)
- Focus ring: `0 0 0 3px var(--primary-100)`

### Form Accessibility
- Every input must have a label
- Use `aria-label` if visual label is not present
- Provide error messages with `aria-describedby`
- Disable autocomplete for sensitive fields

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Tab order must be logical
- Provide skip navigation links

---

## Icon System

### Icon Library
Use **Lucide Icons** or **Heroicons** for consistency

### Icon Sizes
```css
--icon-xs:  12px;
--icon-sm:  16px;
--icon-base: 20px;
--icon-lg:  24px;
--icon-xl:  32px;
```

### Usage
- Icons should be inline with text
- Use `currentColor` for icon fill to match text color
- Provide `aria-label` for icon-only buttons

---

## Best Practices

### Do's ✅
- Use design tokens consistently
- Follow the spacing scale
- Maintain color contrast ratios
- Provide clear focus states
- Use semantic HTML
- Test on real devices
- Optimize for performance

### Don'ts ❌
- Don't use arbitrary values
- Don't mix font families
- Don't use `!important` unless absolutely necessary
- Don't nest more than 3 levels deep in CSS
- Don't use inline styles
- Don't skip accessibility testing

---

**End of Design System Documentation**
