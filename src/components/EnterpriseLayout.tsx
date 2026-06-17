import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Building2, Plus, Files, Home, LogOut, User } from 'lucide-react';
import { useAppStore } from '../store';

export default function EnterpriseLayout() {
  const { user, logout } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
      isActive
        ? 'bg-navy-600 text-white shadow-lg shadow-navy-600/25'
        : 'text-slate-600 hover:bg-navy-50 hover:text-navy-700'
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="container mx-auto px-6">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-600 to-teal-500 flex items-center justify-center shadow-lg shadow-navy-600/25">
                  <Building2 size={22} className="text-white" />
                </div>
                <div>
                  <div className="font-bold text-navy-800 text-lg leading-tight">低空经济产业基金</div>
                  <div className="text-xs text-slate-500">企业端 · 申报管理平台</div>
                </div>
              </div>
              <nav className="flex items-center gap-2">
                <NavLink to="/enterprise" end className={navLinkClass}>
                  <Home size={16} />
                  <span>首页</span>
                </NavLink>
                <NavLink to="/enterprise/apply" className={navLinkClass}>
                  <Plus size={16} />
                  <span>新建申报</span>
                </NavLink>
                <NavLink to="/enterprise/applications" className={navLinkClass}>
                  <Files size={16} />
                  <span>申报列表</span>
                </NavLink>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-navy-800 leading-tight">
                    {'companyName' in (user || {}) ? (user as { companyName?: string })?.companyName : '企业用户'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {'contactPerson' in (user || {}) ? (user as { contactPerson?: string })?.contactPerson : ''}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                title="退出登录"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-6 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        © 2025 低空经济产业基金管理系统 · 企业端
      </footer>
    </div>
  );
}
