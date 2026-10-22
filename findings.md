# 調査知見

- UserCSSは既存DOMの装飾・移動だけを担い、動的値の複製や実button生成はUserScriptの安定DOM `.HarajukuWatchChrome` で行う。hash/generated classより `data-*`、ARIA、semantic要素を優先する。
- 説明文は `server-response.data.response.video.description` をallow-listでDOM再構築する。実測高をlayoutへ予約し、長文だけ内部scrollにしてtag・player・commentとの重なりを防ぐ。
- 公式dialogはscroll時にinline `left/top` を再設定する。対象dialogだけviewport固定で座標を上書きし、高さをviewportへclampして公式の内部scrollerを残す。
- RDP/CDPのCSS注入はreloadで消える一時検証で、Stylusの恒久導入とは別。実利用Firefoxを無断終了・変更せず、隔離profileでlight/dark、scroll、複数viewportを確認する。
- CSSだけで旧HTML構造や機能buttonを再現しようとしない。既存state属性とhover/focus/activeで足りない動作はUserScript側へ置く。
- 2026-10-22実測のWatch HTMLでは、`server-response.data.response.$watchV4.data.video.description`に説明文、`metadata.jsonLd.owner`に投稿者の`id`・`type`・`name`・`iconUrl`がある。UserScript内で旧Watch形式へ正規化し、旧`owner.nickname`も互換として残す。`owner.type`によるユーザー・チャンネル分岐と必須値を同時に検証する。
