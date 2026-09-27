# AGENTS.md

## 作業開始前の必須手順（最優先・例外なし）

1. エージェントは、調査、計画、コマンド実行、スキル利用、ファイル編集、コミット、プッシュを始める前に、必ずリポジトリ直下の `.\COMMON-AGENTS.md` を開き、先頭から末尾まで全文を読む。
2. `COMMON-AGENTS.md` はGit管理外のシンボリックリンクである。`git`や既定のignore設定が有効な`rg --files`の検索結果だけで、ファイルが存在しないと判断してはならない。PowerShellでは最初に次を実行する。

```powershell
Get-Content -Raw -LiteralPath .\COMMON-AGENTS.md
```

3. 読み取りに失敗した場合、出力が省略された場合、または末尾まで読めたことを確認できない場合は、一切の作業を開始せず、パスとシンボリックリンク先を確認して全文を再取得する。必要なら分割して末尾まで読む。
4. 全文を読了するまで、ローカル `AGENTS.md` だけを根拠に作業を続けてはならない。読了後は `COMMON-AGENTS.md` を最優先の指針とし、読了直後の最初の進捗報告で全文を読了したことを明示する。
このファイルでは `harajuku` 固有の補足だけを記載する。

## Purpose

Modern niconico watch pages are styled toward the niconico Harajuku-era look.

The reference direction is:

- White or dark browser-setting-aware page background.
- A desktop-oriented layout, not constrained to 800x600.
- Left video player and right comment table.
- Top information area in the order: title, short details row, tags, player.
- Harajuku-like square panels, low border radius, compact typography, and old-style controls.

## UserCSS / UserScript Constraints

This project uses UserCSS plus a UserScript for dynamic watch-page UI.

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

- Copy modern niconico dynamic values into `.HarajukuWatchChrome`, the stable DOM used by the CSS.
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

## Video Description Panel

The UserScript reads `server-response.data.response.video.description`, sanitizes it with an allow-list DOM rebuild, and renders it in `.HarajukuDescription`.

- Do not expose the modern niconico details accordion as the description UI.
- Empty and short descriptions stay close to the minimum height.
- Longer descriptions grow with their content up to the responsive maximum height.
- Only content beyond the maximum height scrolls inside the description panel.
- The measured description height must reserve vertical space so tags, player, and comments never overlap it.

## Color Theme

The UserCSS still supports OS/browser dark mode through `prefers-color-scheme`.

## Watch Floating Panels (2026-09-27)

The official gift, player settings, NG settings, tag edit, and mylist dialogs receive inline `left` and `top` values from Watch JavaScript during scrolling. Keep the shared panel rule viewport fixed and override those inline coordinates only for these dialogs. Clamp the height to the viewport so the official internal scroller remains usable. The matching filter-matome implementation and CDP observations are recorded in `verification.md`.
