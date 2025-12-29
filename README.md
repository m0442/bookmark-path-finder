# Bookmark-Path-Finder

A client-side reconnaissance bookmarklet designed for security researchers and bug bounty hunters. It scans **loaded web resources** and the **current DOM/HTML** to extract referenced **relative paths**, **imports**, **assets**, and potential **API endpoints**, then displays unique results in a clean, searchable dashboard.

> ⚠️ This tool is intended for **authorized security testing** only. Do not use it against systems you do not own or have explicit permission to test.

---

## Features

- Extracts referenced paths from:
  - Loaded **JavaScript/CSS** resources (via Performance Resource Timing)
  - The current **DOM/HTML**
- Detects common request patterns:
  - `fetch()`, `axios.get/post/...`, `XMLHttpRequest.open()`, `$.get/post`
  - `import` / `require`
  - Template strings (e.g. `` `/api/${id}` ``)
- Deduplicates and categorizes results into:
  - **API**, **Assets**, **Imports**, **Other**
- Polished UI with:
  - Search/filter
  - Tabs by category
  - Copy-to-clipboard support
  - Source attribution (where the path was found)
- Handles timeouts and skips obvious binary resources (images/fonts/media)

---

## Demo (Optional)

Add screenshots or a short GIF here:

- `docs/demo.png`
- `docs/demo.gif`

---

## Installation

This project is a **bookmarklet**, so there is nothing to install.

### Option A — Create a Bookmarklet (Recommended)

1. Copy the bookmarklet code from [`bookmark-path-finder.js`](https://github.com/m0442/bookmark-path-finder/blob/main/bookmark-path-finder.js) (or from the section below).
2. Create a new bookmark in your browser.
3. Name it (e.g., `path-finder`).
4. Paste the code into the bookmark URL/location field.
5. Save.

### Option B — Run from the Console (Quick Testing)

1. Open the target page.
2. Open Developer Tools → Console.
3. Paste the JavaScript code (without the `javascript:` prefix).
4. Press Enter.

---

## Usage

1. Navigate to the target web page you are testing.
2. Ensure the page is fully loaded.
3. Click the bookmarklet (`RouteRadar`).
4. A dashboard will appear at the bottom of the page showing discovered paths.
5. Use:
   - **Tabs** to filter by category (API/Assets/Imports/Other)
   - **Search box** to filter results
   - **Copy** button to export results to clipboard

### Tips for Better Results

- Interact with the application (navigate, click, trigger API calls) **before running the bookmarklet** to load more resources.
- If some resources fail to fetch, it may be due to **CORS**, authentication, or content-type restrictions.
- Template string paths may appear with placeholders like `/api/${id}` (expected behavior).

---

## Output Format

Each row includes:

- **Type**: API / Assets / Imports / Other  
- **Path**: Extracted path reference  
- **Source**: The resource where it was found (or `DOM/HTML`)

---
## Security & Ethics

This tool is intended for **educational and authorized testing** only.  
Always follow the target program’s rules and scope, and comply with applicable laws.
