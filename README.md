# ContainerCookies

![ContainerCookie](/screenshot.png)

A Firefox extension for viewing and managing cookies per container.

## Demo

<video src="demo.mp4" autoplay loop muted playsinline width="700"></video>

## Features

- Select any Firefox container (or "No container") from a dropdown
- Browse cookies grouped by domain
- Expand a domain to see individual cookie names and values
- Delete a single cookie or all cookies for a domain
- Clear all cookies in the selected container at once
- Search by domain or cookie name
- **Copy** cookies as JSON at three granularities, or copy a single
  name/value with one click — see [Copying](#copying)
- **Two-click confirmation** for every destructive action, so no
  accidental wipes — see [Usage](#usage)

## Copying

You can copy cookies at four levels of granularity. All multi-cookie
exports use the same JSON shape, so they're easy to feed into scripts.

| Action | Where | Format |
|---|---|---|
| Copy every cookie in the container | `copy` button in the toolbar | JSON array of `{domain, cookies}` entries, sorted by domain |
| Copy every cookie of one domain | `📋 copy` next to a domain header | JSON object: `{domain, cookies: [{name, value}, ...]}` |
| Copy one cookie (as JSON) | `copy` next to the cookie | JSON object: `{domain, cookies: [{name, value}]}` |
| Copy the cookie name | click the name in the list | plain string |
| Copy the cookie value | click the value in the list | plain string |

### Examples

Copy a single cookie — the resulting clipboard contents:
```json
{
  "domain": "example.com",
  "cookies": [
    { "name": "session_id", "value": "abc123def456" }
  ]
}
```

Copy all cookies of one domain:
```json
{
  "domain": "example.com",
  "cookies": [
    { "name": "session_id", "value": "abc123def456" },
    { "name": "theme", "value": "dark" }
  ]
}
```

Copy every cookie in a container (entries are sorted alphabetically by
domain):
```json
[
  {
    "domain": "example.com",
    "cookies": [
      { "name": "session_id", "value": "abc123def456" }
    ]
  },
  {
    "domain": "other.com",
    "cookies": [
      { "name": "preference", "value": "compact" }
    ]
  }
]
```

**Tip:** piping the container export into `jq` lets you extract one
cookie's value across every domain that has one:

```sh
cat container.json | jq '[.[] | .cookies[] | select(.name=="session_id") | .value]'
```

## Installation


### From addons.mozilla.org

https://addons.mozilla.org/en-US/firefox/addon/containercookies/

### Temporary (development)

1. Open Firefox and go to `about:debugging`
2. Click **This Firefox**
3. Click **Load Temporary Add-on**
4. Select `manifest.json` from this folder

> **Note for Flatpak Firefox users:** unzip the extension into your home directory (`~/`) first — Flatpak sandboxing prevents loading extensions from `/run/user/...` paths.

## Requirements

ContainerCookies requires [Firefox Multi-Account Containers](https://addons.mozilla.org/en-US/firefox/addon/multi-account-containers/) to display container names and colors. Without it, only the "No container" option will be available in the dropdown.

## Usage

1. Open a few websites in different containers
2. Click the ContainerCookies icon in the toolbar
3. Select a container from the dropdown to see its cookies
4. Expand any domain to browse individual cookies
5. **Copy** with the buttons described in [Copying](#copying); click a
   cookie name or value to copy just that piece of text
6. **Delete with confidence:** the first click on a delete button arms
   it (turns red, 3-second countdown). Click again within the window to
   actually delete. This two-click pattern applies to single cookies,
   whole domains, and the "Clear all" button in the toolbar — no
   accidental wipes.

No account or external service required — everything runs locally in your browser.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full version history.

## License

Copyright (C) 2026 soko1 <me@cryptopunks.org>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

https://www.gnu.org/licenses/gpl-3.0.html
