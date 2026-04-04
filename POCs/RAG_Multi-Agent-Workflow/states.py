from pydantic import BaseModel, Field, PositiveFloat
from typing import Any, List, Optional, Dict, Union


class Task(BaseModel):
    task_type: str =  Field(..., description="type of task")

class AgentState(MessagesState):
    # Research brief generated from user conversation history
    research_brief: Optional[str]
    # Messages exchanged with the supervisor agent for coordination
    supervisor_messages: Annotated[Sequence[BaseMessage], add_messages]
    # Raw unprocessed research notes collected during the research phase
    raw_notes: Annotated[list[str], operator.add] = []
    # Processed and structured notes ready for report generation
    notes: Annotated[list[str], operator.add] = []
    # Final formatted research report
    final_report: str


class ClarifyWithUser(BaseModel):
    """Schema for user clarification decision and questions."""
    need_clarification: bool = Field(
        description="Whether the user needs to be asked a clarifying question.",
    )
    question: str = Field(
        description="A question to ask the user to clarify the report scope",
    )
    verification: str = Field(
        description="Verify message that we will start research after the user has provided the necessary information.",
    )
    
class ContactInfo(BaseModel):
    name: str = Field(..., description="Full name of the contact")
    email: str = Field(..., description="Work email address")

