import React, { lazy, Suspense, useState } from 'react';

const DiagnosticsPanel = lazy(() => import('./RecommendationDiagnosticsPanel'));

export default function RecommendationDiagnostics(props) {
  const [open, setOpen] = useState(false);
  return <details className="container my-3" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>出題の診断</summary>
    {open && <Suspense fallback={<p role="status">診断を読み込み中…</p>}>
      <DiagnosticsPanel {...props} />
    </Suspense>}
  </details>;
}
