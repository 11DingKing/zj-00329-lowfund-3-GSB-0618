import { useNavigate } from 'react-router-dom';
import { Building2, ClipboardCheck, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../store';

export default function RoleSelect() {
  const { setRole } = useAppStore();
  const navigate = useNavigate();

  const handleSelect = (role: 'enterprise' | 'reviewer') => {
    setRole(role);
    navigate(role === 'enterprise' ? '/enterprise' : '/reviewer');
  };

  return (
    <div className="min-h-screen flex flex-col hero-mesh">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-5xl">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-navy-600 to-teal-500 shadow-2xl shadow-navy-600/25 flex items-center justify-center">
                <ShieldCheck size={28} className="text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-navy-800 font-display mb-3">
              低空经济产业基金 <span className="gradient-text">· 园区5亿元</span>
            </h1>
            <p className="text-slate-500 text-base md:text-lg">产业升级扶持资金 · 专业化申报与评审管理平台</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <button
              onClick={() => handleSelect('enterprise')}
              className="group relative text-left overflow-hidden rounded-3xl bg-white p-8 md:p-10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-cardHover"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #ffffff 100%)',
                border: '1px solid transparent',
                backgroundClip: 'padding-box',
              }}
            >
              <div
                className="absolute inset-0 rounded-3xl pointer-events-none opacity-100 group-hover:opacity-100 transition-opacity"
                style={{
                  padding: '1px',
                  background: 'linear-gradient(135deg, #0B3D91 0%, #1E6FD9 50%, #00D4AA 100%)',
                  WebkitMask:
                    'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }}
              />
              <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-60 group-hover:scale-110 transition-transform duration-500"
                style={{ background: 'radial-gradient(circle, rgba(11,61,145,0.12), transparent 70%)' }}
              />
              <div className="relative z-10">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shadow-lg shadow-navy-600/25 mb-6 md:mb-8"
                  style={{ background: 'linear-gradient(135deg, #1E6FD9 0%, #0B3D91 100%)' }}
                >
                  <Building2 size={32} className="text-white md:w-9 md:h-9" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-navy-800 mb-2 md:mb-3">企业用户</h2>
                <p className="text-slate-500 mb-6 md:mb-8 leading-relaxed text-base md:text-[15px]">
                  提交产业基金申请、在线跟踪审批进度、管理里程碑拨付、查看基金使用全貌
                </p>
                <div className="inline-flex items-center gap-2 text-navy-600 font-semibold text-base group-hover:gap-3 transition-all">
                  <span>进入企业工作台</span>
                  <ArrowRight size={18} />
                </div>
              </div>
            </button>

            <button
              onClick={() => handleSelect('reviewer')}
              className="group relative text-left overflow-hidden rounded-3xl bg-white p-8 md:p-10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-cardHover"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #ffffff 100%)',
                border: '1px solid transparent',
                backgroundClip: 'padding-box',
              }}
            >
              <div
                className="absolute inset-0 rounded-3xl pointer-events-none opacity-100 group-hover:opacity-100 transition-opacity"
                style={{
                  padding: '1px',
                  background: 'linear-gradient(135deg, #00D4AA 0%, #0DB39E 50%, #0F766E 100%)',
                  WebkitMask:
                    'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }}
              />
              <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-60 group-hover:scale-110 transition-transform duration-500"
                style={{ background: 'radial-gradient(circle, rgba(0,212,170,0.12), transparent 70%)' }}
              />
              <div className="relative z-10">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/25 mb-6 md:mb-8"
                  style={{ background: 'linear-gradient(135deg, #00D4AA 0%, #0F766E 100%)' }}
                >
                  <ClipboardCheck size={32} className="text-white md:w-9 md:h-9" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-navy-800 mb-2 md:mb-3">评审管理员</h2>
                <p className="text-slate-500 mb-6 md:mb-8 leading-relaxed text-base md:text-[15px]">
                  申报材料初审、组织专家评审、立项额度决策、里程碑拨付、基金池动态监管
                </p>
                <div className="inline-flex items-center gap-2 text-teal-600 font-semibold text-base group-hover:gap-3 transition-all">
                  <span>进入评审管理台</span>
                  <ArrowRight size={18} />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="pb-10 pt-4 text-center">
        <div className="inline-flex items-center gap-3 text-sm text-slate-400">
          <span>申报透明</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>评审公正</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>拨付规范</span>
        </div>
      </div>
    </div>
  );
}
