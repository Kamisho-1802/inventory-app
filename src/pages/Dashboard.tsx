import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Product } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);

  const load = () => api.getProducts().then((res) => setProducts(res.data));

  useEffect(() => {
    load();
  }, []);

  const lowStock = products.filter((p) => p.stock <= p.alert_stock);
  const chartData = products.map((p) => ({ name: p.name, 在庫数: p.stock }));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <button
          onClick={load}
          className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
        >
          更新
        </button>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">総商品数</p>
          <p className="text-3xl font-bold text-blue-700">{products.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">低在庫商品</p>
          <p className="text-3xl font-bold text-red-500">{lowStock.length}</p>
        </div>
      </div>

      {/* グラフ */}
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <h2 className="text-lg font-bold mb-4">在庫数グラフ</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="在庫数" fill="#1d4ed8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 低在庫アラート */}
      {lowStock.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold mb-4 text-red-500">低在庫アラート</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2">商品名</th>
                <th className="text-left p-2">在庫数</th>
                <th className="text-left p-2">閾値</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{p.name}</td>
                  <td className="p-2 text-red-500 font-bold">{p.stock}</td>
                  <td className="p-2">{p.alert_stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
