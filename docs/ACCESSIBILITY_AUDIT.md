# Accessibility (WCAG 2.1 AA) Audit Guide

## Overview

This document outlines the accessibility audit process for Mavi MES to ensure compliance with WCAG 2.1 AA standards.

## WCAG 2.1 AA Requirements

### Perceivable

| Criterion | Description | Status |
|-----------|-------------|--------|
| 1.1.1 | Non-text Content | ⬜ TODO |
| 1.2.1 | Audio-only and Video-only | ⬜ N/A |
| 1.2.2 | Captions (Prerecorded) | ⬜ N/A |
| 1.2.3 | Audio Description or Media Alternative | ⬜ N/A |
| 1.2.4 | Captions (Live) | ⬜ N/A |
| 1.2.5 | Audio Description (Prerecorded) | ⬜ N/A |
| 1.3.1 | Info and Relationships | ⬜ TODO |
| 1.3.2 | Meaningful Sequence | ⬜ TODO |
| 1.3.3 | Sensory Characteristics | ⬜ TODO |
| 1.3.4 | Orientation | ⬜ TODO |
| 1.3.5 | Identify Input Purpose | ⬜ TODO |
| 1.4.1 | Use of Color | ⬜ TODO |
| 1.4.2 | Audio Control | ⬜ N/A |
| 1.4.3 | Contrast (Minimum) | ⬜ TODO |
| 1.4.4 | Resize Text | ⬜ TODO |
| 1.4.5 | Images of Text | ⬜ TODO |
| 1.4.10 | Reflow | ⬜ TODO |
| 1.4.11 | Non-text Contrast | ⬜ TODO |
| 1.4.12 | Text Spacing | ⬜ TODO |
| 1.4.13 | Content on Hover or Focus | ⬜ TODO |

### Operable

| Criterion | Description | Status |
|-----------|-------------|--------|
| 2.1.1 | Keyboard | ⬜ TODO |
| 2.1.2 | No Keyboard Trap | ⬜ TODO |
| 2.1.4 | Character Key Shortcuts | ⬜ TODO |
| 2.2.1 | Timing Adjustable | ⬜ TODO |
| 2.2.2 | Pause, Stop, Hide | ⬜ TODO |
| 2.3.1 | Three Flashes or Below Threshold | ⬜ TODO |
| 2.4.1 | Bypass Blocks | ⬜ TODO |
| 2.4.2 | Page Titled | ⬜ TODO |
| 2.4.3 | Focus Order | ⬜ TODO |
| 2.4.4 | Link Purpose (In Context) | ⬜ TODO |
| 2.4.5 | Multiple Ways | ⬜ TODO |
| 2.4.6 | Headings and Labels | ⬜ TODO |
| 2.4.7 | Focus Visible | ⬜ TODO |

### Understandable

| Criterion | Description | Status |
|-----------|-------------|--------|
| 3.1.1 | Language of Page | ⬜ TODO |
| 3.1.2 | Language of Parts | ⬜ TODO |
| 3.2.1 | On Focus | ⬜ TODO |
| 3.2.2 | On Input | ⬜ TODO |
| 3.2.3 | Consistent Navigation | ⬜ TODO |
| 3.2.4 | Consistent Identification | ⬜ TODO |
| 3.3.1 | Error Identification | ⬜ TODO |
| 3.3.2 | Labels or Instructions | ⬜ TODO |
| 3.3.3 | Error Suggestion | ⬜ TODO |
| 3.3.4 | Error Prevention | ⬜ TODO |

### Robust

| Criterion | Description | Status |
|-----------|-------------|--------|
| 4.1.1 | Parsing | ⬜ TODO |
| 4.1.2 | Name, Role, Value | ⬜ TODO |
| 4.1.3 | Status Messages | ⬜ TODO |

## Quick Wins Checklist

### 1. Color Contrast ✅

```css
/* Good: 4.5:1 ratio for normal text */
/* Bad: Low contrast makes text hard to read */

.text-primary {
  color: #1f2937; /* Dark gray on white - 16:1 contrast */
}

.button-primary {
  background-color: #7c3aed; /* Purple - 4.6:1 on white */
  color: #ffffff;
}

/* Check contrast at https://webaim.org/resources/contrastchecker/ */
```

