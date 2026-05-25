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

問題データは、問題オブジェクトを並べたJSON配列です。JSONファイルを読み込む場合は、ファイル全体が次のような配列になっている必要があります。

```json
[
  {
    "summary": "HTTPステータスコードの基本",
    "problem": "成功を表すHTTPステータスコードはどれですか？",
    "options": ["200", "301", "404", "500"],
    "answer": [1],
    "explanation": "200 OK はリクエストが成功したことを表します。",
    "type": "mcq",
    "tags": ["web", "http"],
    "card": {
      "due": "2026-05-25T13:16:21.353Z",
      "stability": 0,
      "difficulty": 0,
      "elapsed_days": 0,
      "scheduled_days": 0,
      "reps": 0,
      "lapses": 0,
      "state": 0
    },
    "random": false
  }
]
```

### 全体フォーマット

- ルート要素は配列です。
- 配列の各要素が1問分の問題オブジェクトです。
- JSONとして正しい形式である必要があります。コメント、末尾カンマ、シングルクォートは使えません。
- アプリからエクスポートしたJSONには、問題本文だけでなくFSRSの学習履歴も含まれます。
- 手書きで新規作成する場合、`card` は省略できます。読み込み時に未学習状態のカードが自動作成されます。

### フィールド一覧

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `summary` | string | 任意 | 編集画面の一覧に表示する問題の短いタイトルです。省略時は空文字になります。 |
| `problem` | string | 推奨 | 問題文です。Markdown、HTML、KaTeX数式を利用できます。 |
| `options` | string[] または null | 問題形式による | 選択肢です。`mcq`、`mrq`、`order` では2件以上を推奨します。`word` では `null` または空配列で構いません。 |
| `answer` | number[] または string | 必須 | 正答です。問題形式によって型と意味が変わります。詳しくは「問題形式ごとの書き方」を参照してください。 |
| `explanation` | string | 任意 | 回答後に表示する解説です。Markdown、HTML、KaTeX数式を利用できます。 |
| `type` | string | 任意 | 問題形式です。`mcq`、`mrq`、`order`、`word` のいずれかを指定します。省略時は `mcq` として扱われます。 |
| `tags` | string[] | 任意 | 出題時の絞り込みに使うタグです。省略時は空配列になります。 |
| `card` | object | 任意 | FSRSの学習履歴です。省略時は未学習状態のカードが自動作成されます。 |
| `random` | boolean | 任意 | `true` にすると出題時に選択肢の表示順をシャッフルします。省略時は `false` です。 |

### 問題形式ごとの書き方

#### 単一選択問題: `mcq`

1つだけ正解がある選択問題です。

- `type`: `"mcq"`
- `options`: 選択肢の配列
- `answer`: 正解の選択肢番号を1つだけ入れた配列
- 選択肢番号は0始まりではなく、1始まりです。

```json
{
  "summary": "HTTP 200",
  "problem": "成功を表すHTTPステータスコードはどれですか？",
  "options": ["200", "301", "404", "500"],
  "answer": [1],
  "explanation": "`200 OK` は成功レスポンスです。",
  "type": "mcq",
  "tags": ["web", "http"],
  "random": true
}
```

この例では、`options[0]` の `"200"` が正解なので `answer` は `[1]` です。

#### 複数選択問題: `mrq`

複数の正解がある選択問題です。

- `type`: `"mrq"`
- `options`: 選択肢の配列
- `answer`: 正解の選択肢番号をすべて入れた配列
- 回答時は、選んだ番号の集合が `answer` と完全一致した場合に正解になります。

```json
{
  "summary": "JavaScriptのプリミティブ",
  "problem": "JavaScriptのプリミティブ型をすべて選んでください。",
  "options": ["string", "number", "Array", "boolean"],
  "answer": [1, 2, 4],
  "explanation": "`Array` はオブジェクトです。",
  "type": "mrq",
  "tags": ["javascript"],
  "random": false
}
```

この例では、`string`、`number`、`boolean` が正解です。

#### 並べ替え問題: `order`

選択肢を正しい順番に並べる問題です。

- `type`: `"order"`
- `options`: 並べ替え対象の配列
- `answer`: 正しい順序で選択肢番号を並べた配列
- 選択肢番号は1始まりです。

```json
{
  "summary": "HTTPリクエストの流れ",
  "problem": "一般的なHTTP通信の流れを正しい順番に並べてください。",
  "options": ["レスポンスを受け取る", "リクエストを送る", "画面に反映する"],
  "answer": [2, 1, 3],
  "explanation": "まずリクエストを送り、レスポンスを受け取り、最後に画面へ反映します。",
  "type": "order",
  "tags": ["web", "http"],
  "random": false
}
```

この例では、表示上の選択肢2、1、3の順に選ぶと正解です。

#### 単語入力問題: `word`

テキスト入力で答える問題です。

