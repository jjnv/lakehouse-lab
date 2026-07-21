"use client";

import { useEffect, useMemo, useState } from "react";

type Module = {
  number: string;
  title: string;
  short: string;
  duration: string;
  icon: string;
  description: string;
  outcomes: string[];
  lab: string;
};

const modules: Module[] = [
  {
    number: "01",
    title: "Lakehouse Foundations",
    short: "Foundations",
    duration: "35 min",
    icon: "</>",
    description: "Build the mental model: workspace, compute, catalogs, notebooks, and the lakehouse architecture.",
    outcomes: ["Navigate a Databricks workspace", "Explain lakehouse architecture", "Choose the right compute option"],
    lab: "Create a notebook, attach serverless compute, and inspect a sample dataset with display().",
  },
  {
    number: "02",
    title: "Apache Spark Essentials",
    short: "Spark",
    duration: "45 min",
    icon: "✦",
    description: "Work confidently with distributed DataFrames and understand what Spark evaluates behind the scenes.",
    outcomes: ["Transform Spark DataFrames", "Read an execution plan", "Avoid common shuffle mistakes"],
    lab: "Load a JSON dataset, normalize it, aggregate by category, and inspect the physical plan.",
  },
  {
    number: "03",
    title: "SQL for the Lakehouse",
    short: "SQL",
    duration: "40 min",
    icon: "▱",
    description: "Query governed data with Databricks SQL, then turn reliable results into a useful dashboard.",
    outcomes: ["Query Unity Catalog tables", "Use SQL warehouses", "Build a parameterized dashboard"],
    lab: "Create a SQL warehouse query with two business KPIs and visualize the result.",
  },
  {
    number: "04",
    title: "Data Modeling with Delta",
    short: "Delta",
    duration: "50 min",
    icon: "◇",
    description: "Design dependable tables with Delta Lake, medallion layers, schema controls, and time travel.",
    outcomes: ["Design bronze, silver, and gold tables", "Use MERGE safely", "Recover data with time travel"],
    lab: "Build an incremental silver table with MERGE and verify an earlier version using time travel.",
  },
  {
    number: "05",
    title: "Machine Learning with MLflow",
    short: "MLflow",
    duration: "60 min",
    icon: "⌘",
    description: "Track experiments, compare runs, and register a model without losing reproducibility.",
    outcomes: ["Track experiments with MLflow", "Compare model runs", "Register a winning model"],
    lab: "Train two baseline models, log metrics and parameters, then register the best run.",
  },
  {
    number: "06",
    title: "From Batch to Production",
    short: "Production",
    duration: "40 min",
    icon: "↗",
    description: "Turn notebooks into observable, governed workflows that can run reliably in production.",
    outcomes: ["Create a multi-task job", "Add retries and notifications", "Apply production guardrails"],
    lab: "Convert a notebook flow into a scheduled job with parameters, dependencies, and failure alerts.",
  },
];

const questions = [
  { q: "Which layer usually preserves raw source data?", options: ["Bronze", "Silver", "Gold"], answer: 0 },
  { q: "What makes Spark transformations lazy?", options: ["They run on a timer", "They build a plan until an action runs", "They only work in SQL"], answer: 1 },
  { q: "Which tool tracks ML parameters, metrics, and artifacts?", options: ["Delta Sharing", "MLflow", "Auto Loader"], answer: 1 },
];

