# Changelog

All notable changes to ContainerCookies are documented in this file.

## [1.1.0] - 2026-06-06

### Added
- **Copy cookies as JSON** at three granularities:
  - All cookies of the selected container (`copy` button in the toolbar)
  - All cookies of a specific domain (`📋 copy` next to a domain header)
  - A single cookie (`copy` next to that cookie)
- **Click a cookie name** in the list to copy just the name to the clipboard.
- **Click a cookie value** in the list to copy just the value to the clipboard.
- **Two-click confirmation** for destructive actions: the first click on a
  delete button arms it (turns red, shows a 3-second countdown); a second
  click within the window commits the deletion. Applies to single cookie,
  per-domain, and "Clear all" buttons.
- **Row preview tint**: hovering a copy/delete button tints the whole row
  (or whole domain group) so you can see exactly what will be affected
  before you act.

### Changed
- **Lowered minimum Firefox version to 78.0** (was a placeholder `142.0`;
  the extension only uses APIs available since Firefox 45–57).
- "Clear all" button now wears a ✕ icon to match the rest of the
  destructive controls.

## [1.0.0] - 2026-05-21

### Added
- Initial release.
- Browse cookies grouped by domain in any Firefox container (or
  "No container").
- Delete a single cookie, all cookies of a domain, or all cookies in a
  container.
- Search by domain or cookie name.
