import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import styles from "./ProgrammingPage.module.css";

type QuestionDetail = {
  question_id: number;
  title: string | null;
  body: string;
  question_type: "mcq" | "true_false" | "programming";
  starter_code?: string | null;
  created_at?: string;
};

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export default function ProgrammingPage() {
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API}/questions/programming/random`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as QuestionDetail;
        if (cancelled) return;
        setQuestion(data);
        setCode(data.starter_code ?? `// Type your code here\n`);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? "Failed to load question");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className={styles.container}>Loading…</div>;
  if (error) return <div className={styles.container} style={{ color: "crimson" }}>Error: {error}</div>;
  if (!question) return <div className={styles.container} style={{ color: "crimson" }}>Not found</div>;

  const editorLanguage = "cpp";

  return (
    <div className={styles.container}>
      <PanelGroup direction="horizontal">
        <Panel defaultSize={50} minSize={20}>
          <div className={styles.leftPanel}>
            <h2>{question.title ?? "Untitled question"}</h2>
            <p className={styles.bodyText}>{question.body}</p>
          </div>
        </Panel>

        <PanelResizeHandle className={styles.resizeHandle} />

        <Panel defaultSize={50} minSize={20}>
          <div className={styles.editorWrapper}>
            <Editor
              height="100%"
              defaultLanguage={editorLanguage}
              value={code}
              onChange={(value) => setCode(value ?? "")}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                automaticLayout: true,
                quickSuggestions: true,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: "on",
                tabCompletion: "on",
                wordBasedSuggestions: "allDocuments",
                readOnly: false,
              }}
            />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}


/*
import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import "./App.css";

type QuestionDetail = {
  question_id: number;
  title: string | null;
  body: string;
  question_type: "mcq" | "true_false" | "programming";
  starter_code?: string | null;
  created_at?: string;
};

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export default function App() {
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API}/questions/programming/random`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as QuestionDetail;

        if (cancelled) return;

        setQuestion(data);
        setCode(data.starter_code ?? `// Type your code here\n`);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? "Failed to load question");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="app-container" style={{ padding: 16 }}>Loading…</div>;
  }
  if (error) {
    return (
      <div className="app-container" style={{ padding: 16, color: "crimson" }}>
        Error: {error}
      </div>
    );
  }
  if (!question) {
    return (
      <div className="app-container" style={{ padding: 16, color: "crimson" }}>
        Not found
      </div>
    );
  }

  const editorLanguage = "cpp";

  return (
    <div className="app-container">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={50} minSize={20}>
          <div className="left-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>{question.title ?? "Untitled question"}</h2>
            </div>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {question.body}
            </p>
          </div>
        </Panel>

        <PanelResizeHandle className="resize-handle" />

        <Panel defaultSize={50} minSize={20}>
          <div className="editor-wrapper">
            <Editor
              height="100%"
              defaultLanguage={editorLanguage}
              value={code}
              onChange={(value) => setCode(value ?? "")}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                automaticLayout: true,
                quickSuggestions: true,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: "on",
                tabCompletion: "on",
                wordBasedSuggestions: "allDocuments",
                readOnly: false,
              }}
            />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
*/