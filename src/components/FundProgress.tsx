import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatAmount } from '../utils/format';

interface FundProgressProps {
  total: number;
  used: number;
  disbursed: number;
  size?: number;
}

export default function FundProgress({ total, used, disbursed, size = 280 }: FundProgressProps) {
  const remaining = total - used;
  const usedPercent = total > 0 ? ((used / total) * 100).toFixed(1) : '0';
  const disbursedPercent = total > 0 ? ((disbursed / total) * 100).toFixed(1) : '0';

  const outerData = [
    { name: '已立项', value: used },
    { name: '剩余', value: remaining },
  ];

  const innerData = [
    { name: '已拨付', value: disbursed },
    { name: '未拨付', value: used - disbursed },
  ];

  const COLORS_OUTER = ['#0B3D91', '#EAF1FB'];
  const COLORS_INNER = ['#00D4AA', '#E0F7F1'];

  const center = size / 2;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={outerData}
            cx="50%"
            cy="50%"
            innerRadius={center * 0.65}
            outerRadius={center * 0.95}
            dataKey="value"
            stroke="none"
            startAngle={90}
            endAngle={-270}
          >
            {outerData.map((_, index) => (
              <Cell key={`outer-${index}`} fill={COLORS_OUTER[index % COLORS_OUTER.length]} />
            ))}
          </Pie>
          <Pie
            data={innerData}
            cx="50%"
            cy="50%"
            innerRadius={center * 0.32}
            outerRadius={center * 0.58}
            dataKey="value"
            stroke="none"
            startAngle={90}
            endAngle={-270}
          >
            {innerData.map((_, index) => (
              <Cell key={`inner-${index}`} fill={COLORS_INNER[index % COLORS_INNER.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-xs text-slate-500 mb-1">剩余额度</div>
        <div className="text-xl font-bold text-navy-800 font-display">
          {formatAmount(remaining)}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          剩余 {usedPercent}% 立项 / {disbursedPercent}% 拨付
        </div>
      </div>
    </div>
  );
}
