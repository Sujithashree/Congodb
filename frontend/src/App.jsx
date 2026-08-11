import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
  const [page, setPage] = useState("dashboard");

  const [candidates, setCandidates] = useState([]);
  const [skills, setSkills] = useState([]);
  const [jobs, setJobs] = useState([]);

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [recommendedJobs, setRecommendedJobs] = useState([]);

  const [selectedSkill, setSelectedSkill] = useState(null);
  const [skillCandidates, setSkillCandidates] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    setError("");

    try {
      const [candidateResponse, skillResponse, jobResponse] =
        await Promise.all([
          fetch(`${API}/candidates`),
          fetch(`${API}/skills`),
          fetch(`${API}/jobs`)
        ]);

      if (
        !candidateResponse.ok ||
        !skillResponse.ok ||
        !jobResponse.ok
      ) {
        throw new Error("API error");
      }

      const candidateData = await candidateResponse.json();
      const skillData = await skillResponse.json();
      const jobData = await jobResponse.json();

      setCandidates(candidateData);
      setSkills(skillData);
      setJobs(jobData);
    } catch (err) {
      setError(
        "Unable to connect to the graph database. Make sure the FastAPI server is running."
      );
    } finally {
      setLoading(false);
    }
  }

  async function selectCandidate(candidate) {
    setSelectedCandidate(candidate);
    setDetailLoading(true);
    setRecommendedJobs([]);
    setError("");

    try {
      const response = await fetch(
        `${API}/candidates/${candidate.id}/jobs`
      );

      if (!response.ok) {
        throw new Error("Failed to load recommendations");
      }

      const data = await response.json();
      setRecommendedJobs(data);
    } catch {
      setError("Unable to load job recommendations.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function selectSkill(skill) {
    setSelectedSkill(skill);
    setDetailLoading(true);
    setSkillCandidates([]);
    setError("");

    try {
      const response = await fetch(
        `${API}/skills/${encodeURIComponent(skill.name)}/candidates`
      );

      if (!response.ok) {
        throw new Error("Failed");
      }

      const data = await response.json();
      setSkillCandidates(data);
    } catch {
      setError("Unable to load candidates for this skill.");
    } finally {
      setDetailLoading(false);
    }
  }

  const filteredCandidates = candidates.filter((candidate) =>
    `${candidate.name} ${candidate.title}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredSkills = skills.filter((skill) =>
    skill.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredJobs = jobs.filter((job) =>
    `${job.title} ${job.company}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function renderDashboard() {
    return (
      <>
        <section className="hero">
          <div>
            <p className="eyebrow">GRAPH-POWERED TALENT EXPLORATION</p>

            <h1>
              Discover the right
              <br />
              <span>connections.</span>
            </h1>

            <p className="hero-description">
              Explore candidates, skills and jobs through relationships
              stored in CognoDB.
            </p>
          </div>
        </section>

        <section className="stats-grid">
          <StatCard
            label="Candidates"
            value={candidates.length}
            icon="👤"
          />

          <StatCard
            label="Skills"
            value={skills.length}
            icon="◆"
          />

          <StatCard
            label="Open Jobs"
            value={jobs.length}
            icon="▣"
          />

          <StatCard
            label="Graph Engine"
            value="CognoDB"
            icon="◎"
          />
        </section>

        <section className="content-grid">
          <div className="panel">
            <div className="panel-heading">
              <div>
                <h2>Candidate Explorer</h2>
                <p>Select a candidate to discover connected jobs.</p>
              </div>
            </div>

            {filteredCandidates.map((candidate) => (
              <CandidateRow
                key={candidate.id}
                candidate={candidate}
                selected={selectedCandidate?.id === candidate.id}
                onClick={() => {
                  selectCandidate(candidate);
                  setPage("candidate");
                }}
              />
            ))}
          </div>

          <div className="panel graph-panel">
            <div className="panel-heading">
              <div>
                <h2>How the graph connects</h2>
                <p>A simple multi-hop relationship.</p>
              </div>
            </div>

            <GraphPreview />
          </div>
        </section>
      </>
    );
  }

  function renderCandidatePage() {
    return (
      <section className="content-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h2>Candidates</h2>
              <p>Explore candidates in the talent graph.</p>
            </div>
          </div>

          {filteredCandidates.map((candidate) => (
            <CandidateRow
              key={candidate.id}
              candidate={candidate}
              selected={selectedCandidate?.id === candidate.id}
              onClick={() => selectCandidate(candidate)}
            />
          ))}
        </div>

        <div className="panel">
          {!selectedCandidate ? (
            <EmptyState
              title="Select a candidate"
              text="Choose someone to see their connected job opportunities."
            />
          ) : (
            <CandidateDetails
              candidate={selectedCandidate}
              jobs={recommendedJobs}
              loading={detailLoading}
            />
          )}
        </div>
      </section>
    );
  }

  function renderSkillPage() {
    return (
      <section className="content-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h2>Skills</h2>
              <p>Explore skills stored in the graph.</p>
            </div>
          </div>

          <div className="skill-list">
            {filteredSkills.map((skill) => (
              <button
                className={`skill-row ${
                  selectedSkill?.id === skill.id ? "active" : ""
                }`}
                key={skill.id}
                onClick={() => selectSkill(skill)}
              >
                <span className="skill-dot">◆</span>
                {skill.name}
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          {!selectedSkill ? (
            <EmptyState
              title="Select a skill"
              text="See which candidates are connected to that skill."
            />
          ) : (
            <>
              <div className="detail-header">
                <div className="large-icon">◆</div>

                <div>
                  <h2>{selectedSkill.name}</h2>
                  <p>Candidates with this skill</p>
                </div>
              </div>

              {detailLoading ? (
                <Loading />
              ) : skillCandidates.length === 0 ? (
                <EmptyState
                  title="No candidates found"
                  text="No candidates are currently connected to this skill."
                />
              ) : (
                skillCandidates.map((candidate) => (
                  <CandidateRow
                    key={candidate.id}
                    candidate={{
                      ...candidate,
                      experience: null
                    }}
                    onClick={() => {
                      selectCandidate(candidate);
                      setPage("candidate");
                    }}
                  />
                ))
              )}
            </>
          )}
        </div>
      </section>
    );
  }

  function renderJobsPage() {
    return (
      <section className="panel full-panel">
        <div className="panel-heading">
          <div>
            <h2>Job Opportunities</h2>
            <p>Jobs connected to skills and companies.</p>
          </div>
        </div>

        <div className="jobs-grid">
          {filteredJobs.map((job) => (
            <div className="job-card" key={job.id}>
              <div className="job-icon">▣</div>

              <h3>{job.title}</h3>

              <p>{job.company}</p>

              <div className="job-link">
                Connected through the graph →
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="app">

      <header className="topbar">
        <div
          className="brand"
          onClick={() => setPage("dashboard")}
        >
          <div className="brand-mark">S</div>

          <div>
            <strong>SkillGraph</strong>
            <span>Talent intelligence</span>
          </div>
        </div>

        <nav>
          <button
            className={page === "dashboard" ? "nav-active" : ""}
            onClick={() => setPage("dashboard")}
          >
            Overview
          </button>

          <button
            className={page === "candidate" ? "nav-active" : ""}
            onClick={() => setPage("candidate")}
          >
            Candidates
          </button>

          <button
            className={page === "skills" ? "nav-active" : ""}
            onClick={() => setPage("skills")}
          >
            Skills
          </button>

          <button
            className={page === "jobs" ? "nav-active" : ""}
            onClick={() => setPage("jobs")}
          >
            Jobs
          </button>
        </nav>

        <div className="db-status">
          <span></span>
          CognoDB Connected
        </div>
      </header>

      <main className="container">

        <div className="search-bar">
          <span>⌕</span>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search candidates, skills or jobs..."
          />
        </div>

        {error && (
          <div className="error-box">
            <strong>Connection problem</strong>
            <span>{error}</span>

            <button onClick={loadInitialData}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <Loading />
        ) : (
          <>
            {page === "dashboard" && renderDashboard()}
            {page === "candidate" && renderCandidatePage()}
            {page === "skills" && renderSkillPage()}
            {page === "jobs" && renderJobsPage()}
          </>
        )}

      </main>

      <footer>
        SkillGraph · React · FastAPI · Neo4j Driver · CognoDB
      </footer>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function CandidateRow({ candidate, selected, onClick }) {
  return (
    <button
      className={`candidate-row ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <div className="avatar">
        {candidate.name?.charAt(0)}
      </div>

      <div className="candidate-info">
        <strong>{candidate.name}</strong>
        <span>{candidate.title}</span>
      </div>

      {candidate.experience && (
        <small>{candidate.experience} yrs</small>
      )}

      <span className="arrow">→</span>
    </button>
  );
}

function CandidateDetails({ candidate, jobs, loading }) {
  return (
    <>
      <div className="detail-header">
        <div className="large-avatar">
          {candidate.name.charAt(0)}
        </div>

        <div>
          <h2>{candidate.name}</h2>
          <p>
            {candidate.title} · {candidate.experience} years experience
          </p>
        </div>
      </div>

      <div className="connection-line">
        <div>Candidate</div>
        <span>→ HAS_SKILL →</span>
        <div>Skill</div>
        <span>→ REQUIRED_FOR →</span>
        <div>Job</div>
      </div>

      <h3 className="section-title">
        Recommended jobs
      </h3>

      <p className="muted">
        Jobs discovered through multi-hop graph traversal.
      </p>

      {loading ? (
        <Loading />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No matches"
          text="This candidate has no connected jobs yet."
        />
      ) : (
        jobs.map((job) => (
          <div className="recommendation" key={job.id}>
            <div>
              <strong>{job.title}</strong>

              <div className="skill-tags">
                {job.matching_skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </div>

            <div className="match-score">
              <strong>{job.match_count}</strong>
              <span>matches</span>
            </div>
          </div>
        ))
      )}
    </>
  );
}

function GraphPreview() {
  return (
    <div className="graph-preview">
      <div className="graph-node candidate-node">
        <span>👤</span>
        Candidate
      </div>

      <div className="graph-arrow">
        HAS_SKILL
        <span>↓</span>
      </div>

      <div className="graph-node skill-node">
        <span>◆</span>
        Python
      </div>

      <div className="graph-arrow">
        REQUIRED_FOR
        <span>↓</span>
      </div>

      <div className="graph-node job-node">
        <span>▣</span>
        Backend Engineer
      </div>
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">◎</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="loading">
      <div className="spinner"></div>
      Loading graph data...
    </div>
  );
}

export default App;