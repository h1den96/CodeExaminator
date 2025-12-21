import { useState } from "react";
import QuestionCard from "../components/Card";
import styles from "./questionPages.module.css";

const sampleTF = {
  id: 7,
  body: "True-False question body"
};

export default function TrueFalsePage() {
  const [answer, setAnswer] = useState<"true" | "false" | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: send { question_id: sampleTF.id, answer: answer } to API
  }

  return (
    <form onSubmit={onSubmit}>
      <QuestionCard
        title={sampleTF.body}
        footer={
          <>
            <button type="button" className="button secondary">Skip</button>
            <button disabled={!answer} className="button">Submit</button>
          </>
        }
      >
        <fieldset className={styles.optionBox}>
          <legend className={styles.legend}>Select True or False:</legend>

          <div className={styles.row}>
            <label className={styles.radioRow}>
              <input
                type="radio"
                name={`q-${sampleTF.id}`}
                value="true"
                checked={answer === "true"}
                onChange={() => setAnswer("true")}
              />
              <span>True</span>
            </label>

            <label className={styles.radioRow}>
              <input
                type="radio"
                name={`q-${sampleTF.id}`}
                value="false"
                checked={answer === "false"}
                onChange={() => setAnswer("false")}
              />
              <span>False</span>
            </label>
          </div>
        </fieldset>
      </QuestionCard>
    </form>
  );
}
