# findings.md

harajuku の実現手段、共通指針の適用条件と調査知見の正本。作業前に全文読む。利用者向けの導入・使用方法はREADME、更新の手順はhow-to-update.md、実施結果と未検証事項はverification.mdを参照する。移した記述の確認日・条件・留保は元のまま保持し、文書移動を再実測と解釈しない。

## 共通指針の適用条件と代替検証

- 対象の共通ルール: 設計と実装方針／検証／ブラウザ検証
- 理由: 既存のUserCSSとUserScriptを利用者がStylus等へ導入する構成であり、新規TypeScript/Bun基盤への移行をこの文書分離の一部にしない。
- 適用範囲: CSS・UserScriptと一時注入による表示検証
- 同等の品質を保つ手段・検証: 既存ソース・適用URLを照合し、隔離ブラウザの一時注入と恒久導入を区別してlight/dark・スクロール・画面寸法を確認する。以下の旧RDP例を実利用Firefoxへ無断適用せず、共通の注意・復旧条件を守る。

新たな免除や操作許可を追加するものではない。AGENTS.mdの禁止・承認条件と共通指針は引き続き有効。

<a id="agents-1"></a>

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

移動元: `AGENTS.md`。

<a id="agents-2"></a>

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

移動元: `AGENTS.md`。

<a id="agents-3"></a>

## Layout Policy

- Maximum page width is around `1540px`.
- The left player area is flexible.
- The right comment area is about `460px`.
- Player and comment panel vertical bounds should match.
- Tags may wrap to multiple lines instead of being ellipsized.
- Ad-like decorative elements should not be added unless explicitly requested.

移動元: `AGENTS.md`。

<a id="agents-4"></a>

## Video Description Panel

The UserScript reads `server-response.data.response.video.description`, sanitizes it with an allow-list DOM rebuild, and renders it in `.HarajukuDescription`.

- Do not expose the modern niconico details accordion as the description UI.
- Empty and short descriptions stay close to the minimum height.
- Longer descriptions grow with their content up to the responsive maximum height.
- Only content beyond the maximum height scrolls inside the description panel.
- The measured description height must reserve vertical space so tags, player, and comments never overlap it.

移動元: `AGENTS.md`。

<a id="agents-5"></a>

## Color Theme

The UserCSS still supports OS/browser dark mode through `prefers-color-scheme`.

移動元: `AGENTS.md`。

<a id="agents-6"></a>

## Watch Floating Panels (2026-09-27)

The official gift, player settings, NG settings, tag edit, and mylist dialogs receive inline `left` and `top` values from Watch JavaScript during scrolling. Keep the shared panel rule viewport fixed and override those inline coordinates only for these dialogs. Clamp the height to the viewport so the official internal scroller remains usable. The matching filter-matome implementation and CDP observations are recorded in `verification.md`.

移動元: `AGENTS.md`。

<a id="readme-1"></a>

## Firefox DevTools RDP で確認する

### Firefox を RDP 待ち受けで起動

Firefox を終了してから、PowerShell で起動します。

```powershell
& "$env:ProgramFiles\Mozilla Firefox\firefox.exe" --start-debugger-server 6000
```

別のプロファイルで起動したい場合:

```powershell
& "$env:ProgramFiles\Mozilla Firefox\firefox.exe" --no-remote --profile "$env:TEMP\harajuku-firefox-profile" --start-debugger-server 6000
```

接続できない場合は、`about:config` で次を確認します。

```text
devtools.debugger.remote-enabled = true
devtools.chrome.enabled = true
devtools.debugger.prompt-connection = false
```

### Firefox RDP に一時注入

Firefox で対象の watch ページを開いた状態で、このリポジトリのフォルダから実行します。

