import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv()

URI = os.getenv("COGNODB_URI")
USERNAME = os.getenv("COGNODB_USERNAME")
PASSWORD = os.getenv("COGNODB_PASSWORD")

driver = GraphDatabase.driver(
    URI,
    auth=(USERNAME, PASSWORD)
)

def seed_database():
    with driver.session() as session:

        # Clear existing data
        session.run("MATCH (n) DETACH DELETE n")

        # Companies
        companies = [
            {"id": "c1", "name": "TechNova"},
            {"id": "c2", "name": "DataLabs"},
            {"id": "c3", "name": "CloudWorks"},
            {"id": "c4", "name": "FinStack"},
        ]

        for company in companies:
            session.run(
                """
                CREATE (:Company {
                    id: $id,
                    name: $name
                })
                """,
                **company
            )

        # Skills
        skills = [
            {"id": "s1", "name": "Python"},
            {"id": "s2", "name": "React"},
            {"id": "s3", "name": "FastAPI"},
            {"id": "s4", "name": "Machine Learning"},
            {"id": "s5", "name": "Docker"},
            {"id": "s6", "name": "AWS"},
            {"id": "s7", "name": "SQL"},
            {"id": "s8", "name": "GraphQL"},
        ]

        for skill in skills:
            session.run(
                """
                CREATE (:Skill {
                    id: $id,
                    name: $name
                })
                """,
                **skill
            )

        # Jobs
        jobs = [
            {
                "id": "j1",
                "title": "Backend Engineer",
                "company_id": "c1"
            },
            {
                "id": "j2",
                "title": "Data Scientist",
                "company_id": "c2"
            },
            {
                "id": "j3",
                "title": "Full Stack Developer",
                "company_id": "c3"
            },
            {
                "id": "j4",
                "title": "ML Engineer",
                "company_id": "c4"
            },
        ]

        for job in jobs:
            session.run(
                """
                CREATE (j:Job {
                    id: $id,
                    title: $title
                })
                WITH j
                MATCH (c:Company {id: $company_id})
                CREATE (j)-[:AT_COMPANY]->(c)
                """,
                **job
            )

        # Candidates
        candidates = [
            {
                "id": "p1",
                "name": "Aarav Sharma",
                "title": "Backend Developer",
                "experience": 4
            },
            {
                "id": "p2",
                "name": "Priya Reddy",
                "title": "Data Scientist",
                "experience": 3
            },
            {
                "id": "p3",
                "name": "Rahul Kumar",
                "title": "Full Stack Developer",
                "experience": 5
            },
            {
                "id": "p4",
                "name": "Ananya Singh",
                "title": "ML Engineer",
                "experience": 4
            },
        ]

        for candidate in candidates:
            session.run(
                """
                CREATE (:Candidate {
                    id: $id,
                    name: $name,
                    title: $title,
                    experience: $experience
                })
                """,
                **candidate
            )

        # Candidate skills
        candidate_skills = {
            "p1": ["s1", "s3", "s5", "s6"],
            "p2": ["s1", "s4", "s7"],
            "p3": ["s1", "s2", "s3", "s8"],
            "p4": ["s1", "s4", "s5", "s6"],
        }

        for candidate_id, skill_ids in candidate_skills.items():
            for skill_id in skill_ids:
                session.run(
                    """
                    MATCH (c:Candidate {id: $candidate_id})
                    MATCH (s:Skill {id: $skill_id})
                    CREATE (c)-[:HAS_SKILL]->(s)
                    """,
                    candidate_id=candidate_id,
                    skill_id=skill_id
                )

        # Job required skills
        job_skills = {
            "j1": ["s1", "s3", "s5"],
            "j2": ["s1", "s4", "s7"],
            "j3": ["s1", "s2", "s3"],
            "j4": ["s1", "s4", "s5", "s6"],
        }

        for job_id, skill_ids in job_skills.items():
            for skill_id in skill_ids:
                session.run(
                    """
                    MATCH (j:Job {id: $job_id})
                    MATCH (s:Skill {id: $skill_id})
                    CREATE (s)-[:REQUIRED_FOR]->(j)
                    """,
                    job_id=job_id,
                    skill_id=skill_id
                )

        # Related skills
        related_skills = [
            ("s1", "s4"),  # Python -> ML
            ("s3", "s1"),  # FastAPI -> Python
            ("s5", "s6"),  # Docker -> AWS
            ("s2", "s8"),  # React -> GraphQL
        ]

        for skill_a, skill_b in related_skills:
            session.run(
                """
                MATCH (a:Skill {id: $a})
                MATCH (b:Skill {id: $b})
                CREATE (a)-[:RELATED_TO]->(b)
                """,
                a=skill_a,
                b=skill_b
            )

    print("Database seeded successfully!")


try:
    seed_database()
finally:
    driver.close()