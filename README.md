# learning-app

[![GitHub Pages](https://img.shields.io/static/v1?label=GitHub+Pages&message=+&color=brightgreen&logo=github)](https://kanpurin.github.io/learning-app/)

FSRS (Free Spaced Repetition Scheduler) を使った、ブラウザ上で動く学習用クイズアプリです。問題を作成・編集し、JSONやFirebaseに保存しながら、タグや復習タイミングに応じて出題できます。

## 主な機能

- 複数形式のクイズに対応
  - 単一選択問題
  - 複数選択問題
  - 並べ替え問題
  - 単語入力問題
- FSRSによる復習スケジューリング
  - 未学習の問題を優先して出題
  - 復習期限が来た問題を出題
  - 回答後に「もう一回」「難しい」「普通」「簡単」で記憶状態を更新
  - 短期記憶モード、長期記憶モード、無限出題モードを選択可能
- タグによる出題範囲の絞り込み
  - 問題にタグを付与
  - クイズ開始時にタグを選んで対象問題をフィルタ
- 問題の作成・編集・削除
  - アプリ上で新しい問題を作成
  - 既存問題の本文、選択肢、正答、解説、タグを編集
  - 問題の削除フラグ管理
  - 未保存の編集がある状態でクイズへ戻ることを防止
- JSONファイルの読み込み・書き出し
  - 問題データと学習履歴をJSONとしてインポート
  - 現在の問題データをJSONとしてダウンロード
  - 削除済み問題はエクスポート対象から除外
- Firebase連携
  - Googleログイン
  - Firestore上の問題セット一覧を読み込み
  - 問題セットの新規保存
  - 既存問題セットへの上書き保存
- ブラウザ内のローカル保存
  - IndexedDB (Dexie) に問題、ファイル名、選択中タブを保存
  - ページを再読み込みしても作業状態を復元
- Markdown表示
  - 問題文、選択肢、解説をMarkdownで表示
  - GitHub Flavored Markdown、改行、HTML、数式表示(KaTeX)に対応
- 選択肢のランダム表示
  - 問題ごとに選択肢のシャッフルを設定可能

## 画面構成

- クイズ: 記憶モードとタグを選んで問題を解きます。
- 作成: 問題形式を選び、新しい問題を追加します。
- 編集: 登録済み問題を一覧から開いて編集・削除します。
- サイドバー: JSONの読み込み・保存、Googleログイン、Firebaseの読み書きを行います。

## 問題データ

問題データはJSON配列として扱います。主な項目は次の通りです。

```json
{
  "summary": "問題の概要",
  "problem": "問題文",
  "options": ["選択肢1", "選択肢2"],
  "answer": [1],
  "explanation": "解説",
  "type": "mcq",
  "tags": ["tag"],
  "card": {},
  "random": false
}
```

`type` には `mcq`、`mrq`、`order`、`word` を指定します。`card` にはFSRSの学習履歴が保存されます。

## 開発

```bash
npm install
npm start
```

ビルド:

```bash
npm run build
```

テスト:

```bash
npm test
```
