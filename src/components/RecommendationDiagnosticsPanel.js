import React, { useState } from 'react';
import { getRecommendationDiagnostics } from '../lib/recommendationDiagnostics';

const date = value => Number.isFinite(value?.getTime()) ? value.toLocaleString('ja-JP') : '不明';
const percent = value => value == null ? '未推定' : `${(value * 100).toFixed(1)}%`;

export default function RecommendationDiagnosticsPanel({ questions, options, plan, timeBlockedIndexes, checkpoint, currentIndex, presented }) {
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('');
  const [sort, setSort] = useState('probability');
  const rows = getRecommendationDiagnostics(questions, options, { plan, timeBlockedIndexes, checkpoint });
  const groups = rows.reduce((result, row) => ({ ...result, [row.reason]: (result[row.reason] || 0) + 1 }), {});
  const filtered = rows.filter(row => (!reason || row.reason === reason) &&
    `${row.index + 1} ${row.problem} ${row.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === 'due' ? a.due - b.due || a.index - b.index
      : sort === 'presented' ? (presented[b.index] || 0) - (presented[a.index] || 0) || a.index - b.index
        : b.probability - a.probability || a.index - b.index);
  return <section aria-label="出題の診断結果" className="mt-3">
      <p>判定時刻：{date(options.now)} · 次の候補 {rows.filter(row => row.probability > 0).length} 問</p>
      <p>次に選ぶ場合の確率です。現在表示中の問題を選んだ時点の確率ではありません。出題回数はこの画面を開いてからのセッション内です。記憶率は推定値です。</p>
      <div aria-label="出題理由の分布">
        {Object.entries(groups).map(([label, count]) => <div key={label} className="mb-2">
          <span>{label}：{count} 問</span>
          <progress className="d-block w-100" aria-label={label} max={Math.max(1, rows.length)} value={count} />
        </div>)}
      </div>
      <div className="row g-2 my-2">
        <label className="col-12 col-md-4">問題・タグ検索<input className="form-control" value={search} onChange={event => setSearch(event.target.value)} /></label>
        <label className="col-12 col-md-4">出題理由<select className="form-select" value={reason} onChange={event => setReason(event.target.value)}>
          <option value="">すべて</option>{Object.keys(groups).map(label => <option key={label}>{label}</option>)}
        </select></label>
        <label className="col-12 col-md-4">並び順<select className="form-select" value={sort} onChange={event => setSort(event.target.value)}>
          <option value="probability">選択確率順</option><option value="due">FSRS復習予定順</option><option value="presented">出題回数順</option>
        </select></label>
      </div>
      <p>{filtered.length} / {rows.length} 問</p>
      <div className="table-responsive">
        <table className="table table-sm align-middle" style={{ minWidth: 850 }}>
          <caption>全問題の選択確率と除外理由（横スクロール可）</caption>
          <thead><tr>{['問題', '判定', '次の選択確率', '今回の出題回数', '状態 / 評価回数 / 忘却回数', 'FSRS復習予定', '期限付き復習可能時刻', '現在 / 目標日の記憶率'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
          <tbody>{filtered.map(row => <tr key={row.index}>
            <td style={{ minWidth: 180, maxWidth: 320, overflowWrap: 'anywhere' }}>#{row.index + 1}{currentIndex === row.index ? '（表示中）' : ''}<div>{String(row.problem)}</div><small>{row.tags.join(' / ')}</small></td>
            <td>{row.reason}{row.overdue && row.probability === 0 && <div className="text-danger">FSRS期限到来・候補外</div>}</td>
            <td>{percent(row.probability)}</td><td>{presented[row.index] || 0}</td>
            <td>{row.state} / {row.reps} / {row.lapses}</td><td>{row.reps ? date(row.due) : '未学習'}</td>
            <td>{plan ? date(row.availableAt) : '—'}</td><td>{percent(row.retention)} / {percent(row.targetRetention)}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>;
}
