# ai-service/graph/state.py
from typing import TypedDict, List

class GameState(TypedDict):
    landmarks: list
    gesture: str
    player_history: List[str]
    prediction: str
    enemy_action: str
    tip: str