export default function Home() {
  const [completed, setCompleted] = useState<number[]>([]);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [active, setActive] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const stored = JSON.parse(localStorage.getItem("lakehouse-lab-progress") || "[]");
        if (Array.isArray(stored)) setCompleted(stored.filter((n) => Number.isInteger(n) && n >= 0 && n < modules.length));
      } catch {}
      setProgressLoaded(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (progressLoaded) localStorage.setItem("lakehouse-lab-progress", JSON.stringify(completed));
  }, [completed, progressLoaded]);

  const percent = Math.round((completed.length / modules.length) * 100);
  const score = useMemo(() => questions.reduce((sum, item, index) => sum + (answers[index] === item.answer ? 1 : 0), 0), [answers]);
  const isUnlocked = (index: number) => index === 0 || completed.includes(index - 1);

  function openModule(index: number) {
    if (!isUnlocked(index)) return;
    setActive(index);
    document.getElementById("lesson")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleComplete(index: number) {
    setCompleted((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index].sort());
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#path" aria-label="Lakehouse Lab home"><span className="brand-mark"><i /><i /><i /></span>Lakehouse Lab</a>
        <nav aria-label="Main navigation">
          <a className="active" href="#path">Path</a>
          <a href="#modules">Modules</a>
          <a href="#practice">Practice</a>
        </nav>
        <div className="avatar" aria-label="Local learner profile">LL</div>
      </header>

      <div className="page-shell" id="path">
        <section className="hero-grid" aria-labelledby="hero-title">
          <div className="hero-card">
            <div className="hero-copy">
              <p className="eyebrow">Databricks learning path</p>
              <h1 id="hero-title">From notebooks<br />to production<span>.</span></h1>
              <p className="hero-text">Master the lakehouse, Spark, SQL, and ML in 6 focused modules.</p>
              <button className="primary-button" onClick={() => openModule(completed.length < modules.length ? completed.length : 0)}>
                {completed.length ? "Continue learning" : "Start the path"}<span aria-hidden="true">→</span>
              </button>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="dot-field" />
              <div className="chart-line"><i /><i /><i /><i /></div>
              <div className="waves">≈≈≈</div>
            </div>
          </div>

          <div className="progress-stack">
            <article className="progress-card">
              <div className="card-heading"><p>{completed.length} of {modules.length} complete</p>{completed.length > 0 && <button className="text-button" onClick={() => setCompleted([])}>Reset</button>}</div>
              <div className="progress-content">
                <div className="progress-ring" style={{ "--progress": `${percent * 3.6}deg` } as React.CSSProperties} aria-label={`${percent}% complete`}><span>{percent}<small>%</small></span></div>
                <p>{percent === 100 ? "You’re production ready. Nice work." : percent ? "Keep the momentum going—your next module is ready." : "You’re at the beginning of your learning journey."}</p>
              </div>
            </article>
            <article className="path-card">
              <p className="card-title">Your learning path</p>
              <div className="path-nodes">
                {modules.map((module, index) => {
                  const done = completed.includes(index);
                  const unlocked = isUnlocked(index);
                  return <button key={module.number} onClick={() => openModule(index)} disabled={!unlocked} className={done ? "done" : unlocked ? "current" : ""} aria-label={`${module.title}: ${done ? "complete" : unlocked ? "available" : "locked"}`}><span>{done ? "✓" : index + 1}</span><small>{index === 0 ? "Start here" : index === 5 ? "Production ready" : module.short}</small></button>;
                })}
              </div>
            </article>
          </div>
        </section>

        <section id="modules" className="modules-section" aria-labelledby="modules-title">
          <div className="section-heading"><div><p className="eyebrow">Curriculum</p><h2 id="modules-title">Your modules</h2></div><p>{completed.length ? `${completed.length} complete · ${modules.length - completed.length} remaining` : "About 4.5 hours · learn at your pace"}</p></div>
          <div className="module-grid">
            {modules.map((module, index) => {
              const done = completed.includes(index);
              const unlocked = isUnlocked(index);
              return <button className={`module-card ${done ? "is-done" : ""}`} key={module.number} onClick={() => openModule(index)} disabled={!unlocked}>
                <span className="module-top"><b>{module.number}</b><i>{module.icon}</i></span>
                <span className="module-title">{module.title}</span>
                <span className="duration"><span aria-hidden="true">◷</span>{module.duration}</span>
                <span className={`status ${done ? "complete" : unlocked ? "ready" : "locked"}`}>{done ? "✓ Complete" : unlocked ? "▷ Ready to start" : "▣ Locked"}</span>
              </button>;
            })}
          </div>
        </section>

        <section id="lesson" className="lesson-panel" aria-labelledby="lesson-title">
          <div className="lesson-index"><span>{modules[active].number}</span><p>Active module</p></div>
          <div className="lesson-copy">
            <p className="eyebrow">{modules[active].duration} guided lesson</p>
            <h2 id="lesson-title">{modules[active].title}</h2>
            <p>{modules[active].description}</p>
            <h3>By the end, you can</h3>
            <ul>{modules[active].outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul>
          </div>
          <div className="lab-card"><p className="eyebrow">Hands-on lab</p><h3>Build it in Databricks</h3><p>{modules[active].lab}</p><button className="primary-button compact" onClick={() => toggleComplete(active)}>{completed.includes(active) ? "Mark incomplete" : "Mark module complete"}<span>→</span></button></div>
        </section>

        <section id="practice" className="practice-section" aria-labelledby="practice-title">
          <div className="practice-intro"><p className="eyebrow">Knowledge check</p><h2 id="practice-title">Make it stick.</h2><p>Three quick questions to test the core ideas. Your answers stay on this device.</p><div className="score-box"><b>{checked ? `${score}/${questions.length}` : "—"}</b><span>{checked ? score === questions.length ? "Perfect score" : "Keep practicing" : "Your score"}</span></div></div>
          <div className="quiz-card">
            {questions.map((item, index) => <fieldset key={item.q}><legend><span>0{index + 1}</span>{item.q}</legend><div>{item.options.map((option, optionIndex) => <label key={option} className={checked ? optionIndex === item.answer ? "correct" : answers[index] === optionIndex ? "incorrect" : "" : ""}><input type="radio" name={`question-${index}`} checked={answers[index] === optionIndex} onChange={() => { setAnswers((current) => ({ ...current, [index]: optionIndex })); setChecked(false); }} />{option}</label>)}</div></fieldset>)}
            <button className="secondary-button" disabled={Object.keys(answers).length < questions.length} onClick={() => setChecked(true)}>Check my answers <span>→</span></button>
          </div>
        </section>
      </div>

      <footer><a className="brand" href="#path"><span className="brand-mark"><i /><i /><i /></span>Lakehouse Lab</a><p>Learn the concepts. Build the labs. Ship with confidence.</p><a href="#path">Back to top ↑</a></footer>
    </main>
  );
}
