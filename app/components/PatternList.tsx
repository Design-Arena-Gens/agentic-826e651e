import type { AnalysisItem } from "@/utils/patterns";

export function PatternList({ items }: { items: AnalysisItem[] }) {
  return (
    <div>
      <div className="row" style={{marginBottom: 8}}>
        <div className="label">Detected patterns</div>
        <span className="badge">{items.length}</span>
      </div>
      <div className="list">
        {items.length === 0 && <div className="hint">No notable patterns detected yet. Try loading different data.</div>}
        {items.map((p, idx) => (
          <div key={idx} className="list-item">
            <div style={{fontWeight: 600}}>{p.name} <span className="badge" style={{marginLeft: 8}}>{p.type}</span></div>
            <div className="hint">{p.explanation}</div>
            <div className="hint">Window: {p.window.startIndex} ? {p.window.endIndex}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
