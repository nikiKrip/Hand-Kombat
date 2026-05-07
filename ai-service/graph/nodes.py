# ai-service/graph/nodes.py

def observe_node(state):
    return state


def gesture_node(state):
    landmarks = state["landmarks"]

    if not landmarks:
        gesture = "IDLE"

    elif len(landmarks) > 15:
        gesture = "PUNCH"

    else:
        gesture = "BLOCK"

    state["gesture"] = gesture
    return state


def update_history_node(state):
    history = state.get("player_history", [])
    history.append(state["gesture"])
    state["player_history"] = history[-10:]
    return state


def predict_node(state):
    history = state["player_history"]

    if history and history[-1] == "PUNCH":
        state["prediction"] = "PUNCH"
    else:
        state["prediction"] = "idle"

    return state


def opponent_node(state):
    diff = state["difficulty"]

    if diff["aggression"] > 0.6:
        state["enemy_action"] = "PUNCH"
    else:
        state["enemy_action"] = "BLOCK"

    return state


def coach_node(state):
    if state["player_history"].count("PUNCHES") > 5:
        state["tip"] = "Too many punches. Mix moves."
    else:
        state["tip"] = "Good variation."

    return state

def difficulty_node(state):
    history = state["player_history"]

    aggression = 0.5

    if history.count("PUNCH") > 5:
        aggression += 0.2   # player is aggressive

    if len(history) > 0 and history[-1] == "idle":
        aggression -= 0.2   # player is slow

    state["difficulty"] = {
        "aggression": aggression,
        "reaction_speed": 0.5 + aggression
    }

    return state