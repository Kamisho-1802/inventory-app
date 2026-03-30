import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Product } from '../api/client';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

  const load = () => api.getProducts().then((res) => setProducts(res.data));

  useEffect(() => { load(); }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return;
    await api.deleteProduct(id);
    load();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <Link
          to="/products/new"
          className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
        >
          + 新規登録
        </Link>
      </div>

      <input
        type="text"
        placeholder="商品名で検索..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border rounded px-3 py-2 mb-4 w-full max-w-sm"
      />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-3">商品名</th>
              <th className="text-left p-3">カテゴリ</th>
              <th className="text-left p-3">在庫数</th>
              <th className="text-left p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.category_name ?? '-'}</td>
                <td className={`p-3 font-bold ${p.stock <= p.alert_stock ? 'text-red-500' : ''}`}>
                  {p.stock}
                </td>
                <td className="p-3 flex gap-2">
                  <Link
                    to={`/products/${p.id}/edit`}
                    className="text-blue-600 hover:underline"
                  >
                    編集
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-500 hover:underline"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-400">
                  商品がありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
