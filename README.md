# Bookmark Path Finder

![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-yellow.svg)
![Type](https://img.shields.io/badge/Type-Bookmarklet-blue.svg)

A lightweight **client-side reconnaissance** bookmarklet built for **security researchers** and **bug bounty hunters**.  
It inspects loaded web resources and the current DOM/HTML to extract referenced **relative paths**, **imports**, **assets**, and potential **API endpoints**, then presents unique results in a clean, searchable dashboard.

> ⚠️ **Authorized use only.**  
> Use this tool only on systems you own or have explicit permission to test.

---

## Key Capabilities

- Scans **loaded resources** (JavaScript/CSS) using Performance Resource Timing
- Analyzes the **current DOM/HTML**
- Detects common client-side request patterns:
  - `fetch()`, `axios.*()`, `XMLHttpRequest.open()`, `$.get/post`
  - `import` / `require`
  - Template literals (Console version) — e.g. `` `/api/${id}` ``
- Deduplicates and categorizes results into:
  - **API**, **Assets**, **Imports**, **Other**
- Includes a polished UI:
  - Search/filter
  - Category tabs
  - Copy-to-clipboard export
  - Source attribution per finding
- Skips obvious binary content (images/fonts/media) and applies timeouts for stability

---

## Repository Files

- **Bookmarklet (standalone):** [`bookmark-path-finder.bookmarklet.js`](./bookmark-path-finder.bookmarklet.js)  
  Designed to be pasted directly into a browser bookmark URL (starts with `javascript:`).

- **Console version (readable):** [`bookmark-path-finder.console.js`](./bookmark-path-finder.console.js)  
  Designed for DevTools Console use and includes **template literal extraction**.

---

## Usage

### Option A — Bookmarklet (Recommended)

1. Open: [`bookmark-path-finder.bookmarklet.js`](./bookmark-path-finder.bookmarklet.js)
2. Copy the entire content (it starts with `javascript:`).
3. Create a new browser bookmark.
4. Set the bookmark name to: `Path Finder` (or any preferred name).
5. Paste the copied content into the bookmark **URL/Location** field.
6. Save.

Run the tool by opening the target page and clicking the bookmark.

---

### Option B — Console (Quick Testing)

1. Open the target page.
2. Open **Developer Tools → Console**
3. Open: [`bookmark-path-finder.console.js`](./bookmark-path-finder.console.js)
4. Copy and paste it into the Console.
5. Press Enter.

---

## Tips for Better Coverage

- Trigger additional application functionality (navigation, user actions, API calls) **before running the scanner**
  to increase the amount of loaded resources analyzed.
- Some resources may fail due to:
  - **CORS restrictions**
  - authentication/session requirements
  - content-type policies
- Template literal results may include placeholders like `/api/${id}` (expected).

---

## Output

Each finding is displayed as a row containing:

- **Type**: API / Assets / Imports / Other  
- **Path**: the extracted path reference  
- **Source**: the resource where it was found (or `DOM/HTML`)

The **Copy** button exports results in a tab-separated format:

```text
TYPE    PATH    SOURCE
api     /api/users      https://example.com/app.js
assets  /static/logo.svg DOM/HTML
```

---

## Limitations

Resources blocked by CORS may not be retrievable.

Dynamically constructed routes may not resolve to static strings.

Results depend on which resources were loaded during the current session.

---

## Security & Ethics

This project is intended for authorized security testing and educational purposes.
Always follow the target program scope and rules, and comply with applicable laws.

---

License

MIT License recommended. Add a LICENSE file to your repository if you plan to publish it as open source.
