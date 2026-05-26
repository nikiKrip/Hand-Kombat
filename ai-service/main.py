# ai-service/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from graph.agent_graph import graph

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        "playerAction": result.get("gesture", "IDLE"),
        "enemyAction": result["enemy_action"],
        "tip": result["tip"]
    }