```powershell
@'
import socket, json, pathlib

css = pathlib.Path("harajuku.user.css").read_text(encoding="utf-8")
start = css.find('@-moz-document url-prefix("https://www.nicovideo.jp/watch/") {')
if start >= 0:
    inner = css[start + len('@-moz-document url-prefix("https://www.nicovideo.jp/watch/") {'):]
    css = inner[:inner.rfind("}")]

s = socket.create_connection(("127.0.0.1", 6000), timeout=5)
s.settimeout(10)

def recv():
    data = b""
    while b":" not in data:
        data += s.recv(1)
    length, rest = data.split(b":", 1)
    length = int(length)
    while len(rest) < length:
        rest += s.recv(length - len(rest))
    return json.loads(rest[:length].decode())

def send(packet):
    body = json.dumps(packet, separators=(",", ":")).encode()
    s.sendall(str(len(body)).encode() + b":" + body)

def wait_from(actor, pred=lambda m: True):
    while True:
        msg = recv()
        if msg.get("from") == actor and pred(msg):
            return msg

def evaluate(console_actor, text):
    send({"to": console_actor, "type": "evaluateJSAsync", "text": text})
    wait_from(console_actor, lambda m: "resultID" in m)
    return wait_from(console_actor, lambda m: m.get("type") == "evaluationResult")

recv()
send({"to": "root", "type": "listTabs"})
tab = wait_from("root")["tabs"][0]["actor"]
send({"to": tab, "type": "getTarget"})
console_actor = wait_from(tab)["frame"]["consoleActor"]

script = f"""
(() => {{
  let style = document.getElementById("harajuku-usercss-live-test");
  if (!style) {{
    style = document.createElement("style");
    style.id = "harajuku-usercss-live-test";
    document.documentElement.appendChild(style);
  }}
  style.textContent = {json.dumps(css)};
  window.scrollTo(0, 0);
  return location.href;
}})()
"""

print(evaluate(console_actor, script).get("result"))
s.close()
'@ | python -
```

この方法はページを再読み込みすると消える一時注入です。恒久適用には Stylus を使います。

移動元: `README.md`。

<a id="readme-2"></a>

## Chrome CDP で確認する

### Chrome を CDP 待ち受けで起動

Chrome を終了してから、PowerShell で起動します。

```powershell
& "$env:ProgramFiles\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="$env:TEMP\harajuku-chrome-profile"
```

起動後、Chrome で対象の watch ページを開きます。

### Chrome CDP に一時注入

このリポジトリのフォルダから実行します。

```powershell
@'
import json, pathlib, urllib.request, websocket

css = pathlib.Path("harajuku.user.css").read_text(encoding="utf-8")
start = css.find('@-moz-document url-prefix("https://www.nicovideo.jp/watch/") {')
if start >= 0:
    inner = css[start + len('@-moz-document url-prefix("https://www.nicovideo.jp/watch/") {'):]
    css = inner[:inner.rfind("}")]

targets = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json"))
target = next(t for t in targets if "nicovideo.jp/watch/" in t.get("url", ""))
ws = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=5)

script = f"""
(() => {{
  let style = document.getElementById("harajuku-usercss-live-test");
  if (!style) {{
    style = document.createElement("style");
    style.id = "harajuku-usercss-live-test";
    document.documentElement.appendChild(style);
  }}
  style.textContent = {json.dumps(css)};
  window.scrollTo(0, 0);
  return location.href;
}})()
"""

ws.send(json.dumps({
    "id": 1,
    "method": "Runtime.evaluate",
    "params": {"expression": script, "awaitPromise": True}
}))

print(ws.recv())
ws.close()
'@ | python -
```

`ModuleNotFoundError: No module named 'websocket'` が出る場合は、`websocket-client` を入れてから実行します。

```powershell
python -m pip install websocket-client
```

この方法もページを再読み込みすると消える一時注入です。恒久適用には Stylus を使います。

移動元: `README.md`。

## 関連文書

- [利用者向けREADME](README.md)
- [更新と復旧](how-to-update.md)
- [検証結果と未検証範囲](verification.md)
- [変更履歴](CHANGELOG.md)

## 一時注入の用途

RDP/CDP の一時注入で確認してから Stylus に貼り付けると調整しやすいです。

実利用Firefoxを無断終了せず、共通指針の隔離・承認・復旧条件を優先する。
