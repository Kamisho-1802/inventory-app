import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
});

export const handler = async (event) => {
  const method = event.httpMethod;
  const path   = event.path;

  try {
    // 商品一覧取得
    if (method === 'GET' && path === '/products') {
      const [rows] = await pool.query(`
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.created_at DESC
      `);
      return response(200, rows);
    }

    // 商品登録
    if (method === 'POST' && path === '/products') {
      const { category_id, name, description, stock, alert_stock } = JSON.parse(event.body);
      const [result] = await pool.query(
        'INSERT INTO products (category_id, name, description, stock, alert_stock) VALUES (?, ?, ?, ?, ?)',
        [category_id, name, description, stock ?? 0, alert_stock ?? 10]
      );
      return response(201, { id: result.insertId });
    }

    // 商品更新
    if (method === 'PUT' && path.startsWith('/products/')) {
      const id = path.split('/')[2];
      const { category_id, name, description, alert_stock } = JSON.parse(event.body);
      await pool.query(
        'UPDATE products SET category_id=?, name=?, description=?, alert_stock=? WHERE id=?',
        [category_id, name, description, alert_stock, id]
      );
      return response(200, { message: 'updated' });
    }

    // 商品削除
    if (method === 'DELETE' && path.startsWith('/products/')) {
      const id = path.split('/')[2];
      await pool.query('DELETE FROM stock_histories WHERE product_id=?', [id]);
      await pool.query('DELETE FROM products WHERE id=?', [id]);
      return response(200, { message: 'deleted' });
    }

    // カテゴリ一覧
    if (method === 'GET' && path === '/categories') {
      const [rows] = await pool.query('SELECT * FROM categories ORDER BY name');
      return response(200, rows);
    }

    // 入出庫登録
    if (method === 'POST' && path === '/stock-histories') {
      const { product_id, type, quantity, note } = JSON.parse(event.body);
      await pool.query(
        'INSERT INTO stock_histories (product_id, type, quantity, note) VALUES (?, ?, ?, ?)',
        [product_id, type, quantity, note]
      );
      const diff = type === 'in' ? quantity : -quantity;
      await pool.query('UPDATE products SET stock = stock + ? WHERE id = ?', [diff, product_id]);
      return response(201, { message: 'recorded' });
    }

    // 入出庫履歴取得
    if (method === 'GET' && path === '/stock-histories') {
      const [rows] = await pool.query(`
        SELECT sh.*, p.name as product_name
        FROM stock_histories sh
        LEFT JOIN products p ON sh.product_id = p.id
        ORDER BY sh.created_at DESC
        LIMIT 100
      `);
      return response(200, rows);
    }

    return response(404, { message: 'Not Found' });

  } catch (err) {
    console.error(err);
    return response(500, { message: err.message });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: { 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body),
});
