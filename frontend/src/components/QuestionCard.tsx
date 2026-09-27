

import type { AnyQ } from "../types/test";

export default function QuestionCard({ q, index }: { q: AnyQ; index: number }) {
  return (
    <div className="border rounded p-4">
      <div className="text-sm opacity-70 mb-1">
        Q{index} · {q.type}
      </div>
      <h2 className="font-medium">{q.title}</h2>
      {q.body && <p className="mt-1 whitespace-pre-wrap">{q.body}</p>}

      {q.type === "true_false" && (
        <div className="mt-3 flex gap-2">
          <button className="border px-3 py-1 rounded">True</button>
          <button className="border px-3 py-1 rounded">False</button>
        </div>
      )}

      {q.type === "mcq" && (
        <ul className="mt-3 list-disc pl-6">
          {q.options.map((o) => (
            <li key={o.option_id}>{o.option_text}</li>
          ))}
        </ul>
      )}

      {q.type === "programming" && (
        <pre className="mt-3 p-3 rounded bg-black/5 overflow-auto">
          {q.starter_code || "// no starter code"}
        </pre>
      )}
    </div>
  );
}
