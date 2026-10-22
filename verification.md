# 検証手順

## Watch API投稿者名の変更追従（2026-10-22）

2026-10-22保存の実Watchページソースで、`server-response.data.response`直下が`$watchV4`と`pcweb`へ変わり、動画説明文が`$watchV4.data.video.description`、投稿者が`$watchV4.data.metadata.jsonLd.owner`にあることを、値を出力せずキー・型・文字列長で確認した。UserScriptはこのV4データを旧内部形式へ正規化し、`owner.type`でユーザー・チャンネルを分岐する。旧Watch形式も互換として残し、`harajuku.user.js`の版番号は0.3.2へ更新した。

同じ実`server-response`全体を`harajuku.user.js`から抽出した正規化・投稿者・説明文関数へ入力し、説明文77文字、投稿者名9文字、プロフィールリンク文字列、アイコンありになることを値非表示で確認した。

添付の描画後DOMへ実`server-response`を戻して`harajuku.user.js` 0.3.2本体を起動し、投稿者欄1件、投稿者名9文字、プロフィールリンクとアイコンあり、説明欄1件・ready・本文65文字、Harajuku chrome 1件を確認した。

`node --check harajuku.user.js`で構文を確認し、実測V4形、旧形、チャンネル形、必須値欠損を補助テストで確認した。同じ変換規則を共有するfilter-matome側は全コード経路を監査し、単体280件、Chromium E2E 92件、39ファイルのビルドが合格した。添付ZIPの修正前DOMではHarajuku説明欄がempty、投稿者欄が0件で公式投稿者リンクだけが残る状態を確認し、上記の修正版製品経路で復旧した。UserScript管理拡張へ0.3.2を導入した実利用経路とチャンネル投稿動画は未検証として残るため、更新後は`how-to-update.md`に従って確認する。

## 共通パネルの画面固定（2026-09-27）

Chrome CDP 9222で公開Watch `sm9` を表示し、`harajuku.user.css` 0.3.34と`harajuku.user.js`を一時適用した。ギフト、動画プレーヤー設定、タグ編集は784×505の画面で開閉し、ページを600pxスクロールする前後でパネルの矩形がいずれも`x=433, y=48, right=753, bottom=497`のまま変わらなかった。原宿風UserScriptの`.HarajukuWatchChrome`生成も確認した。検証後は一時スタイルとスクリプトが残らないようページを再読み込みした。

一時適用はStylus/Tampermonkeyのインストール経路を確認する代わりにはならない。更新後は`how-to-update.md`に沿い、両ファイルを管理拡張へ貼り付けて通常のWatch再読み込みで確認する。NG設定とマイリスト追加は匿名Watchから操作できなかったため、今回のCDP実操作では未確認。共通CSSセレクターはfilter-matomeのChromium回帰テストで両パネルを含む5種類すべてを確認した。

問題があれば前版のCSSとUserScriptを管理拡張へ戻して再読み込みする。パネルが画面外へ移動した場合は、公式DOMの`aria-label`、インライン`left`・`top`、スクロール前後の`getBoundingClientRect()`を比較する。

## 2026-10-05: GitHub受付・READMEの整備（公開前）

- 比較元: `2a0c640dd010bd5035e44cc47aaccb82736fcffd`（`main`）。
- 受付フォーム 2 件のYAML構造、重複キー・ID、入力型、選択肢、予約ファイル名を一括検査し、エラー0件。
- 既存の固有質問・入力例・必須条件を原文と照合。READMEのリンク・画像・コマンド・条件を確認し、裏付けがある誤記だけを訂正した。
- 既存のCI、Dependabot、labeler、ライセンスのファイル内容は比較元から変更していない。
- 製品のビルド・インストール・実機操作、GitHub上のフォーム表示、公開後CIは今回の静的検証に含めない。公開後に実際の受付表示と必要ラベルの適用を確認する。

## 2026-10-16: findings.mdへの知見分離

- 目的: 共通指針に合わせ、AGENTSの行動指示と利用者向けREADMEから、開発内部の実現手段・例外の条件・再利用する調査知見をfindings.mdへ分離した。移動した本文の条件・確認日・未検証の留保を保持した。
- 元文書との本文照合、Markdownの相対リンク・見出しアンカーの検査、git diff --checkを実施し、新たなリンク不整合と空白エラーは0件。AGENTSの一般的な指示は内容を保って再編し、findings全文必読・禁止と承認条件を確認した。
- GitHubの既存Dependabot警告を読み取り、Open PRも確認した（作業開始時Open PR 0件、Open警告 0件）。GitHubの警告なしを全依存の安全保証や実機動作の検証とは扱わない。
- 文書移動と参照整理では製品の実行時ロジックを変更していない。実機書換え、認証操作、外部サービスへの投稿・署名・リリースは実施せず、これらの動作が再検証済みであるとは扱わない。
- ローカルにこの変更で解決・導入した製品依存はなく、既存の設定・workflowとGitHubの検出済み警告を照合した。Gradle/APK・Python GUI・ブラウザ実動作など、今回実行していない系統の検証や網羅的な依存更新確認は未実施として区別する。

## 2026-10-20: Dependabot 月末一括処理

- `.github/dependabot.yml` は毎月28日00:00（`Asia/Tokyo`）に設定した。このリポジトリには自動マージ workflow がないため、既存の手動確認経路を変更していない。
- YAML 構文、変更差分、空白エラーをローカルで検査した。実際の月末 schedule と Dependabot PR の merge 経路は、次回の毎月28日実行で確認する。