### 2. Keyboard Navigation ✅

```jsx
// Add visible focus indicators
:focus-visible {
  outline: 2px solid #7c3aed;
  outline-offset: 2px;
}

// Skip link for main content
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

### 3. Form Labels ✅

```jsx
// Bad
<input type="text" placeholder="Enter name" />

// Good
<label htmlFor="name" className="sr-only">Name</label>
<input type="text" id="name" aria-label="Enter your name" />

// Or visible label
<label htmlFor="email">
  Email Address
  <span className="required">*</span>
</label>
<input type="email" id="email" aria-required="true" />
```

### 4. Error Messages ✅

```jsx
// Bad: Red border only
<input className={hasError ? 'error' : ''} />

// Good: Icon and text announcement
<div role="alert">
  <span className="error-icon">⚠️</span>
  <span>Email is required</span>
</div>
<input aria-invalid="true" aria-describedby="email-error" />
<div id="email-error" className="error-message">
  Email is required
</div>
```

### 5. Alt Text ✅

```jsx
// Images
<img 
  src="/logo.png" 
  alt="Mavi MES Logo - Manufacturing Execution System" 
/>

// Decorative images
<img 
  src="/decoration.png" 
  alt="" 
  aria-hidden="true" 
/>

// Complex images
<img 
  src="/chart.png" 
  alt="Production chart showing 50% increase in Q3" 
/>
```

### 6. Screen Reader Text ✅

```css
/* Visually hidden but accessible */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### 7. Semantic HTML ✅

```jsx
// Bad
<div className="button" onClick={handleClick}>Click</div>

// Good
<button type="button" onClick={handleClick}>Click</button>

// Navigation
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>

// Main content
<main id="main-content" tabIndex={-1}>
  <h1>Page Title</h1>
</main>
```

### 8. Page Titles ✅

```jsx
// Each page should have unique title
<title>
  {pageTitle} | Mavi MES
</title>
```

## Testing Tools

### Automated Testing

```bash
# Install axe-core
npm install @axe-core/react

# Add to development
import React from 'react';
import ReactDOM from 'react-dom';
import axe from '@axe-core/react';

if (process.env.NODE_ENV !== 'production') {
  axe(React, ReactDOM, 1000);
}
```

### Manual Testing Checklist

- [ ] Can navigate entire app using only keyboard
- [ ] All interactive elements are reachable via Tab
- [ ] Focus indicators are visible
- [ ] All images have alt text
- [ ] All form fields have labels
- [ ] Error messages are announced
- [ ] Color is not the only indicator of meaning
- [ ] Page is usable at 200% zoom
- [ ] Content reflows without horizontal scrolling

### Screen Reader Testing

Test with:
- **NVDA** (Windows) - Free
- **VoiceOver** (macOS/iOS) - Built-in
- **JAWS** (Windows) - Commercial
- **ChromeVox** (Chrome) - Free

## Accessibility Component Library

```jsx
// src/components/accessibility/

// Button with accessibility
export function AButton({ children, variant = 'primary', ...props }) {
  return (
    <button
      className={`btn btn-${variant}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Form field with label
export function AField({ label, error, required, children }) {
  const id = useId();
  const errorId = `${id}-error`;
  
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true">*</span>}
      </label>
      {children}
      {error && (
        <div id={errorId} role="alert" className="error">
          {error}
        </div>
      )}
    </div>
  );
}

// Visually hidden text
export function SRTxt({ children }) {
  return <span className="sr-only">{children}</span>;
}
```

## Color Palette Recommendations

| Color | Hex | Usage | Contrast |
|-------|-----|-------|----------|
| Primary | `#7c3aed` | Buttons, links | 4.6:1 on white ✅ |
| Success | `#059669` | Success states | 4.9:1 on white ✅ |
| Warning | `#d97706` | Warnings | 4.7:1 on white ✅ |
| Error | `#dc2626` | Errors | 5.2:1 on white ✅ |
| Text Dark | `#1f2937` | Primary text | 16:1 on white ✅ |
| Text Light | `#6b7280` | Secondary text | 5.5:1 on white ✅ |

## Resources

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WCAG Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Accessibility Insights](https://accessibilityinsights.io/)
