import { Link, useLocation } from 'react-router-dom';

const links = [
  { to: '/', label: 'ダッシュボード' },
  { to: '/products', label: '商品管理' },
  { to: '/stock-history', label: '入出庫履歴' },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="bg-blue-700 text-white px-6 py-3 flex items-center gap-6">
      <span className="font-bold text-lg mr-4">在庫管理システム</span>
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className={`hover:underline ${location.pathname === link.to ? 'underline font-bold' : ''}`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
