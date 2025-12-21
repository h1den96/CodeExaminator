import { useMemo, useState } from "react";
import QuestionCard from "../components/Card";
import styles from "./questionPages.module.css";

type McqOption = { id: number; label: string };
type McqQuestion = {
  id: number;
  body: string;
  options: McqOption[];
};

const sample: McqQuestion = {
  id: 42,
  body: "Multiple choice question body",
  options: [
    { id: 1, label: "option1" },
    { id: 2, label: "option2" },
    { id: 3, label: "option3" },
    { id: 4, label: "option4" }
  ]
};

export default function McqPage() {
  const shuffled = useMemo(() => {
    return [...sample.options].sort(() => Math.random() - 0.5);
  }, [sample.id]);

  const [selected, setSelected] = useState<number | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: send { question_id: sample.id, answer: selected } to API
    // then go to next question
  }

  return (
    <form onSubmit={onSubmit}>
      <QuestionCard
        title={sample.body}
        footer={
          <>
            <button type="button" className="button secondary">Skip</button>
            <button disabled={selected === null} className="button">Submit</button>
          </>
        }
      >
        <fieldset className={styles.optionBox}>
          <legend className={styles.legend}>Choose one:</legend>

          <div className={styles.grid2}>
            {shuffled.map((opt) => (
              <label key={opt.id} className={styles.radioRow}>
                <input
                  type="radio"
                  name={`q-${sample.id}`}
                  value={opt.id}
                  checked={selected === opt.id}
                  onChange={() => setSelected(opt.id)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </QuestionCard>
    </form>
  );
}
