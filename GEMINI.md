# Project Overview

This is a personal portfolio and blog website built using the [Astro](https://astro.build/) web framework. The project is owned by Manasés Lovera, a software developer.

## Technologies Used

- **Astro**: Main framework for building the static site.
- **Markdown**: Used for writing blog posts.
- **CSS**: Custom styles in `src/styles/global.css`.
- **JavaScript**: Client-side scripts in `src/scripts/menu.js`.

## Architecture and Structure

- **`src/pages/`**: Contains the routes for the website. Each `.astro` or `.md` file corresponds to a page.
- **`src/layouts/`**: Reusable layouts for pages (`BaseLayout.astro`) and blog posts (`MarkdownPostLayout.astro`).
- **`src/components/`**: Reusable UI components like `Header`, `Footer`, `Navigation`, and `Social`.
- **`src/posts/`**: Markdown files for blog posts.
- **`public/`**: Static assets like the favicon.
- **`docs/`**: The build output directory, configured for GitHub Pages deployment.

## Building and Running

All commands are run from the root of the project:

- **Install dependencies:**

  ```bash
  npm install
  ```

- **Start development server:**

  ```bash
  npm run dev
  ```

  Starts a local server at `http://localhost:4321`.
- **Build for production:**

  ```bash
  npm run build
  ```

  Generates static files in the `./docs` directory.
- **Preview production build:**

  ```bash
  npm run preview
  ```

- **Astro CLI:**

  ```bash
  npm run astro -- [command]
  ```

## Development Conventions

- **Language**: The website content is a mix of English and Spanish. Layouts have inconsistent `lang` attributes (`es` in `BaseLayout.astro`, `en` in `MarkdownPostLayout.astro`).
- **Styling**: Uses a global CSS file (`src/styles/global.css`) and some scoped styles within `.astro` components.
- **Scripts**: Client-side interactivity (like the mobile menu) is handled in `src/scripts/menu.js` and imported in layouts.
- **Deployment**: The project is configured to output to the `docs/` folder to facilitate hosting on GitHub Pages. A `.nojekyll` file is present to prevent GitHub Pages from processing the site with Jekyll.
- **Configuration**: `astro.config.mjs` defines the `outDir` as `./docs` and the `site` as `https://manases.dev`.
