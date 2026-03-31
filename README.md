# 在庫管理システム

React + AWS を使用したクラウドネイティブな在庫管理Webアプリケーションです。

## デモ

https://main.d3mll0v4b9ovff.amplifyapp.com

## 機能

- **ダッシュボード** - 在庫数グラフ・低在庫アラートの表示
- **商品管理** - 商品の登録・編集・削除・検索・画像アップロード
- **入出庫管理** - 入庫・出庫の記録と履歴表示
- **リアルタイム反映** - 入出庫後に在庫数が自動更新

## 技術スタック

### フロントエンド
| 技術 | 用途 |
|---|---|
| React 18 + TypeScript | UIフレームワーク |
| Vite | ビルドツール |
| Tailwind CSS | スタイリング |
| Recharts | グラフ表示 |
| React Router | ページルーティング |
| Axios | API通信 |

### バックエンド・インフラ（AWS）
| サービス | 用途 |
|---|---|
| AWS Lambda (Node.js) | APIサーバー（サーバーレス） |
| Amazon API Gateway | APIエンドポイント管理 |
| Amazon RDS (MySQL) | データベース |
| Amazon S3 | 商品画像の保存 |
| AWS Amplify | フロントエンドのホスティング・CI/CD |

## AWS構成図

```
ブラウザ
  │
  ├── AWS Amplify（Reactアプリのホスティング）
  │
  └── API Gateway（APIの入口）
        │
        └── Lambda（ビジネスロジック）
              │
              ├── RDS MySQL（商品・在庫データ）
              │
              └── S3（商品画像）
```

## データベース設計

```
categories（カテゴリ）
  - id, name, created_at

products（商品）
  - id, category_id, name, description
  - image_url, stock, alert_stock
  - created_at, updated_at

stock_histories（入出庫履歴）
  - id, product_id, type(in/out)
  - quantity, note, created_at
```

## ローカル開発環境のセットアップ

### 必要なもの
- Node.js 18以上
- AWSアカウント
- MySQL Workbench

### 手順

1. リポジトリをクローン

```bash
git clone https://github.com/Kamisho-1802/inventory-app.git
cd inventory-app
```

2. パッケージをインストール

```bash
npm install
```

3. APIのURLを設定

`src/api/client.ts` の `API_BASE` を自分のAPI GatewayのURLに変更

```ts
const API_BASE = 'https://your-api-id.execute-api.ap-northeast-1.amazonaws.com/prod';
```

4. 起動

```bash
npm run dev
```

### AWS環境のセットアップ

1. **RDS** - MySQL 8.0のインスタンスを作成し、`awssql.sql` のSQLを実行
2. **Lambda** - `lambda-api/` フォルダをZIP圧縮してアップロード
3. **Lambda環境変数** - `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `S3_BUCKET` を設定
4. **API Gateway** - REST APIを作成しLambdaと統合
5. **S3** - 画像保存用バケットを作成しCORSを設定
6. **Amplify** - GitHubリポジトリと連携してデプロイ

## 工夫した点

- **サーバーレス構成** - LambdaとAPI Gatewayを使いサーバー管理不要な構成を採用
- **署名付きURL** - S3への画像アップロードに署名付きURLを使用しセキュリティを確保
- **低在庫アラート** - 商品ごとに閾値を設定し、ダッシュボードで一目で確認できる
- **接続プール** - LambdaのDB接続にコネクションプールを使用し安定性を向上
