import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Category, Product } from '../api/client';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    category_id: 0,
    name: '',
    description: '',
    stock: 0,
    alert_stock: 10,
    image_url: '',
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
            image_url: product.image_url,
          });
          if (product.image_url) setImagePreview(product.image_url);
        }
      });
    }
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    let image_url = form.image_url;

    if (imageFile) {
      const { data } = await api.getUploadUrl(imageFile.name, imageFile.type);
      await fetch(data.url, {
        method: 'PUT',
        body: imageFile,
        headers: { 'Content-Type': imageFile.type },
      });
      image_url = data.imageUrl;
    }

    const payload = { ...form, image_url };

    if (isEdit) {
      await api.updateProduct(Number(id), payload);
    } else {
      await api.createProduct(payload);
    }

    setUploading(false);
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

        <div>
          <label className="block text-sm font-medium mb-1">商品画像</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="border rounded px-3 py-2 w-full"
          />
          {imagePreview && (
            <img src={imagePreview} alt="プレビュー" className="mt-2 h-32 object-contain rounded border" />
          )}
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
            disabled={uploading}
            className="bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800 disabled:opacity-50"
          >
            {uploading ? 'アップロード中...' : isEdit ? '更新' : '登録'}
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
