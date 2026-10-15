# niconico Harajuku-ish

現代のニコニコ動画 watch ページを、ニコニコ動画（原宿）風に表示する UserCSS + UserScript です。

## 適用対象

主な対象は watch ページです。

```text
https://www.nicovideo.jp/watch/*
```

CSS 側でも `https://www.nicovideo.jp/watch/` に限定しているため、他のページには適用されません。

## Stylus + UserScript で使う

CSSだけでは別DOMの値をコピーできません。[harajuku.user.js](./harajuku.user.js) が `.HarajukuWatchChrome` を作り、再生数・コメント数・マイリスト数・投稿日時と light/dark テーマボタンを右上にまとめます。

UserScriptは現在のwatchページを取得し、`server-response.data.response`から投稿者情報と動画説明文を再構築します。`NicoCache_nl.watch.apiData`には依存しません。
動画説明文は安全な専用DOMへ描画し、公式の詳細アコーディオンを表示しません。説明が空または短い場合は22pxを基準にコンパクトに収まり、内容量に応じて`clamp(96px, 18vh, 220px)`まで自動で伸び、それを超えた本文だけが内部スクロールになります。

NG設定・タグ編集・動画プレーヤー設定・ギフト・マイリスト追加の共通パネルは画面右側へ固定し、ページをスクロールしても画面内に残ります。長い内容はパネル内でスクロールできます。

タグ検索おすすめ欄と通常おすすめ欄はサイドバー内でビューポート連動の高さを持つスクロール領域として表示します。ヘッダー検索ボタンは`inline-flex`で虫めがねアイコンを中央揃えします。

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

不具合の報告と変更の提案は[サポート](SUPPORT.md)と[貢献方法](CONTRIBUTING.md)を参照してください。セキュリティ上の問題の報告方法は[SECURITY.md](SECURITY.md)、利用条件は[MITライセンス](LICENSE)に記載しています。

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

開発時の表示確認は [findings.md](findings.md#readme-1) を参照してください。

## アンインストール

Stylus の管理画面で、このスタイルを無効化または削除します。

## Firefox DevTools RDP で確認する

詳細は [findings.md](findings.md#readme-1) に移しました。

## Chrome CDP で確認する

詳細は [findings.md](findings.md#readme-2) に移しました。
