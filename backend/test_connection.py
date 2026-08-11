import os

from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv()

uri = os.getenv("COGNODB_URI")
username = os.getenv("COGNODB_USERNAME")
password = os.getenv("COGNODB_PASSWORD")

driver = GraphDatabase.driver(
    uri,
    auth=(username, password)
)

try:
    driver.verify_connectivity()
    print("Successfully connected to CognoDB!")

    with driver.session() as session:
        result = session.run(
            "RETURN 'Hello from CognoDB!' AS message"
        )

        record = result.single()

        print(record["message"])

finally:
    driver.close()