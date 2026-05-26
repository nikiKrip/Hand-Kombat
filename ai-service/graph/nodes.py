# ai-service/graph/nodes.py

def observe_node(state):
    return state


def gesture_node(state):
    landmarks = state["landmarks"]

    if not landmarks or len(landmarks) == 0:
        gesture = "IDLE"
    else:
        # Get first hand landmarks
        hand = landmarks[0]
        
        # Calculate hand position and finger states
        # landmarks[0] is wrist, landmarks[8] is index tip, landmarks[12] is middle tip
        if len(hand) >= 21:
            wrist_y = hand[0]['y'] if isinstance(hand[0], dict) else hand[0][1]
            index_tip_y = hand[8]['y'] if isinstance(hand[8], dict) else hand[8][1]
            middle_tip_y = hand[12]['y'] if isinstance(hand[12], dict) else hand[12][1]
            
            # Punch: hand moving forward (fingers extended, hand high)
            if wrist_y < 0.5 and index_tip_y < wrist_y:
                gesture = "PUNCH"
            # Kick: two hands detected or hand very low
            elif len(landmarks) > 1 or wrist_y > 0.7:
                gesture = "KICK"
            # Block: hand in defensive position (fingers up, hand centered)
            elif wrist_y < 0.6 and index_tip_y < wrist_y - 0.1:
                gesture = "BLOCK"
            else:
                gesture = "IDLE"
        else:
            gesture = "IDLE"

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
    import random
    
    diff = state["difficulty"]
    prediction = state.get("prediction", "idle")
    
    # AI opponent logic based on difficulty and player prediction
    if diff["aggression"] > 0.7:
        # High aggression: mostly attack
        actions = ["PUNCH", "KICK", "PUNCH", "KICK", "BLOCK"]
        state["enemy_action"] = random.choice(actions)
    elif diff["aggression"] > 0.4:
        # Medium aggression: balanced
        if prediction == "PUNCH":
            # Counter player's punch with block or kick
            state["enemy_action"] = random.choice(["BLOCK", "KICK", "PUNCH"])
        else:
            state["enemy_action"] = random.choice(["PUNCH", "KICK", "BLOCK", "IDLE"])
    else:
        # Low aggression: mostly defensive
        state["enemy_action"] = random.choice(["BLOCK", "IDLE", "PUNCH"])

    return state


def coach_node(state):
    history = state["player_history"]
    
    punch_count = history.count("PUNCH")
    kick_count = history.count("KICK")
    block_count = history.count("BLOCK")
    
    if punch_count > 5:
        state["tip"] = "Too many punches! Try kicks and blocks."
    elif kick_count > 5:
        state["tip"] = "Mix in some punches with those kicks!"
    elif block_count > 3 and punch_count == 0:
        state["tip"] = "Good defense, but attack more!"
    elif len(history) > 5 and history[-3:] == ["IDLE", "IDLE", "IDLE"]:
        state["tip"] = "Make a move! Attack or defend!"
    else:
        state["tip"] = "Good strategy! Keep it up!"

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