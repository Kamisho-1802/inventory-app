-- ローカル開発用スキーマ + シードデータ
-- README に書かれていた awssql.sql はリポジトリに存在しなかったため、
-- README のデータベース設計セクションから起こしたもの。

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS categories (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NULL,
  name        VARCHAR(255) NOT NULL,
  description TEXT NULL,
  image_url   VARCHAR(1024) NULL,
  stock       INT NOT NULL DEFAULT 0,
  alert_stock INT NOT NULL DEFAULT 10,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS stock_histories (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  type       ENUM('in','out') NOT NULL,
  quantity   INT NOT NULL,
  note       VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_stock_histories_product (product_id),
  INDEX idx_stock_histories_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ▼ ここから先はログイン機能用の「提案」です。
--   実装方針に合わせて自由に変更してください。
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,   -- bcrypt ハッシュ。平文は絶対に入れないこと
  name          VARCHAR(100) NOT NULL,
  role          ENUM('admin','staff') NOT NULL DEFAULT 'staff',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------
-- シードデータ（動作確認用）
-- ------------------------------------------------------------------
INSERT INTO categories (id, name) VALUES
  (1, '文房具'),
  (2, '飲料'),
  (3, 'PC周辺機器'),
  (4, 'オフィス家具'),
  (5, '清掃用品'),
  (6, '梱包資材'),
  (7, '電池・照明'),
  (8, '防災用品'),
  (9, '食品')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 低在庫（stock <= alert_stock）の商品を各カテゴリに散らしてあります。
-- ダッシュボードの低在庫アラートと、商品一覧の赤字表示の確認用。
INSERT INTO products (id, category_id, name, description, stock, alert_stock) VALUES
  -- 文房具
  ( 1, 1, 'ボールペン（黒）',       '0.5mm 油性',          120,  30),
  ( 2, 1, 'コピー用紙 A4',          '500枚入り',             8,  20),  -- 低在庫
  ( 3, 1, '付箋 75×75mm',           '混色 5冊パック',       42,  15),
  ( 4, 1, 'クリアファイル A4',      '100枚入り',            60,  20),
  -- 飲料
  ( 5, 2, '緑茶 500ml',             'ケース販売 24本',      48,  24),
  ( 6, 2, 'ミネラルウォーター 2L',  'ケース販売 6本',       15,  20),  -- 低在庫
  ( 7, 2, 'インスタントコーヒー',   '業務用 500g',           7,   5),
  -- PC周辺機器
  ( 8, 3, 'USB-C ケーブル',         '1m PD対応',             3,  10),  -- 低在庫
  ( 9, 3, 'ワイヤレスマウス',       '静音タイプ',           25,   5),
  (10, 3, 'HDMIケーブル 2m',        '4K対応',               18,   8),
  (11, 3, 'USBメモリ 32GB',         'USB3.0',                4,  10),  -- 低在庫
  -- オフィス家具
  (12, 4, '事務椅子',               'キャスター付き',        6,   3),
  (13, 4, '折りたたみ机',           '幅120cm',               2,   3),  -- 低在庫
  -- 清掃用品
  (14, 5, 'ゴミ袋 45L',             '100枚入り',            30,  20),
  (15, 5, '除菌ウェットシート',     '詰替用',               12,  15),  -- 低在庫
  -- 梱包資材
  (16, 6, '段ボール箱 M',           '10枚セット',           55,  25),
  (17, 6, '養生テープ',             '50mm×25m',             24,  10),
  -- 電池・照明
  (18, 7, '単三電池',               '20本パック',           40,  15),
  (19, 7, 'LED蛍光灯 40W形',        '昼白色',                5,   6),  -- 低在庫
  -- 防災用品
  (20, 8, '非常用保存水 500ml',     '5年保存 24本',         96,  48),
  (21, 8, '携帯用救急セット',       '20点入り',              3,   5),  -- 低在庫
  -- 食品
  (22, 9, '個包装クッキー',         '来客用 50個入り',      20,  10),
  (23, 9, 'カップ麺 詰め合わせ',    '非常食兼用 12食',       9,  12)   -- 低在庫
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 履歴は日時をばらしてあります（一覧が新しい順に並ぶことの確認用）。
-- 上の在庫数を積み上げた完全な台帳ではなく、直近の動きのサンプルです。
INSERT INTO stock_histories (product_id, type, quantity, note, created_at) VALUES
  ( 1, 'in',  100, '定期発注',             DATE_SUB(NOW(), INTERVAL 21 DAY)),
  ( 5, 'in',   48, '定期発注',             DATE_SUB(NOW(), INTERVAL 18 DAY)),
  (16, 'in',   60, '期末補充',             DATE_SUB(NOW(), INTERVAL 15 DAY)),
  ( 2, 'out',  12, '営業部へ払い出し',     DATE_SUB(NOW(), INTERVAL 12 DAY)),
  (20, 'in',   96, '防災訓練前の補充',     DATE_SUB(NOW(), INTERVAL 10 DAY)),
  ( 8, 'out',   7, '検証用に貸出',         DATE_SUB(NOW(), INTERVAL  9 DAY)),
  (18, 'in',   40, '定期発注',             DATE_SUB(NOW(), INTERVAL  8 DAY)),
  (11, 'out',   6, '新入社員セットアップ', DATE_SUB(NOW(), INTERVAL  7 DAY)),
  (14, 'out',  10, '各フロアへ配布',       DATE_SUB(NOW(), INTERVAL  6 DAY)),
  (22, 'in',   30, '来客対応用',           DATE_SUB(NOW(), INTERVAL  5 DAY)),
  (15, 'out',   8, '共用部へ補充',         DATE_SUB(NOW(), INTERVAL  4 DAY)),
  (13, 'out',   2, '会議室へ移動',         DATE_SUB(NOW(), INTERVAL  3 DAY)),
  ( 3, 'in',   30, '定期発注',             DATE_SUB(NOW(), INTERVAL  2 DAY)),
  (19, 'out',   4, '3F 照明交換',          DATE_SUB(NOW(), INTERVAL  1 DAY)),
  ( 6, 'out',   9, '休憩室へ補充',         DATE_SUB(NOW(), INTERVAL  6 HOUR));
