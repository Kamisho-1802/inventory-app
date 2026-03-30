import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Product, StockHistory as StockHistoryType } from '../api/client';

export default function StockHistory() {
  const navigate = useNavigate();
  const [histories, setHistories] = useState<StockHistoryType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    product_id: 0,
    type: 'in' as 'in' | 'out',
    quantity: 1,
    note: '',
  });

  const load = () => {
    api.getStockHistories().then((res) => setHistories(res.data));
    api.getProducts().then((res) => setProducts(res.data));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_id) return alert('商品を選択してください');
    await api.createStockHistory(form);
    navigate('/');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">入出庫管理</h1>

      {/* 入出庫フォーム */}
      <div className="bg-white rounded-lg shadow p-6 mb-8 max-w-lg">
        <h2 className="text-lg font-bold mb-4">入出庫を記録</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">商品</label>
            <select
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: Number(e.target.value) })}
              className="border rounded px-3 py-2 w-full"
            >
              <option value={0}>選択してください</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}（在庫: {p.stock}）</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">種別</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as 'in' | 'out' })}
              className="border rounded px-3 py-2 w-full"
            >
              <option value="in">入庫</option>
              <option value="out">出庫</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">数量</label>
            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              className="border rounded px-3 py-2 w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">メモ</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="border rounded px-3 py-2 w-full"
              placeholder="任意"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800"
          >
            記録する
          </button>
        </form>
      </div>

      {/* 履歴一覧 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-lg font-bold p-4 border-b">履歴</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-3">日時</th>
              <th className="text-left p-3">商品名</th>
              <th className="text-left p-3">種別</th>
              <th className="text-left p-3">数量</th>
              <th className="text-left p-3">メモ</th>
            </tr>
          </thead>
          <tbody>
            {histories.map((h) => (
              <tr key={h.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{new Date(h.created_at).toLocaleString('ja-JP')}</td>
                <td className="p-3">{h.product_name}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${h.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {h.type === 'in' ? '入庫' : '出庫'}
                  </span>
                </td>
                <td className="p-3">{h.quantity}</td>
                <td className="p-3">{h.note}</td>
              </tr>
            ))}
            {histories.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-400">
                  履歴がありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
