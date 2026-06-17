import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  SearchCheck,
  Wallet,
  PiggyBank,
  LogOut,
  User,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '../store';

const menuItems = [
  { to: '/reviewer', icon: LayoutDashboard, label: '工作台', end: true },
  { to: '/reviewer/review', icon: SearchCheck, label: '申报评审' },
  { to: '/reviewer/disbursement', icon: Wallet, label: '拨付审核' },
  { to: '/reviewer/fund-pool', icon: PiggyBank, label: '基金池' },
];

const breadcrumbMap: Record<string, string> = {
  '/reviewer': '工作台',
  '/reviewer/review': '申报评审',
  '/reviewer/disbursement': '拨付审核',
  '/reviewer/fund-pool': '基金池',
};

export default function ReviewerLayout() {
  const { user, logout } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getBreadcrumbs = () => {
    const path = location.pathname;
    const label = breadcrumbMap[path] || '评审系统';
    return ['评审系统', label];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 flex-shrink-0 bg-gradient-to-b from-navy-900 to-navy-800 text-white flex flex-col">
        <div className="px-6 py-6 border-b border-navy-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
              <SearchCheck size={22} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">评审管理</div>
              <div className="text-xs text-navy-300">基金监管平台</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/15 text-white shadow-inner border-l-4 border-teal-400'
                      : 'text-navy-200 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t border-navy-700/50">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">
                {'name' in (user || {}) ? (user as { name?: string })?.name : '评审管理员'}
              </div>
              <div className="text-xs text-navy-300">平台管理员</div>
            </div>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {idx > 0 && <ChevronRight size={14} className="text-slate-300" />}
                <span
                  className={
                    idx === breadcrumbs.length - 1
                      ? 'text-navy-800 font-semibold'
                      : 'text-slate-400'
                  }
                >
                  {crumb}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <LogOut size={16} />
            <span>退出</span>
          </button>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
