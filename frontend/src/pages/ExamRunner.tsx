import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import type { ExamState, Question, AnswerPayload } from '../types/exam';

const ExamRunner = () => {
  const [exam, setExam] = useState<ExamState | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  
  // Τοπική κατάσταση για τις απαντήσεις (για να φαίνονται άμεσα στο UI)
  const [answers, setAnswers] = useState<Record<number, any>>({});
  
  // Κατάσταση αποθήκευσης (για να δείχνουμε "Saving..." ή "Saved")
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Φόρτωση εξέτασης κατά την είσοδο
  useEffect(() => {
    const loadExam = async () => {
      try {
        // Ξεκινάμε ή συνεχίζουμε (Resume) το τεστ με ID 1 (παράδειγμα)
        const res = await api.get('/test/start?test_id=1');
        setExam(res.data.dto); // Υποθέτω ότι επιστρέφει dto με questions
        // TODO: Εδώ πρέπει να φορτώσεις και τις παλιές απαντήσεις αν είναι Resume
      } catch (err) {
        console.error("Failed to load exam", err);
      }
    };
    loadExam();
  }, []);

  // --- Η ΛΟΓΙΚΗ ΤΟΥ AUTOSAVE ---
  const saveAnswer = async (qId: number, payload: AnswerPayload) => {
    if (!exam) return;
    setSaveStatus('saving');

    try {
      await api.patch(`/submissions/${exam.submission_id}/answers`, payload);
      setSaveStatus('saved');
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  // Debounce Wrapper: Περιμένει 1 δευτερόλεπτο πριν καλέσει το saveAnswer
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAnswerChange = (qId: number, value: any, type: string) => {
    // 1. Ενημέρωσε το UI αμέσως
    setAnswers(prev => ({ ...prev, [qId]: value }));

    // 2. Ετοίμασε το Payload ανάλογα με τον τύπο
    let payload: AnswerPayload = { question_id: qId };
    if (type === 'programming') payload.code_answer = value;
    if (type === 'true_false') payload.tf_answer = value;
    if (type === 'mcq') payload.mcq_option_ids = [value];

    // 3. Clear το προηγούμενο χρονόμετρο (αν γράφει γρήγορα)
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // 4. Βάλε νέο χρονόμετρο
    timeoutRef.current = setTimeout(() => {
      saveAnswer(qId, payload);
    }, 1000); // Σώζει 1 δευτερόλεπτο αφού σταματήσει να πληκτρολογεί
  };

  const handleSubmitExam = async () => {
     if(!exam) return;
     if(confirm("Είστε σίγουροι; Δεν θα μπορείτε να αλλάξετε τις απαντήσεις.")) {
         const res = await api.post(`/submissions/${exam.submission_id}/submit`);
         alert(`Τέλος! Βαθμός: ${res.data.result.auto_grade}`);
         // Redirect ή εμφάνιση αποτελεσμάτων
     }
  };

  if (!exam) return <div>Loading Exam...</div>;
  const question = exam.questions[currentQIndex];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Ερώτηση {currentQIndex + 1} / {exam.questions.length}</h2>
        <span>Status: {saveStatus === 'saving' ? '⏳ Saving...' : '✅ Saved'}</span>
      </div>

      <div style={{ border: '1px solid #ccc', padding: 20, margin: '20px 0' }}>
        <h3>{question.title}</h3>
        <div dangerouslySetInnerHTML={{ __html: question.body }} />

        {/* --- PROGRAMMING UI --- */}
        {question.question_type === 'programming' && (
          <textarea
            rows={10}
            style={{ width: '100%', fontFamily: 'monospace' }}
            value={answers[question.question_id] || question.starter_code || ''}
            onChange={(e) => handleAnswerChange(question.question_id, e.target.value, 'programming')}
          />
        )}

        {/* --- MCQ UI --- */}
        {question.question_type === 'mcq' && question.options?.map(opt => (
          <div key={opt.option_id}>
            <label>
              <input
                type="radio"
                name={`q-${question.question_id}`}
                checked={answers[question.question_id] === opt.option_id}
                onChange={() => handleAnswerChange(question.question_id, opt.option_id, 'mcq')}
              />
              {opt.option_text}
            </label>
          </div>
        ))}
        
        {/* --- TRUE/FALSE UI --- */}
         {question.question_type === 'true_false' && (
          <div>
            <button onClick={() => handleAnswerChange(question.question_id, true, 'true_false')}>True</button>
            <button onClick={() => handleAnswerChange(question.question_id, false, 'true_false')}>False</button>
            Current: {answers[question.question_id]?.toString()}
          </div>
        )}

      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(i => i - 1)}>Previous</button>
        <button disabled={currentQIndex === exam.questions.length - 1} onClick={() => setCurrentQIndex(i => i + 1)}>Next</button>
        
        {currentQIndex === exam.questions.length - 1 && (
            <button style={{marginLeft: 'auto', background: 'red', color: 'white'}} onClick={handleSubmitExam}>
                Submit Exam
            </button>
        )}
      </div>
    </div>
  );
};

export default ExamRunner;