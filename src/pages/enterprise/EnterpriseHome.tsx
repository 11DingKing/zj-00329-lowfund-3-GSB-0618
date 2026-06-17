import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Files,
  FileText,
  CheckCircle2,
  Wallet,
  CircleDollarSign,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '../../store';
import FundProgress from '../../components/FundProgress';
import StatusBadge from '../../components/StatusBadge';
import DirectionIcon from '../../components/DirectionIcon';
import { formatAmount, formatDate, directionLabel } from '../../utils/format';
import type { Application } from '../../../shared/types';

interface StatsData {
  total: number;
  approved: number;
  inDisbursement: number;
  totalReceived: number;
}

export default function EnterpriseHome() {
  const { user, fundPool, loadFundPool, setApplications, getApplications } = useAppStore();
  const companyName = 'companyName' in (user || {}) ? (user as { companyName?: string })?.companyName : '';
  const contactPerson = 'contactPerson' in (user || {}) ? (user as { contactPerson?: string })?.contactPerson : '';

  useEffect(() => {
    loadFundPool();
    fetch('/api/applications')
      .then((r) => r.json())
      .then((res) => {
        if (res.code === 0 && res.data) {
          setApplications(res.data);
        }
      })
      .catch(() => {});
  }, [loadFundPool, setApplications]);

  const { stats, recentApps } = useMemo(() => {
    const all = getApplications();
    const s: StatsData = {
      total: all.length,
      approved: 0,
      inDisbursement: 0,
      totalReceived: 0,
    };
    all.forEach((app) => {
      if (app.status === 'approved' || app.status === 'in_disbursement' || app.status === 'completed') {
        s.approved++;
      }
      if (app.status === 'in_disbursement') {
        s.inDisbursement++;
      }
      if (app.milestones) {
        app.milestones.forEach((m) => {
          if (m.status === 'paid') s.totalReceived += m.amount;
        });
      }
    });
    const recent = [...all]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 3);
    return { stats: s, recentApps: recent };
  }, [getApplications]);

  const totalAmount = fundPool ? fundPool.total / 10000 : 50000;
  const usedAmount = fundPool ? fundPool.approvedTotal / 10000 : 0;
  const disbursedAmount = fundPool ? fundPool.disbursedTotal / 10000 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">企业工作台</h1>
        <p className="text-slate-500 mt-1">欢迎回来，您可以在此查看申报进度和发起新申请。</p>
      </div>

      <div className="card overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-6 p-6 md:p-8">
          <div className="flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold mb-4 w-fit">
              <CheckCircle2 size={14} />
              账号已认证
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-navy-800 mb-2 leading-tight">
              您好，{contactPerson || '用户'}
            </h2>
            <div className="text-lg text-slate-600 mb-6">{companyName || '—'}</div>
            <p className="text-slate-500 leading-relaxed max-w-md">
              感谢您对低空经济产业发展的关注与参与。您可以在此申请产业扶持基金，
              实时跟踪审批进度，规范管理里程碑拨付。让我们共同推动产业高质量发展。
            </p>
          </div>
          <div className="flex items-center justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-navy-100 via-teal-50 to-transparent rounded-full opacity-60 blur-2xl" />
              <div className="relative">
                <FundProgress total={totalAmount} used={usedAmount} disbursed={disbursedAmount} size={260} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-hover p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center">
              <FileText size={18} className="text-navy-600" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-navy-800 mb-1">{stats.total}</div>
          <div className="text-sm text-slate-500">我的申报数</div>
        </div>
        <div className="card-hover p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-navy-800 mb-1">{stats.approved}</div>
          <div className="text-sm text-slate-500">已立项</div>
        </div>
        <div className="card-hover p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <Wallet size={18} className="text-teal-600" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-navy-800 mb-1">{stats.inDisbursement}</div>
          <div className="text-sm text-slate-500">拨付中</div>
        </div>
        <div className="card-hover p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <CircleDollarSign size={18} className="text-amber-600" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-navy-800 mb-1">
            {stats.totalReceived > 0 ? formatAmount(stats.totalReceived / 10000) : '0'}
          </div>
          <div className="text-sm text-slate-500">累计到账</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/enterprise/apply" className="card-hover p-6 md:p-7 block group">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-navy-600 to-navy-700 shadow-lg shadow-navy-600/25 flex items-center justify-center flex-shrink-0">
                <Plus size={26} className="text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-navy-800 mb-1">新建申报</div>
                <div className="text-sm text-slate-500 leading-relaxed">
                  发起新的产业基金申请，填写企业信息、扶持方向与佐证材料
                </div>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-300 group-hover:text-navy-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </div>
        </Link>
        <Link to="/enterprise/applications" className="card-hover p-6 md:p-7 block group">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg shadow-teal-500/25 flex items-center justify-center flex-shrink-0">
                <Files size={26} className="text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-navy-800 mb-1">查看全部申报</div>
                <div className="text-sm text-slate-500 leading-relaxed">
                  管理所有申报记录，查看详情、审批进度与里程碑拨付情况
                </div>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-300 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </div>
        </Link>
      </div>

      <div className="card p-6 md:p-7">
        <div className="flex items-center justify-between mb-5">
          <h3 className="section-title">
            <FileText size={20} className="text-navy-600" />
            最近申报
          </h3>
          <Link to="/enterprise/applications" className="text-sm text-navy-600 hover:text-navy-700 font-semibold inline-flex items-center gap-1">
            查看全部
            <ChevronRight size={14} />
          </Link>
        </div>

        {recentApps.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <FileText size={28} className="text-slate-300" />
            </div>
            <div className="text-slate-500 mb-4">暂无申报记录</div>
            <Link to="/enterprise/apply" className="btn-primary">
              <Plus size={16} />
              发起第一笔申报
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 md:-mx-7 px-6 md:px-7">
            <div className="min-w-full">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">申报方向</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">状态</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">申请金额</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">核定金额</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">提交日期</th>
                    <th className="py-3 px-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentApps.map((app: Application) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-navy-50 flex items-center justify-center flex-shrink-0">
                            <DirectionIcon direction={app.direction} size={16} className="text-navy-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-navy-800 text-sm truncate">
                              {directionLabel(app.direction)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-4 px-3 text-right">
                        <div className="font-semibold text-slate-700 text-sm">
                          {formatAmount(app.requestedAmount / 10000)}
                        </div>
                      </td>
                      <td className="py-4 px-3 text-right">
                        <div className={`font-semibold text-sm ${app.approvedAmount ? 'text-teal-700' : 'text-slate-300'}`}>
                          {app.approvedAmount ? formatAmount(app.approvedAmount / 10000) : '—'}
                        </div>
                      </td>
                      <td className="py-4 px-3 text-right text-sm text-slate-500 hidden sm:table-cell">
                        {formatDate(app.submittedAt)}
                      </td>
                      <td className="py-4 px-3 text-right">
                        <Link
                          to={`/enterprise/applications/${app.id}`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-navy-600 hover:text-navy-700"
                        >
                          详情
                          <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
