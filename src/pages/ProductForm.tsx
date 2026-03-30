import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Category, Product } from '../api/client';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    category_id: 0,
    name: '',
    description: '',
    stock: 0,
    alert_stock: 10,
  });

  useEffect(() => {
    api.getCategories().then((res) => setCategories(res.data));
    if (isEdit) {
      api.getProducts().then((res) => {
        const product = res.data.find((p: Product) => p.id === Number(id));
        if (product) {
          setForm({
            category_id: product.category_id,
            name: product.name,
            description: product.description,
            stock: product.stock,
            alert_stock: product.alert_stock,
          });
        }
      });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      await api.updateProduct(Number(id), form);
    } else {
      await api.createProduct(form);
    }
    navigate('/products');
  };

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">
        {isEdit ? '商品を編集' : '商品を新規登録'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">カテゴリ</label>
          <select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}
            className="border rounded px-3 py-2 w-full"
          >
            <option value={0}>選択してください</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">商品名</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">説明</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border rounded px-3 py-2 w-full"
            rows={3}
          />
        </div>

        {!isEdit && (
          <div>
            <label className="block text-sm font-medium mb-1">初期在庫数</label>
            <input
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">低在庫アラート閾値</label>
          <input
            type="number"
            min={0}
            value={form.alert_stock}
            onChange={(e) => setForm({ ...form, alert_stock: Number(e.target.value) })}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div className="flex gap-3 mt-2">
          <button
            type="submit"
            className="bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800"
          >
            {isEdit ? '更新' : '登録'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="border px-6 py-2 rounded hover:bg-gray-100"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
