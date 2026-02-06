# GitHub Copilot Instructions

## Project Overview

This is a personal portfolio website built with Astro, a modern static site generator. The site is deployed at https://manases.dev and uses GitHub Pages for hosting.

## Technology Stack

- **Framework**: Astro v4.16.6
- **Language**: TypeScript/JavaScript
- **Deployment**: GitHub Pages (custom domain)
- **Build Output**: `docs/` directory (configured for GitHub Pages)

## Project Structure

```
/
├── public/           # Static assets (images, favicon, etc.)
├── src/
│   ├── components/   # Reusable Astro components
│   ├── layouts/      # Page layouts
│   ├── pages/        # File-based routing pages
│   │   └── posts/    # Blog posts in Markdown
│   ├── scripts/      # JavaScript files
│   └── styles/       # CSS stylesheets
├── .nojekyll        # Prevents GitHub Pages from using Jekyll
├── astro.config.mjs # Astro configuration
└── package.json     # Project dependencies
```

## Development Commands

- `npm install` - Install dependencies
- `npm run dev` - Start local dev server at `localhost:4321`
- `npm run build` - Build production site to `./docs/`
- `npm run preview` - Preview build locally before deploying

## Coding Guidelines

### Astro Components

- Use `.astro` extension for Astro components
- Follow component-based architecture
- Place reusable components in `src/components/`
- Use layouts in `src/layouts/` for page templates

### File Naming

- Use PascalCase for component files (e.g., `Header.astro`, `BlogPost.astro`)
- Use lowercase for page files (e.g., `index.astro`, `about.astro`)
- Use descriptive names that reflect the component's purpose

### Markdown Content

- Blog posts should be placed in `src/pages/posts/`
- Use YAML frontmatter for post metadata
- Follow Markdown best practices

### TypeScript

- The project uses TypeScript with Astro's base configuration
- Type definitions should be maintained for better IDE support

## Build and Deployment

### GitHub Pages Configuration

- Output directory is set to `docs/` (not default `dist/`)
- The `.nojekyll` file must remain to prevent Jekyll processing
- Site URL is configured as `https://manases.dev`

### Important Notes

- Always build to `docs/` directory for GitHub Pages compatibility
- Do not remove or modify `.nojekyll` file
- Maintain the site URL in `astro.config.mjs`

## Best Practices

1. **Component Organization**: Keep components focused and single-purpose
2. **Performance**: Leverage Astro's zero-JS by default approach
3. **Static Assets**: Place images and static files in `public/` directory
4. **Routing**: Use file-based routing in `src/pages/`
5. **Styles**: Keep styles scoped to components when possible
6. **Accessibility**: Ensure proper semantic HTML and ARIA attributes

## When Making Changes

- Test locally with `npm run dev` before building
- Build and preview with `npm run build && npm run preview`
- Ensure no TypeScript errors
- Verify the site works correctly in the browser
- Check that the build output is in the `docs/` directory

## Dependencies

- Minimize external dependencies
- Keep Astro updated to latest stable version
- Document any new dependencies added
