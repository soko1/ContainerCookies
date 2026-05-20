# ContainerCookies

A Firefox extension for viewing and managing cookies per container.

## Features

- Select any Firefox container (or "No container") from a dropdown
- Browse cookies grouped by domain
- Expand a domain to see individual cookie names and values
- Delete a single cookie or all cookies for a domain
- Clear all cookies in the selected container at once
- Search by domain or cookie name

## Installation (temporary, for development)

1. Open Firefox and navigate to `about:debugging`
2. Click **This Firefox**
3. Click **Load Temporary Add-on**
4. Select `manifest.json` from this folder

## Files

```
containercookies/
├── manifest.json
├── popup.html
├── popup.js
└── icons/
    ├── icon-48.png
    └── icon-96.png
```

## Permissions

- `cookies` — read and delete cookies
- `contextualIdentities` — list Firefox containers
- `<all_urls>` — required to remove cookies across all domains

## License

MIT
