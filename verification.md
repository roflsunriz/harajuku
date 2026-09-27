# 検証手順

## 共通パネルの画面固定（2026-09-27）

Chrome CDP 9222で公開Watch `sm9` を表示し、`harajuku.user.css` 0.3.34と`harajuku.user.js`を一時適用した。ギフト、動画プレーヤー設定、タグ編集は784×505の画面で開閉し、ページを600pxスクロールする前後でパネルの矩形がいずれも`x=433, y=48, right=753, bottom=497`のまま変わらなかった。原宿風UserScriptの`.HarajukuWatchChrome`生成も確認した。検証後は一時スタイルとスクリプトが残らないようページを再読み込みした。

一時適用はStylus/Tampermonkeyのインストール経路を確認する代わりにはならない。更新後は`how-to-update.md`に沿い、両ファイルを管理拡張へ貼り付けて通常のWatch再読み込みで確認する。NG設定とマイリスト追加は匿名Watchから操作できなかったため、今回のCDP実操作では未確認。共通CSSセレクターはfilter-matomeのChromium回帰テストで両パネルを含む5種類すべてを確認した。

問題があれば前版のCSSとUserScriptを管理拡張へ戻して再読み込みする。パネルが画面外へ移動した場合は、公式DOMの`aria-label`、インライン`left`・`top`、スクロール前後の`getBoundingClientRect()`を比較する。
