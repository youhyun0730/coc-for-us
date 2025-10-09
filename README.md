# Clash of Clans プレイヤー情報ツール

Clash of Clans APIを使用して、身内のプレイヤー情報を一覧表示するシンプルなWebツールです。

## 機能

- プレイヤー情報をカード形式で表示
- トロフィー数で自動ソート
- レスポンシブデザイン対応
- データベース不要（プレイヤータグは環境変数で設定）

## 表示される情報

- プレイヤー名とタグ
- タウンホールレベル
- トロフィー数
- 経験値レベル
- 攻撃勝利数
- 防衛勝利数
- 最高トロフィー
- 戦争スター数
- クラン情報（所属している場合）

## Vercelへのデプロイ

### 1. APIキーの取得

1. [Clash of Clans Developer Portal](https://developer.clashofclans.com/) にアクセス
2. アカウントを作成してログイン
3. 「My Account」→「Create New Key」でAPIキーを作成
   - Name: 任意の名前
   - Description: 任意の説明
   - **IP address: `0.0.0.0/0`** （Vercelの動的IPに対応）

⚠️ **重要**: Vercelはサーバーレス関数が動的IPアドレスから実行されるため、IP制限を `0.0.0.0/0` に設定する必要があります。

### 2. プレイヤータグの確認

Clash of Clansのゲーム内で：
1. プレイヤープロフィールを開く
2. 名前の下に表示されている `#` から始まるタグをコピー
3. メモしておく（`#` は除く）

### 3. Vercelにデプロイ

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

#### 手順:

1. 上のボタンをクリック、またはVercelにログインしてリポジトリをインポート
2. 環境変数を設定:
   - `COC_API_KEY`: 取得したClash of Clans APIキー
   - `COC_PLAYER_TAGS`: プレイヤータグ（カンマ区切り、`#` は除く）
     - 例: `Y88VG2CR8,2PP,ABCD1234`
3. 「Deploy」をクリック

### 4. 環境変数の設定（Vercel Dashboard）

デプロイ後に環境変数を追加・変更する場合:

1. Vercelダッシュボードでプロジェクトを開く
2. 「Settings」→「Environment Variables」
3. 以下の変数を追加:

| Name | Value | 例 |
|------|-------|-----|
| `COC_API_KEY` | Clash of Clans APIキー | `eyJ0eXAiOiJKV...` |
| `COC_PLAYER_TAGS` | プレイヤータグ（カンマ区切り） | `Y88VG2CR8,2PP` |

4. 保存後、再デプロイ

## ローカル開発

### 1. リポジトリをクローン

```bash
git clone <repository-url>
cd coc-for-us
```

### 2. 環境変数を設定

`.env.example` をコピーして `.env` を作成:

```bash
cp .env.example .env
```

`.env` を編集:

```
COC_API_KEY=your_api_key_here
COC_PLAYER_TAGS=Y88VG2CR8,2PP
```

### 3. Vercel CLIで開発サーバーを起動

```bash
# Vercel CLIをインストール（初回のみ）
npm i -g vercel

# 開発サーバーを起動
vercel dev
```

ブラウザで `http://localhost:3000` を開いてください。

## ファイル構成

```
coc-for-us/
├── api/
│   └── players.js      # Vercel Serverless Function
├── index.html          # メインHTMLファイル
├── style.css           # スタイルシート
├── app.js              # フロントエンドロジック
├── vercel.json         # Vercel設定
├── .env.example        # 環境変数テンプレート
├── .gitignore          # Git除外設定
└── README.md           # このファイル
```

## 技術スタック

- **フロントエンド**: HTML, CSS, Vanilla JavaScript
- **バックエンド**: Vercel Serverless Functions (Node.js)
- **API**: Clash of Clans API
- **ホスティング**: Vercel

## アーキテクチャ

```
ブラウザ → Vercel (フロントエンド)
            ↓
         /api/players (Serverless Function)
            ↓
         Clash of Clans API
```

フロントエンドから直接Clash of Clans APIを呼び出すのではなく、Vercel Serverless Functionsを経由することで:
- VercelのIPアドレス制限問題を回避
- APIキーをブラウザに公開しない（セキュリティ向上）
- CORS問題を解決

## 注意事項

- APIキーは公開リポジトリにコミットしないでください
- Clash of Clans APIの利用規約を遵守してください
- 過度なAPIリクエストを避けてください
- IP制限 `0.0.0.0/0` はセキュリティリスクがあるため、必要に応じてAPIキーを定期的に更新してください

## トラブルシューティング

### デプロイ後にプレイヤー情報が表示されない場合

1. Vercelダッシュボードの「Deployments」→最新のデプロイ→「Functions」でログを確認
2. 環境変数 `COC_API_KEY` と `COC_PLAYER_TAGS` が正しく設定されているか確認
3. Clash of Clans APIのIPアドレス制限が `0.0.0.0/0` になっているか確認

### ローカル開発でエラーが出る場合

- `.env` ファイルが作成されているか確認
- `vercel dev` コマンドで起動しているか確認（`http-server` などでは環境変数が読み込まれません）

### APIキーエラーが出る場合

- APIキーが有効か確認
- APIキーのIPアドレス制限を確認（Vercelの場合は `0.0.0.0/0`）

## ライセンス

このプロジェクトは個人利用を目的としています。
