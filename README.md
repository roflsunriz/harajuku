# niconico Harajuku-ish

現代のニコニコ動画 watch ページを、ニコニコ動画（原宿）風に表示する UserCSS + UserScript です。

## 適用対象

主な対象は watch ページです。

```text
https://www.nicovideo.jp/watch/*
```

CSS 側でも `https://www.nicovideo.jp/watch/` に限定しているため、他のページには適用されません。

## Stylus + UserScript で使う

CSSだけでは別DOMの数値をコピーできないため、[harajuku.user.js](./harajuku.user.js) が `.HarajukuWatchChrome` を作り、再生数・コメント数・マイリスト数・投稿日時の右上表示と light/dark テーマボタンをそこへ集約します。
動画詳細情報の展開高と、NG設定・タグ編集・動画プレーヤー設定・ギフト・マイリスト追加パネルの高さも UserScript が実測し、CSS 変数へ反映してサイドバーの見えている下端に揃えます。タグ検索おすすめ欄と通常おすすめ欄はサイドバー内でビューポート連動の高さを持つスクロール領域として表示します。

### Firefox

1. Firefox に Stylus をインストールします。
2. Firefox に Tampermonkey または Violentmonkey をインストールします。
3. Stylus の管理画面を開きます。
4. 新規スタイルを作成します。
5. [harajuku.user.css](./harajuku.user.css) の内容をすべて貼り付けます。
6. UserScript マネージャーで新規スクリプトを作成します。
7. [harajuku.user.js](./harajuku.user.js) の内容をすべて貼り付けます。
8. 両方を保存します。
9. `https://www.nicovideo.jp/watch/*` のページを再読み込みします。

### Chrome

1. Chrome に Stylus をインストールします。
2. Chrome に Tampermonkey または Violentmonkey をインストールします。
3. Stylus の管理画面を開きます。
4. 新規スタイルを作成します。
5. [harajuku.user.css](./harajuku.user.css) の内容をすべて貼り付けます。
6. UserScript マネージャーで新規スクリプトを作成します。
7. [harajuku.user.js](./harajuku.user.js) の内容をすべて貼り付けます。
8. 両方を保存します。
9. `https://www.nicovideo.jp/watch/*` のページを再読み込みします。

`harajuku.user.css` には `@-moz-document url-prefix("https://www.nicovideo.jp/watch/")` が含まれています。Stylus ではそのまま貼り付けられます。

light/dark テーマボタンを使う場合は、ボタンの選択が最優先です。OS やブラウザのライト/ダーク設定より、UserScript が `<html>` に設定する `data-hy-theme="light"` / `data-hy-theme="dark"` が優先されます。

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

## テーマ

UserScript がページ右上に `Dark` / `Light` ボタンを追加します。選択は `localStorage` に保存されます。

配色の優先順位は次の通りです。

1. `Dark` / `Light` ボタンで選んだ明示テーマ
2. UserScript を使わない場合のみ、OS またはブラウザの配色設定

明示テーマは `<html>` の `data-hy-theme="light"` / `data-hy-theme="dark"` として反映され、CSS内の `prefers-color-scheme` より優先されます。

- OS/ブラウザ通常配色: `prefers-color-scheme: light`
- OS/ブラウザ暗色配色: `prefers-color-scheme: dark`

## 更新

1. [harajuku.user.css](./harajuku.user.css) または [harajuku.user.js](./harajuku.user.js) を編集します。
2. Stylus または UserScript マネージャーに貼り付けている内容を差し替えます。
3. watch ページを再読み込みします。

RDP/CDP の一時注入で確認してから Stylus に貼り付けると調整しやすいです。

## アンインストール

Stylus の管理画面で、このスタイルを無効化または削除します。
