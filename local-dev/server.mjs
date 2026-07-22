/**
 * ローカル開発用 API サーバー
 *
 * lambda-api/index.mjs の handler を「一切変更せずに」ローカルで動かすための
 * 薄いアダプタです。Express のリクエストを API Gateway (REST API) の
 * イベント形式に変換して handler に渡し、戻り値を HTTP レスポンスに戻します。
 *
 * → ビジネスロジックの実装は lambda-api/index.mjs 一箇所のままなので、
 *   ここでの動作確認がそのまま Lambda の動作確認になります。
 *   ログイン機能を index.mjs に足せば、このサーバー経由で即テストできます。
 *
 * S3 が無いので、画像アップロード（署名付きURL）だけはローカルの
 * ファイル保存でエミュレートしています。
 */
import express from 'express';
import net from 'node:net';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT ?? 3000);
const ORIGIN = `http://localhost:${PORT}`;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// ── DB 用 TCP プロキシ 127.0.0.2:3306 -> 127.0.0.1:3307 ──────────
// index.mjs の mysql.createPool() はポートを指定しておらず mysql2 の
// デフォルト 3306 に繋ぎに行く。一方 3306 は別プロジェクトが占有中で
// Docker が使えない。index.mjs を書き換えずに済ませるため、
// ここで 127.0.0.2:3306 を受けて実体の 3307 へ横流しする。
// （Windows は 0.0.0.0 バインドより具体的 IP のバインドを優先するので共存できる）
const DB_PROXY_HOST = '127.0.0.2';
const DB_REAL_PORT = Number(process.env.DB_REAL_PORT ?? 3307);

function startDbProxy() {
  return new Promise((resolve, reject) => {
    const proxy = net.createServer((client) => {
      const upstream = net.connect(DB_REAL_PORT, '127.0.0.1');
      client.pipe(upstream);
      upstream.pipe(client);
      const drop = () => { client.destroy(); upstream.destroy(); };
      client.on('error', drop);
      upstream.on('error', drop);
    });
    proxy.on('error', reject);
    proxy.listen(3306, DB_PROXY_HOST, () => resolve(proxy));
  });
}

try {
  await startDbProxy();
  console.log(`db proxy       : ${DB_PROXY_HOST}:3306 -> 127.0.0.1:${DB_REAL_PORT}`);
} catch (err) {
  console.error(`db proxy failed to start: ${err.message}`);
  console.error('MySQL が起動しているか確認してください: cd local-dev && npm run db:up');
  process.exit(1);
}

// ── handler を import する「前」に環境変数を設定する ───────────────
// index.mjs はモジュール読み込み時に mysql.createPool() を実行するため、
// 静的 import だと環境変数が間に合わない。だから動的 import を使う。
process.env.DB_HOST ??= '127.0.0.2';
process.env.DB_USER ??= 'root';
process.env.DB_PASS ??= 'localdevpass';
process.env.DB_NAME ??= 'inventory';
process.env.S3_BUCKET ??= 'local-dev-bucket';
// ログイン機能を実装するときに使う想定。ローカル専用のダミー値。
// 本番では必ず Lambda の環境変数に別の長いランダム文字列を設定すること。
process.env.JWT_SECRET ??= 'local-dev-only-secret-do-not-use-in-production';
process.env.AWS_REGION ??= 'ap-northeast-1';
// SDK が認証情報を探しに行って固まらないようダミーを入れておく
process.env.AWS_ACCESS_KEY_ID ??= 'local';
process.env.AWS_SECRET_ACCESS_KEY ??= 'local';

const { handler } = await import('../lambda-api/index.mjs');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();

// ── CORS ────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── S3 代替：アップロード先とファイル配信 ─────────────────────────
// 署名付きURLの PUT を受ける口
app.put('/local-upload/:key(*)', express.raw({ type: '*/*', limit: '25mb' }), (req, res) => {
  const dest = path.join(UPLOAD_DIR, path.basename(req.params.key));
  fs.writeFileSync(dest, req.body);
  console.log(`  [upload] saved ${path.basename(dest)} (${req.body.length} bytes)`);
  res.sendStatus(200);
});
// 保存した画像を配信する口
app.use('/uploads', express.static(UPLOAD_DIR));

// ── 本体：Lambda handler に委譲 ──────────────────────────────────
app.use(express.json({ limit: '5mb' }));

app.all(/.*/, async (req, res) => {
  // /upload-url だけは S3 を呼ぶため、ローカルでは差し替える
  if (req.method === 'POST' && req.path === '/upload-url') {
    const key = `${Date.now()}-${req.body?.filename ?? 'file'}`;
    console.log(`POST /upload-url -> 200 (local stub)`);
    return res.json({
      url: `${ORIGIN}/local-upload/${encodeURIComponent(key)}`,
      imageUrl: `${ORIGIN}/uploads/${encodeURIComponent(key)}`,
    });
  }

  // Express のリクエスト → API Gateway REST API のイベント形式
  const event = {
    httpMethod: req.method,
    path: req.path,
    headers: req.headers,
    queryStringParameters: Object.keys(req.query).length ? req.query : null,
    pathParameters: null,
    body:
      req.body && Object.keys(req.body).length > 0
        ? JSON.stringify(req.body)
        : null,
    isBase64Encoded: false,
    // 本番で Cognito/Lambda オーソライザーを使う場合ここに claims が入る。
    // 自前 JWT 方式なら handler 内で Authorization ヘッダーを検証するので未使用。
    requestContext: { identity: { sourceIp: req.ip }, authorizer: null },
  };

  try {
    const result = await handler(event);
    const status = result?.statusCode ?? 500;
    for (const [k, v] of Object.entries(result?.headers ?? {})) {
      // CORS はこのサーバー側で既に付けているので上書きさせない
      if (k.toLowerCase().startsWith('access-control-')) continue;
      res.set(k, v);
    }
    console.log(`${req.method} ${req.path} -> ${status}`);
    res.status(status);
    res.type('application/json').send(result?.body ?? '');
  } catch (err) {
    console.error(`${req.method} ${req.path} -> handler threw:`, err);
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`local API      : ${ORIGIN}`);
  console.log(`DB             : ${process.env.DB_USER}@${process.env.DB_HOST}/${process.env.DB_NAME}`);
  console.log(`lambda handler : ../lambda-api/index.mjs (無変更でそのまま実行)`);
});
