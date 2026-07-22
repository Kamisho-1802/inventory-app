# ローカル開発環境

AWS（RDS / Lambda / API Gateway / S3）を使わずに、このアプリをローカルだけで動かすための環境です。
**`src/` と `lambda-api/` のコードは一切変更していません。**

## 何をしているか

```
ブラウザ (Vite :5173)
      │
      ▼
local-dev/server.mjs (:3000)          ← Express。API Gateway の代わり
      │  ├─ リクエストを API Gateway のイベント形式に変換
      │  ├─ /upload-url と画像保存は S3 の代わりにローカルファイル
      │  ▼
lambda-api/index.mjs                  ← 本物の Lambda ハンドラーを無変更で実行
      │
      ▼
127.0.0.2:3306 (TCPプロキシ) ─→ 127.0.0.1:3307 ─→ MySQL 8.0 (Docker)
```

ビジネスロジックは `lambda-api/index.mjs` の一箇所だけなので、
**ここでの動作確認がそのまま Lambda の動作確認になります。**
ログイン機能を `index.mjs` に実装すれば、すぐこの環境でテストできます。

## 起動手順

```bash
cd local-dev
npm install          # 初回のみ
npm run db:up        # MySQL を起動（Docker）
npm start            # API サーバーを起動（:3000）
```

別のターミナルでフロントを起動：

```bash
npm run dev          # プロジェクトルートで。:5173
```

## npm スクリプト

| コマンド | 内容 |
|---|---|
| `npm run db:up` | MySQL コンテナを起動 |
| `npm run db:down` | 停止（データは残る） |
| `npm run db:reset` | **データを消して**初期状態に戻す（schema.sql を再適用） |
| `npm start` | API サーバー起動 |
| `npm run dev` | API サーバー起動（ファイル変更で自動再起動） |

`lambda-api/index.mjs` を編集しながら開発するときは `npm run dev` が便利です。

## シードデータ

`schema.sql` に動作確認用のデータが入っています。

| テーブル | 件数 | 内容 |
|---|---|---|
| categories | 9 | 文房具 / 飲料 / PC周辺機器 / オフィス家具 / 清掃用品 / 梱包資材 / 電池・照明 / 防災用品 / 食品 |
| products | 23 | 全カテゴリに 2〜4 件ずつ。うち **9件が低在庫**（`stock <= alert_stock`） |
| stock_histories | 15 | 直近3週間に日時を散らしてある（新しい順の並びを確認できる） |

低在庫の商品は各カテゴリに散らしてあるので、ダッシュボードの低在庫アラートと
商品一覧の赤字表示をそのまま確認できます。

データを初期状態に戻したいときは `npm run db:reset` を実行してください。

## DB に直接つなぐ

```bash
docker exec -it inventory-db mysql -uroot -plocaldevpass inventory
```

MySQL Workbench などから繋ぐ場合：`127.0.0.1` / ポート `3307` / user `root` / pass `localdevpass` / DB `inventory`

## ポートについて（なぜ 3307 と 127.0.0.2 が出てくるのか）

この PC では **3306 を別プロジェクトの `laravel-db` コンテナが `0.0.0.0` で占有**しています。
そのため Docker は 3306 を使えず、MySQL は 3307 に出しています。

一方 `lambda-api/index.mjs` の `mysql.createPool()` は**ポートを指定していない**ので、
mysql2 のデフォルトである 3306 に繋ぎに行きます。

この差を埋めるため、`server.mjs` が `127.0.0.2:3306 → 127.0.0.1:3307` の
TCP プロキシを張っています。`index.mjs` を書き換えずに済ませるための措置です。

> **改善案**: `index.mjs` の `createPool()` に
> `port: Number(process.env.DB_PORT ?? 3306),` を足せば、このプロキシは不要になります。
> ポートを設定で変えられるようにするのは本番でも有用なので、いずれ入れることを勧めます。

## 注意

- `uploads/` と `node_modules/` は `.gitignore` 済みです
- `schema.sql` の `users` テーブルはログイン機能用の**提案**です。設計に合わせて変えてください
- パスワードはすべてローカル開発専用のダミーです。本番では絶対に使わないでください
