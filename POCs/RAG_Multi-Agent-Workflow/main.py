import asyncio
import json
import os
from utils import format_messages
from langchain_core.messages import HumanMessage
import utils
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
from langgraph.graph import END, START, StateGraph
from step_nodes import ClarifyWithUser
from state import OverallState
import IPython.display
from vectorstore import initialize_local_store


####--------Global_Configurations----------########
####-----------------START-----------------########

# Langsmith Configurations
LANGCHAIN_TRACING_V2 = "true"
LANGCHAIN_API_KEY = os.getenv("LANGCHAIN_API_KEY")
LANGCHAIN_PROJECT = "AlterEgo"

# Set environment variables for Langsmith
os.environ["LANGCHAIN_TRACING_V2"] = LANGCHAIN_TRACING_V2
os.environ["LANGCHAIN_API_KEY"] = LANGCHAIN_API_KEY
os.environ["LANGCHAIN_PROJECT"] = LANGCHAIN_PROJECT

####--------Global_Configurations--------########
####-----------------END-----------------########

# logger.SYSTEM(f" Main Class Called !")
initialize_local_store()

builder = StateGraph(OverallState)




# Step 1 -> Check If User has Custom Tasks, and route on that basis
builder.add_node("Clarify User Request", ClarifyWithUser)

# Step 2 -> Conditional Node for checking if enhancement is needed in user input
builder.add_node("format_final_response_node", format_final_response_node)
# builder.add_node("process")

# builder.add_conditional_edges() 


log_separator(logger, symbol="-")

# Graph Structure
builder.add_edge(START, "custom_task_check_node")

builder.add_edge("process_suggestions_node", "suggestions_recommend_product")
builder.add_conditional_edges(
    "suggestions_recommend_product",
    check_has_specific_tasks,
    {
        "on output 1 go to ->": "validate_custom_tasks_node",
        "on output 2 go to ->": "format_final_response_node",
    },
)
builder.add_edge("validate_custom_tasks_node", "process_custom_tasks_node")
builder.add_edge("calculate_savings_node", "format_final_response_node")
builder.add_edge("format_final_response_node", END)

graph = builder.compile()

nodes = list(builder.nodes.keys())
edges = builder.edges

thread = {"configurable": {"thread_id": "1"}}
result = scope.invoke({"messages": [HumanMessage(content="I want to research the best coffee shops in San Francisco.")]}, config=thread)
format_messages(result['messages'])