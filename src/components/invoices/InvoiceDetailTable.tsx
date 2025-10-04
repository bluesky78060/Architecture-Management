import type { InvoiceItem } from '../../types/domain';

type Props = {
  items: InvoiceItem[];
  format: (n: number) => string;
  totalAmount?: number; // optional override for footer total
};

export default function InvoiceDetailTable({ items, format, totalAmount }: Props) {
  const sum = (items || []).reduce((s, it) => {
    const q = Number(it.quantity) || 0;
    const u = Number(it.unitPrice) || 0;
    const t = it.total != null ? Number(it.total) : q * u;
    return s + (isNaN(t) ? 0 : t);
  }, 0);

  return (
    <table className="w-full border text-sm">
      <thead className="bg-gray-50">
        <tr>
          <th className="border px-3 py-2 text-center w-12">연번</th>
          <th className="border px-3 py-2 text-center w-24">일자</th>
          <th className="border px-3 py-2 text-center w-[26rem]">내용</th>
          <th className="border px-3 py-2 text-center w-16">수량</th>
          <th className="border px-3 py-2 text-center w-16">단위</th>
          <th className="border px-3 py-2 text-right w-28">단가</th>
          <th className="border px-3 py-2 text-right w-32">합계</th>
          <th className="border px-3 py-2 text-left w-36">비고</th>
        </tr>
      </thead>
      <tbody>
        {(items || []).map((it, i) => {
          const category = it.category || '';
          const desc = it.description || '';
          const laborPersonsGeneral = typeof it.laborPersonsGeneral === 'number' ? it.laborPersonsGeneral : 0;
          const laborUnitRateGeneral = typeof it.laborUnitRateGeneral === 'number' ? it.laborUnitRateGeneral : 0;
          const laborPersons = typeof it.laborPersons === 'number' ? it.laborPersons : 0;
          const laborUnitRate = typeof it.laborUnitRate === 'number' ? it.laborUnitRate : 0;
          const gen = laborPersonsGeneral * laborUnitRateGeneral;
          const sk = laborPersons * laborUnitRate;
          const laborTotal = gen + sk;
          const totalFallback = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
          const lineTotal = Number(it.total ?? totalFallback) || totalFallback;

          return (
            <tr key={i} className="align-top">
              <td className="border px-3 py-2 text-center">{i + 1}</td>
              <td className="border px-3 py-2 text-center">{it.date || ''}</td>
              <td className="border px-3 py-2">
                <div>
                  <div className="font-medium text-gray-900 text-left">{it.name}</div>
                  {category && (
                    <div className="mt-1 text-right">
                      <span className="inline-block text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{category}</span>
                    </div>
                  )}
                </div>
                {desc && (
                  <div className="text-xs text-gray-600 mt-1 whitespace-pre-line break-words leading-relaxed">{desc}</div>
                )}
                {laborTotal > 0 && (
                  <div className="text-xs text-blue-600 mt-1">
                    <span className="font-medium">인부임:</span>{' '}
                    {[
                      gen > 0 ? `일반: ${laborPersonsGeneral}명 × ${laborUnitRateGeneral.toLocaleString()}원` : null,
                      sk > 0 ? `숙련: ${laborPersons}명 × ${laborUnitRate.toLocaleString()}원` : null,
                    ].filter(Boolean).join(', ')} = {laborTotal.toLocaleString()}원
                  </div>
                )}
              </td>
              <td className="border px-3 py-2 text-center">{it.quantity}</td>
              <td className="border px-3 py-2 text-center">{it.unit || ''}</td>
              <td className="border px-3 py-2 text-right">{format(Number(it.unitPrice) || 0)}원</td>
              <td className="border px-3 py-2 text-right">{format(lineTotal)}원</td>
              <td className="border px-2 py-2 w-36 text-xs">{it.notes || ''}</td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr className="bg-gray-50">
          <td className="border px-3 py-2 text-right font-semibold" colSpan={6}>총 금액</td>
          <td className="border px-3 py-2 text-right font-bold">{format(Number(totalAmount ?? sum))}원</td>
          <td className="border px-3 py-2"></td>
        </tr>
      </tfoot>
    </table>
  );
}