- `type`: `"word"`
- `options`: `null` または空配列
- `answer`: 正解文字列
- 入力値と `answer` が完全一致した場合に正解になります。大文字小文字、空白、全角半角の違いも区別されます。

```json
{
  "summary": "Reactの状態管理",
  "problem": "Reactでコンポーネント内の状態を扱う基本的なHook名は？",
  "options": null,
  "answer": "useState",
  "explanation": "`useState` は関数コンポーネントで状態を扱うためのHookです。",
  "type": "word",
  "tags": ["react"],
  "random": false
}
```

### Markdownと数式

`problem`、`options`、`explanation` はMarkdownとして表示されます。

利用できる主な記法:

- 見出し、箇条書き、太字、インラインコード、コードブロック
- GitHub Flavored Markdownの表
- HTMLタグ
- KaTeXによる数式

例:

```json
{
  "summary": "二次方程式",
  "problem": "次の式の解を考えます。\n\n$$x^2 - 4 = 0$$",
  "options": ["$x = 2$", "$x = -2$", "$x = \\pm 2$"],
  "answer": [3],
  "explanation": "$$x^2 = 4$$ より、解は $x = \\pm 2$ です。",
  "type": "mcq",
  "tags": ["math"],
  "random": false
}
```

JSON文字列内で改行を書く場合は `\n` を使います。バックスラッシュを含む数式を書く場合は、JSONのエスケープ規則に従って `\\` のように書く必要があります。

### FSRSの `card`

`card` は復習スケジューリング用の学習履歴です。手作業で問題を作るだけなら省略して構いません。省略時は次のような未学習状態が自動で補われます。

```json
{
  "due": "2026-05-25T13:16:21.353Z",
  "stability": 0,
  "difficulty": 0,
  "elapsed_days": 0,
  "scheduled_days": 0,
  "reps": 0,
  "lapses": 0,
  "state": 0
}
```

各項目の意味:

| フィールド | 説明 |
| --- | --- |
| `due` | 次回復習予定日時です。ISO 8601形式の日時文字列として保存されます。 |
| `stability` | 記憶の安定度です。FSRSが更新します。 |
| `difficulty` | 問題の難しさです。FSRSが更新します。 |
| `elapsed_days` | 前回レビューからの経過日数です。 |
| `scheduled_days` | 次回レビューまでの日数です。 |
| `reps` | レビュー回数です。0なら未学習として扱われます。 |
| `lapses` | 忘却、または失敗した回数です。 |
| `state` | FSRS内部のカード状態です。 |
| `last_review` | レビュー後に追加されることがある最終レビュー日時です。 |

アプリは、`reps` が `0` の問題を未学習として優先出題します。`reps` が `1` 以上の場合は、`due` が現在時刻以前になった問題を復習対象として出題します。

### 読み込み時の補完ルール

JSON読み込み時、足りない項目は次のように補われます。

| 項目 | 補完値 |
| --- | --- |
| `problem` | `""` |
| `options` | `[]` |
| `answer` | `""` |
| `explanation` | `""` |
| `type` | `"mcq"` |
| `summary` | `""` |
| `deleted` | `false` |
| `tags` | `[]` |
| `card` | 未学習状態のFSRSカード |
| `random` | `false` |

ただし、補完されるからといって全ての問題が有効になるわけではありません。実際に解ける問題にするには、問題形式に合った `options` と `answer` を指定してください。

### 書き出し時のルール

アプリからJSONを書き出すと、各問題は次の項目だけを含みます。

- `problem`
- `options`
- `answer`
- `explanation`
- `type`
- `summary`
- `tags`
- `card`
- `random`

編集画面で削除した問題は内部的には `deleted: true` になりますが、JSON書き出し時には除外されます。そのため、エクスポートしたJSONには `deleted` は含まれません。

### Firebase保存時の形式

Firestoreには `questionSets` コレクションへ、次の形式のドキュメントとして保存します。

```json
{
  "name": "問題セット名",
  "questions": [
    {
      "summary": "HTTPステータスコードの基本",
      "problem": "成功を表すHTTPステータスコードはどれですか？",
      "options": ["200", "301", "404", "500"],
      "answer": [1],
      "explanation": "200 OK はリクエストが成功したことを表します。",
      "type": "mcq",
      "tags": ["web", "http"],
      "card": {
        "due": "2026-05-25T13:16:21.353Z",
        "stability": 0,
        "difficulty": 0,
        "elapsed_days": 0,
        "scheduled_days": 0,
        "reps": 0,
        "lapses": 0,
        "state": 0
      },
      "random": false
    }
  ],
  "updatedAt": "Firestore server timestamp"
}
```

JSONファイルとして読み書きする場合は、Firestore用の外側の `name`、`questions`、`updatedAt` は不要です。JSONファイルでは `questions` の中身、つまり問題オブジェクトの配列だけを書きます。

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
