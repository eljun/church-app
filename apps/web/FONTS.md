# Custom Fonts Guide

## Available Fonts

### 1. Gilroy (Base Font)
**Variable:** `--font-gilroy`
**Usage:** Default body text and UI elements
**Tailwind class:** `font-sans`

**Available Weights:**
- Light (300): `font-light`
- Regular (400): `font-normal` (default)
- Medium (500): `font-medium`
- SemiBold (600): `font-semibold`
- Bold (700): `font-bold`

### 2. Agenor Neue (Display Font)
**Variable:** `--font-agenor`
**Usage:** Headers, titles, and display text
**Tailwind class:** `font-display`

**Available Weights:**
- Thin (100): `font-thin`
- Light (300): `font-light`
- Regular (400): `font-normal`
- SemiBold (600): `font-semibold`
- Bold (700): `font-bold`
- ExtraBold (800): `font-extrabold`
- Black (900): `font-black`

## Usage Examples

### In Component Classes

```tsx
// Default font (Gilroy Regular)
<p className="text-base">This uses Gilroy Regular</p>

// Gilroy with different weights
<p className="font-light">Gilroy Light</p>
<p className="font-medium">Gilroy Medium</p>
<p className="font-semibold">Gilroy SemiBold</p>
<p className="font-bold">Gilroy Bold</p>

// Agenor Neue for display text
<h1 className="font-display text-4xl font-bold">
  Big Title with Agenor Neue
</h1>

<h2 className="font-display text-2xl font-semibold">
  Subtitle with Agenor Neue
</h2>
```

### In CSS/Tailwind

```css
/* Use Gilroy (already applied to body) */
.my-element {
  font-family: var(--font-gilroy);
}

/* Use Agenor Neue */
.my-heading {
  font-family: var(--font-agenor);
}
```

### Direct Font Family Usage

```tsx
import { gilroy, agenorNeue } from '@/lib/fonts'

// Apply to specific elements
<div className={gilroy.className}>
  Text in Gilroy
</div>

<h1 className={agenorNeue.className}>
  Heading in Agenor Neue
</h1>
```

## Typography Hierarchy

### Recommended Usage

**Headings (use Agenor Neue):**
```tsx
<h1 className="font-display text-4xl font-bold">Page Title</h1>
<h2 className="font-display text-3xl font-semibold">Section Title</h2>
<h3 className="font-display text-2xl font-semibold">Subsection</h3>
```

**Body Text (use Gilroy):**
```tsx
<p className="text-base">Regular paragraph text</p>
<p className="text-sm font-medium">Small emphasized text</p>
```

**UI Elements (use Gilroy):**
```tsx
<button className="font-medium">Button Text</button>
<label className="text-sm font-medium">Form Label</label>
```

**Dashboard Stats (mix both):**
```tsx
<div className="stat-card">
  <p className="text-sm font-medium text-gray-600">Total Members</p>
  <p className="font-display text-3xl font-bold">1,234</p>
</div>
```

## Font Files Location

All font files are located in:
```
apps/web/public/fonts/
├── Gilroy-Light.ttf
├── Gilroy-Regular.ttf
├── Gilroy-Medium.ttf
├── Gilroy-SemiBold.ttf
├── Gilroy-Bold.ttf
├── AgenorNeue-Thin.otf
├── AgenorNeue-Light.otf
├── AgenorNeue-Regular.otf
├── AgenorNeue-SemiBold.otf
├── AgenorNeue-Bold.otf
├── AgenorNeue-ExtraBold.otf
└── AgenorNeue-Black.otf
```

## Performance

- Fonts are loaded using Next.js `localFont()` with `display: 'swap'`
- Automatic font optimization and subsetting
- Self-hosted for better performance and privacy
- No external font requests (Google Fonts, etc.)

## Tips

1. **Use Gilroy for most text** - It's more readable for body copy
2. **Use Agenor Neue sparingly** - Great for headings and numbers
3. **Combine both fonts** - Creates visual hierarchy
4. **Respect font weights** - Don't use extreme weights for body text

## Migration from Geist

If you had Geist fonts before, they've been replaced:
- `font-sans` now uses Gilroy (was Geist Sans)
- `font-mono` is removed (use `font-display` for special text)
- All components automatically use Gilroy as base font
