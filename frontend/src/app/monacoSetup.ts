// src/monacoSetup.ts
// Manual Monaco worker setup for Vite using ESM workers (Vite's ?worker)
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

// these imports use Vite's worker loader to create worker constructors
// the ?worker suffix tells Vite to bundle them as separate worker files.
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// Provide Monaco with a getWorker function that returns the right worker
// depending on the label (typescript/javascript vs default editor).
(self as any).MonacoEnvironment = {
  getWorker: function (_moduleId: string, label: string) {
    if (label === 'typescript' || label === 'javascript') {
      return new TsWorker();
    }
    return new EditorWorker();
  },
};

export default monaco;
