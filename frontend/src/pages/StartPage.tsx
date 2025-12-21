import { useNavigate } from "react-router-dom";
import styles from "./StartPage.module.css";

export default function StartPage() {
  const navigate = useNavigate();

  function startTest() {
    navigate("/test/programming");
  }

  return (
    <main className={styles.center}>
      <section className={styles.card}>
        <h1 className={styles.title}>Ready to begin?</h1>
        <button className={styles.startBtn} onClick={startTest}>
          Start test
        </button>
      </section>
    </main>
  );
}