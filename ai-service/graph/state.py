# ai-service/graph/state.py
from typing import TypedDict, List, Optional

class GameState(TypedDict, total=False):
    landmarks: list
    gesture: str
    player_history: List[str]
    prediction: str
    enemy_action: str
    tip: str
    difficulty: dict