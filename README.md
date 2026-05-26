# ContainerCookies

A Firefox extension for viewing and managing cookies per container.

## Features

- Select any Firefox container (or "No container") from a dropdown
- Browse cookies grouped by domain
- Expand a domain to see individual cookie names and values
- Delete a single cookie or all cookies for a domain
- Clear all cookies in the selected container at once
- Search by domain or cookie name

## Installation

### Temporary (development)

1. Open Firefox and go to `about:debugging`
2. Click **This Firefox**
3. Click **Load Temporary Add-on**
4. Select `manifest.json` from this folder

> **Note for Flatpak Firefox users:** unzip the extension into your home directory (`~/`) first — Flatpak sandboxing prevents loading extensions from `/run/user/...` paths.

### From addons.mozilla.org

Coming soon.


## Requirements

ContainerCookies requires [Firefox Multi-Account Containers](https://addons.mozilla.org/en-US/firefox/addon/multi-account-containers/) to display container names and colors. Without it, only the "No container" option will be available in the dropdown.

## Usage

1. Open a few websites in different containers
2. Click the ContainerCookies icon in the toolbar
3. Select a container from the dropdown to see its cookies
4. Expand any domain to browse individual cookies
5. Click ✕ next to a cookie to delete it, or use "Clear all" to wipe the entire container

No account or external service required — everything runs locally in your browser.

## Screenshot

![ContainerCookie](/screenshot.png)

## License

Copyright (C) 2025 soko1 <me@cryptopunks.org>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

https://www.gnu.org/licenses/gpl-3.0.html
