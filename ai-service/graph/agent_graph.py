# ai-service/graph/agent_graph.py

from langgraph.graph import StateGraph
from graph.state import GameState
from graph.nodes import *

builder = StateGraph(GameState)

builder.add_node("observe", observe_node)
builder.add_node("gesture", gesture_node)
builder.add_node("history", update_history_node)
builder.add_node("predict", predict_node)
builder.add_node("opponent", opponent_node)
builder.add_node("coach", coach_node)
builder.add_node("difficulty", difficulty_node)

builder.set_entry_point("observe")

builder.add_edge("observe", "gesture")
builder.add_edge("gesture", "history")
builder.add_edge("history", "predict")
builder.add_edge("predict", "difficulty") 
builder.add_edge("difficulty", "opponent")
builder.add_edge("opponent", "coach")

builder.set_finish_point("coach")

graph = builder.compile()