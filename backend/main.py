import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from neo4j import GraphDatabase

load_dotenv()

app = FastAPI(
    title="SkillGraph API",
    description="Graph-powered talent exploration using CognoDB",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

URI = os.getenv("COGNODB_URI")
USERNAME = os.getenv("COGNODB_USERNAME")
PASSWORD = os.getenv("COGNODB_PASSWORD")

if not URI or not USERNAME or not PASSWORD:
    raise RuntimeError(
        "Missing COGNODB_URI, COGNODB_USERNAME or COGNODB_PASSWORD"
    )

driver = GraphDatabase.driver(
    URI,
    auth=(USERNAME, PASSWORD)
)


@app.on_event("shutdown")
def shutdown():
    driver.close()


@app.get("/")
def root():
    return {
        "application": "SkillGraph",
        "status": "running",
        "database": "CognoDB",
    }


@app.get("/health")
def health():
    try:
        driver.verify_connectivity()

        return {
            "status": "ok",
            "database": "CognoDB"
        }

    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Database unavailable"
        )


@app.get("/candidates")
def candidates():

    query = """
    MATCH (c:Candidate)
    RETURN
        c.id AS id,
        c.name AS name,
        c.title AS title,
        c.experience AS experience
    ORDER BY c.name
    """

    try:
        with driver.session() as session:
            result = session.run(query)

            return [record.data() for record in result]

    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve candidates"
        )


@app.get("/candidates/{candidate_id}/jobs")
def recommended_jobs(candidate_id: str):

    # Multi-hop graph traversal:
    #
    # Candidate → Skill → Job → Company
    #
    # This finds jobs matching the candidate's skills.

    query = """
    MATCH (c:Candidate {id: $candidate_id})
          -[:HAS_SKILL]->(s:Skill)
          -[:REQUIRED_FOR]->(j:Job)
          -[:AT_COMPANY]->(company:Company)

    RETURN
        j.id AS id,
        j.title AS title,
        company.name AS company,
        count(DISTINCT s) AS match_count,
        collect(DISTINCT s.name) AS matching_skills

    ORDER BY match_count DESC
    """

    try:
        with driver.session() as session:

            result = session.run(
                query,
                candidate_id=candidate_id
            )

            return [record.data() for record in result]

    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve job recommendations"
        )


@app.get("/skills")
def skills():

    query = """
    MATCH (s:Skill)
    RETURN
        s.id AS id,
        s.name AS name
    ORDER BY s.name
    """

    try:
        with driver.session() as session:

            result = session.run(query)

            return [record.data() for record in result]

    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve skills"
        )


@app.get("/skills/{skill_name}/candidates")
def candidates_by_skill(skill_name: str):

    query = """
    MATCH (c:Candidate)-[:HAS_SKILL]->(s:Skill)

    WHERE toLower(s.name) = toLower($skill_name)

    RETURN
        c.id AS id,
        c.name AS name,
        c.title AS title,
        c.experience AS experience

    ORDER BY c.name
    """

    try:
        with driver.session() as session:

            result = session.run(
                query,
                skill_name=skill_name
            )

            return [record.data() for record in result]

    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve candidates for this skill"
        )


@app.get("/skills/{skill_name}/network")
def skill_network(skill_name: str):

    """
    Graph-oriented query.

    Starting from one Skill, traverse to:

    Skill → Candidates
    Skill → Jobs → Companies

    This is awkward to model as a single relational query
    because the information lives across several relationship
    tables.
    """

    query = """
    MATCH (s:Skill)

    WHERE toLower(s.name) = toLower($skill_name)

    OPTIONAL MATCH (c:Candidate)-[:HAS_SKILL]->(s)

    OPTIONAL MATCH (s)-[:REQUIRED_FOR]->(j:Job)

    OPTIONAL MATCH (j)-[:AT_COMPANY]->(company:Company)

    RETURN
        s.name AS skill,
        collect(DISTINCT c.name) AS candidates,
        collect(DISTINCT j.title) AS jobs,
        collect(DISTINCT company.name) AS companies
    """

    try:
        with driver.session() as session:

            result = session.run(
                query,
                skill_name=skill_name
            )

            record = result.single()

            if not record:
                return {
                    "skill": skill_name,
                    "candidates": [],
                    "jobs": [],
                    "companies": []
                }

            return record.data()

    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve skill network"
        )


@app.get("/jobs")
def jobs():

    query = """
    MATCH (j:Job)-[:AT_COMPANY]->(c:Company)

    RETURN
        j.id AS id,
        j.title AS title,
        c.name AS company

    ORDER BY j.title
    """

    try:
        with driver.session() as session:

            result = session.run(query)

            return [record.data() for record in result]

    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve jobs"
        )