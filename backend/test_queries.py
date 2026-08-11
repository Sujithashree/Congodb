import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv()

driver = GraphDatabase.driver(
    os.getenv("COGNODB_URI"),
    auth=(
        os.getenv("COGNODB_USERNAME"),
        os.getenv("COGNODB_PASSWORD")
    )
)

with driver.session() as session:

    result = session.run("""
        MATCH (c:Candidate)-[:HAS_SKILL]->(s:Skill)
        RETURN c.name AS candidate,
               collect(s.name) AS skills
        ORDER BY candidate
    """)

    for record in result:
        print(record["candidate"], "=>", record["skills"])


    print("\nRecommended jobs for Aarav:\n")

    result = session.run("""
        MATCH (c:Candidate {id: $candidate_id})
              -[:HAS_SKILL]->(s:Skill)
              -[:REQUIRED_FOR]->(j:Job)
        RETURN j.title AS job,
               collect(s.name) AS matching_skills,
               count(s) AS match_count
        ORDER BY match_count DESC
    """, candidate_id="p1")

    for record in result:
        print(
            record["job"],
            record["matching_skills"],
            record["match_count"]
        )

driver.close()