# GridSheet Preact Example

This is an example application demonstrating how to use `@gridsheet/preact-core` with Preact.

## Features

- Two GridSheet instances with shared hub
- Dark mode support
- Formula calculations
- Labeler functionality
- Interactive controls

## Getting Started

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

## Build for Production

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

## What's Included

- **Sheet1**: Basic spreadsheet with formulas and styling
- **Sheet2**: Sheet with cross-sheet formula references
- **Labeler Control**: Toggle to enable/disable decimal labeler for Sheet2

## Key Features Demonstrated

- GridSheet component usage
- Hub configuration for multiple sheets
- Formula calculations (`=SUM(A2:B2)`, `=SUM(Sheet1!A2:B3)`)
- Cell styling
- Labeler functionality
- Dark mode theme 