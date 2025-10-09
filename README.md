# Clash of Clans プレイヤー情報ツール

Clash of Clans APIを使用して、身内のプレイヤー情報を一覧表示するシンプルなWebツールです。

## 機能

- プレイヤー情報をカード形式で表示
- トロフィー数で自動ソート
- レスポンシブデザイン対応
- データベース不要（プレイヤータグは環境変数で設定）
- **動的トークン生成対応** - IPアドレス制限の問題を解決

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

## 技術的な特徴

このプロジェクトは **clashofclans.js** ラッパーを使用しています。これにより:

- ✅ **IPアドレスの制限なし** - 動的にトークンを生成
- ✅ **Vercelで動作** - サーバーレス環境でも問題なし
- ✅ **セキュア** - APIキーをブラウザに公開しない
- ✅ **自動トークン管理** - メールアドレスとパスワードで認証

## Vercelへのデプロイ

### 前提条件

[Clash of Clans Developer Portal](https://developer.clashofclans.com/) でアカウントを作成してください。
**APIキーを手動で作成する必要はありません**（自動生成されます）。

### デプロイ手順

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. 上のボタンをクリック、またはVercelにリポジトリをインポート
2. 環境変数を設定:

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `COC_EMAIL` | Clash of Clans Developer Portalのメールアドレス | `your@email.com` |
| `COC_PASSWORD` | Clash of Clans Developer Portalのパスワード | `yourpassword` |
| `COC_PLAYER_TAGS` | プレイヤータグ（カンマ区切り、`#`不要） | `Y88VG2CR8,2PP` |

3. 「Deploy」をクリック

### 環境変数の設定（Vercel Dashboard）

デプロイ後に環境変数を追加・変更する場合:

1. Vercelダッシュボードでプロジェクトを開く
2. 「Settings」→「Environment Variables」
3. 上記の変数を追加
4. 保存後、再デプロイ

## ローカル開発

### 1. リポジトリをクローン

```bash
git clone <repository-url>
cd coc-for-us
```

### 2. 依存関係をインストール

```bash
npm install
```

### 3. 環境変数を設定

`.env.example` をコピーして `.env` を作成:

```bash
cp .env.example .env
```

`.env` を編集:

```env
COC_EMAIL=your_email@example.com
COC_PASSWORD=your_password
COC_PLAYER_TAGS=P92VRU2PV,QJULRC90U,2Q9V9PRCL
```

### 4. 開発サーバーを起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

## プレイヤータグの確認方法

Clash of Clansのゲーム内で:

1. プレイヤープロフィールを開く
2. 名前の下に表示されている `#` から始まるタグをコピー
3. `.env` または Vercel の環境変数に `#` を除いて追加
   - 例: `#P92VRU2PV` → `P92VRU2PV`

## ファイル構成

```
coc-for-us/
├── api/
│   └── players.js      # Vercel Serverless Function
├── index.html          # メインHTMLファイル
├── style.css           # スタイルシート
├── app.js              # フロントエンドロジック
├── package.json        # Node.js依存関係
├── vercel.json         # Vercel設定
├── .env.example        # 環境変数テンプレート
├── .gitignore          # Git除外設定
└── README.md           # このファイル
```

## 技術スタック

- **フロントエンド**: HTML, CSS, Vanilla JavaScript
- **バックエンド**: Vercel Serverless Functions (Node.js)
- **API**: Clash of Clans API
- **ラッパー**: [clashofclans.js](https://www.npmjs.com/package/clashofclans.js)
- **ホスティング**: Vercel

## アーキテクチャ

```
ブラウザ → Vercel (フロントエンド)
            ↓
         /api/players (Serverless Function)
            ↓
    clashofclans.js ラッパー
    （動的トークン生成）
            ↓
         Clash of Clans API
```

### なぜラッパーを使うのか？

Clash of Clans APIは**固定IPアドレス**からのリクエストのみを許可します。

- ❌ **問題**: Vercelのサーバーレス関数は動的IPを使用
- ✅ **解決**: `clashofclans.js` ラッパーが自動的にトークンを生成・更新
  - メールアドレスとパスワードで認証
  - 現在のIPアドレスに対応したトークンを自動作成
  - トークンの有効期限管理も自動

## セキュリティ

- ✅ 環境変数を使用（パスワードをコードにハードコードしない）
- ✅ APIキーをブラウザに公開しない
- ✅ バックエンドAPIでプロキシ
- ⚠️ `.env` ファイルは `.gitignore` に含まれています（コミットしないでください）

## 注意事項

- Clash of Clans Developer Portalのメールアドレスとパスワードを環境変数に設定してください
- パスワードは公開リポジトリにコミットしないでください
- Clash of Clans APIの利用規約を遵守してください
- 過度なAPIリクエストを避けてください

## トラブルシューティング

### デプロイ後にプレイヤー情報が表示されない

1. Vercelダッシュボードの「Deployments」→ 最新のデプロイ → 「Functions」でログを確認
2. 環境変数が正しく設定されているか確認:
   - `COC_EMAIL`
   - `COC_PASSWORD`
   - `COC_PLAYER_TAGS`
3. Clash of Clans Developer Portalのメールアドレス/パスワードが正しいか確認

### ローカル開発でエラーが出る

- `.env` ファイルが作成されているか確認
- `npm install` を実行したか確認
- `npm run dev`（`vercel dev`）で起動しているか確認

### "Failed to fetch player data" エラー

- プレイヤータグが正しいか確認（`#` は除く）
- Clash of Clans Developer Portalのアカウントが有効か確認
- ブラウザのコンソールで詳細なエラーメッセージを確認

### "COC_EMAIL and COC_PASSWORD must be set" エラー

- 環境変数 `COC_EMAIL` と `COC_PASSWORD` が設定されているか確認
- Vercelの場合: Settings → Environment Variables で確認

## 参考リンク

- [Clash of Clans Developer Portal](https://developer.clashofclans.com/)
- [clashofclans.js ドキュメント](https://clashofclans.js.org/)
- [Clash of Clans API Discord](https://discord.gg/clashapi) - API関連のサポート

## ライセンス

このプロジェクトは個人利用を目的としています。
