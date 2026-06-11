# Project Notes

## Purpose

Modern niconico watch pages are styled toward the niconico Harajuku-era look.

The reference direction is:

- White or dark browser-setting-aware page background.
- A desktop-oriented layout, not constrained to 800x600.
- Left video player and right comment table.
- Top information area in the order: title, short details row, tags, player.
- Harajuku-like square panels, low border radius, compact typography, and old-style controls.

## UserCSS / UserScript Constraints

This project uses UserCSS plus an optional-but-supported UserScript.

CSS cannot:

- Recreate the old Harajuku HTML structure exactly.
- Copy text from one DOM node into another DOM node or pseudo-element.
- Create fully functional new buttons from pseudo-elements.

CSS can:

- Restyle existing controls.
- Reposition existing DOM elements.
- Use existing state attributes such as `aria-hidden`.
- Follow OS/browser theme through `prefers-color-scheme`.
- Use hover/focus/active states for temporary interactions.

UserScript can:

- Copy modern niconico dynamic values into new stable DOM used by the CSS.
- Persist explicit light/dark theme choice with `localStorage`.
- Add real controls such as the light/dark theme button.

## Selector Policy

Prefer relatively stable selectors:

- `#CommonHeader`
- `#root`
- `main`
- `.PlayerPresenter`
- `data-*`
- `aria-label`
- `href`
- semantic tags where practical

Avoid relying on hashed or generated classes when a stable attribute exists. Some utility classes are still used where the modern niconico DOM has no better hook.

## Layout Policy

- Maximum page width is around `1540px`.
- The left player area is flexible.
- The right comment area is about `460px`.
- Player and comment panel vertical bounds should match.
- Tags may wrap to multiple lines instead of being ellipsized.
- Ad-like decorative elements should not be added unless explicitly requested.

## Detail Accordion

The details panel uses the existing modern niconico accordion state.

The CSS should key off:

- `aria-hidden="false"` for expanded details.
- `aria-hidden="true"` or `display: none` for collapsed details.

When expanded, the details section must reserve vertical space so tags, player, and comments move down instead of being overlapped.

## Color Theme

The UserCSS still supports OS/browser dark mode through:

```css
@media (prefers-color-scheme: dark) {
  ...
}
```

The UserScript may also set `data-hy-theme="light"` or `data-hy-theme="dark"` on the root element for the explicit theme button.

## Known Limits

Some visual content such as the title/detail summary may still be represented by CSS pseudo-elements for stability. Dynamic metadata such as views, comments, mylists, and posted date should come from the UserScript-created DOM rather than hardcoded CSS text.
