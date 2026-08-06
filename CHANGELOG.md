# Changelog

このプロジェクトの主な変更を記録します。

## [Unreleased]

### Changed

- 動画説明をアコーディオン操作なしで読めるよう、watchページの`server-response`から説明HTMLを事前取得して安全な専用DOMへ描画し、空・短文はコンパクトに、長文は最大高まで伸長した後だけ内部スクロールする表示へ変更した。
- 作業開始時の共通指針見落としを防ぐため、調査やコマンド実行より前に `COMMON-AGENTS.md` を先頭から末尾まで読み、EOFを確認する必須ゲートを追加した。

- watchページの`server-response` metaから投稿者情報を再構築してタイトル右側へ表示した。NicoCache_nlのグローバルAPIには依存しない。
