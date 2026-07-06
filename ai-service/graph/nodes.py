# ai-service/graph/nodes.py

def observe_node(state):
    return state


def gesture_node(state):
    """
    Gesture mapping:
      - Open hand (most fingers extended)          -> MOVE_FORWARD
      - Index finger extended, others folded       -> KICK  (any orientation)
      - Closed fist, clearly sideways (>50deg)     -> PUNCH
      - Any other closed fist                      -> MOVE_BACK
      - Both hands open                            -> DEFEND
    """
    import math

    landmarks = state["landmarks"]

    def _xy(lm):
        if isinstance(lm, dict):
            return lm['x'], lm['y']
        return lm[0], lm[1]

    def _dist(a, b):
        ax, ay = _xy(a)
        bx, by = _xy(b)
        return math.hypot(ax - bx, ay - by)

    # MediaPipe finger landmark indices:
    # Each finger: [MCP, PIP, DIP, TIP]
    # Index:  5,  6,  7,  8
    # Middle: 9, 10, 11, 12
    # Ring:  13, 14, 15, 16
    # Pinky: 17, 18, 19, 20
    # Thumb:  1,  2,  3,  4

    def _finger_extended(hand, mcp, tip):
        """
        A finger is extended if its tip is farther from the wrist than its MCP.
        This is scale-invariant — works regardless of how close the hand is.
        """
        return _dist(hand[tip], hand[0]) > _dist(hand[mcp], hand[0])

    def _is_open(hand):
        """At least 3 of 4 main fingers (index/middle/ring/pinky) are extended."""
        fingers = [
            _finger_extended(hand, 5, 8),   # index
            _finger_extended(hand, 9, 12),  # middle
            _finger_extended(hand, 13, 16), # ring
            _finger_extended(hand, 17, 20), # pinky
        ]
        return sum(fingers) >= 3

    def _is_fist(hand):
        """All 4 main fingers folded (none extended)."""
        fingers = [
            _finger_extended(hand, 5, 8),
            _finger_extended(hand, 9, 12),
            _finger_extended(hand, 13, 16),
            _finger_extended(hand, 17, 20),
        ]
        return sum(fingers) == 0

    def _is_index_pointing(hand):
        """Index extended, middle+ring+pinky all folded."""
        return (
            _finger_extended(hand, 5, 8) and
            not _finger_extended(hand, 9, 12) and
            not _finger_extended(hand, 13, 16) and
            not _finger_extended(hand, 17, 20)
        )

    def _is_punch(hand):
        """
        Closed fist held clearly sideways: wrist->MCP9 vector is more
        horizontal than vertical (>50 degrees from vertical).
        """
        if not _is_fist(hand):
            return False
        wx, wy = _xy(hand[0])
        mx, my = _xy(hand[9])
        dx = mx - wx
        dy = my - wy
        angle_from_vertical = math.degrees(math.atan2(abs(dx), abs(dy) + 1e-6))
        return angle_from_vertical > 50

    if not landmarks or len(landmarks) == 0:
        gesture = "IDLE"
    else:
        hand = landmarks[0]
        if len(hand) < 21:
            gesture = "IDLE"
        elif len(landmarks) >= 2 and _is_open(hand) and _is_open(landmarks[1]):
            # Both hands open -> DEFEND
            gesture = "DEFEND"
        elif _is_index_pointing(hand):
            # Index finger extended, others folded -> KICK
            gesture = "KICK"
        elif _is_punch(hand):
            # Closed fist held clearly sideways -> PUNCH
            gesture = "PUNCH"
        elif _is_fist(hand):
            # Any other closed fist -> MOVE_BACK
            gesture = "MOVE_BACK"
        elif _is_open(hand):
            # Open hand -> MOVE_FORWARD
            gesture = "MOVE_FORWARD"
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

    last = history[-1] if history else "IDLE"
    if last in ("PUNCH", "KICK"):
        state["prediction"] = last
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
    defend_count = history.count("DEFEND")

    if punch_count > 5:
        state["tip"] = "Too many punches! Try kicks and blocks."
    elif kick_count > 5:
        state["tip"] = "Mix in some punches with those kicks!"
    elif defend_count > 3 and punch_count == 0:
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
        aggression += 0.2

    if len(history) > 0 and history[-1] == "idle":
        aggression -= 0.2

    state["difficulty"] = {
        "aggression": aggression,
        "reaction_speed": 0.5 + aggression
    }

    return state
