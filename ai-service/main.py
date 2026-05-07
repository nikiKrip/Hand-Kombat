# ai-service/main.py

from fastapi import FastAPI
from graph.agent_graph import graph

app = FastAPI()

player_history = []

@app.post("/process")
async def process(data: dict):
    global player_history
    state = {
        "landmarks": data.get("landmarks", []),
        "player_history": player_history
    }

    result = graph.invoke(state)
    player_history = result["player_history"]

    return {
        "enemyAction": result["enemy_action"],
        "tip": result["tip"]
    }