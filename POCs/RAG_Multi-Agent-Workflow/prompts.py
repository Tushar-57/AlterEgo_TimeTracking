clarify_user_request = """These are the messages that have been exchanged so far from the user asking for the report:
<Messages>
{messages}
</Messages>

Today's date is {date}.

Assess whether you need to ask a clarifying question, or if the user has already provided enough information for you to start working on request.
IMPORTANT: If you can see in the messages history that you have already asked a clarifying question, you almost always do not need to ask another one. Only ask another question if ABSOLUTELY NECESSARY.

If there are acronyms, abbreviations, or unknown terms, ask the user to clarify.
If you need to ask a question, follow these guidelines:
- Be concise while gathering all necessary information
- Make sure to gather all the information needed to carry out the assigned task in a concise, well-structured manner.
- Use bullet points or numbered lists if appropriate for clarity. Make sure that this uses markdown formatting and will be rendered correctly if the string output is passed to a markdown renderer.
- Don't ask for unnecessary information, or information that the user has already provided. If you can see that the user has already provided the information, do not ask for it again.

Respond in valid JSON format with these exact keys:
"need_clarification": boolean,
"question": "<question to ask the user to clarify the report scope>",
"verification": "<verification message that we will start research>"

If you need to ask a clarifying question, return:
"need_clarification": true,
"question": "<your clarifying question>",
"verification": ""

If you do not need to ask a clarifying question, return:
"need_clarification": false,
"question": "",
"verification": "<acknowledgement message that you will now start research based on the provided information>"

For the verification message when no clarification is needed:
- Acknowledge that you have sufficient information to proceed
- Briefly summarize the key aspects of what you understand from their request
- Confirm that you will now begin the research process
- Keep the message concise and professional

"""

clear_user_req = """Clarify and extract the user's intent from their inquiry, identifying the underlying task (such as give_info, some_task_run, analyze_request_dependency, or others), and determine any additional information needed to fulfill the request accurately.  
Begin by reasoning step-by-step:  
- First, analyze the user's input to infer their overall goal and determine which general task type(s) it most closely matches.
- Next, identify any missing or ambiguous information required for completion.
- DO NOT begin with task classification or conclusions; always present your reasoning and reasoning steps before summarizing/reporting conclusions or making classifications.

Persist in clarifying until the task and requirements are fully understood and no further details are missing. Use follow-up questions as needed if information is insufficient or ambiguous before finalizing the task type or confirming readiness to proceed.

**Output Format:**  
Respond in the following JSON structure:  
{
  "inferred_intent": "[detailed paraphrase of the user's likely intent]",
  "probable_task_type": "[one of: give_info, some_task_run, analyze_request_dependency, etc. If more than one, list in order of likelihood]",
  "reasoning_steps": [
      "[Step-by-step explanation of how the intent and required information were determined, including ambiguities or open questions]"
  ],
  "missing_information": [
      "[Any specific details, context, or clarifications needed from the user]"
  ],
  "clarification_questions": [
      "[Targeted question(s) to ask user for missing/ambiguous details. Leave empty if fully clear.]"
  ]
}

**Examples:**  


**Example 1**  
User input: "Tell me more about dependency analysis."  
Output:  
{
  "inferred_intent": "The user is seeking information on the concept or process of dependency analysis.",
  "probable_task_type": "give_info",
  "reasoning_steps": [
    "The phrase 'tell me more' indicates an informational request.",
    "Reference to 'dependency analysis' matches a knowledge/information domain."
  ],
  "missing_information": [
    "Specific context: Is the user interested in software, project management, or other domains?",
    "Depth of explanation required."
  ],
  "clarification_questions": [
    "Are you interested in dependency analysis related to software development, project management, or another field?",
    "Do you want a general overview or a detailed technical explanation?"
  ]
}
**Example 2**  
User input: "Tell me more about dependency analysis."  
Output:  
{
  "inferred_intent": "The user is seeking information on the concept or process of dependency analysis.",
  "probable_task_type": "give_info",
  "reasoning_steps": [
    "The phrase 'tell me more' indicates an informational request.",
    "Reference to 'dependency analysis' matches a knowledge/information domain."
  ],
  "missing_information": [
    "Specific context: Is the user interested in software, project management, or other domains?",
    "Depth of explanation required."
  ],
  "clarification_questions": [
    "Are you interested in dependency analysis related to software development, project management, or another field?",
    "Do you want a general overview or a detailed technical explanation?"
  ]
}

(Real user messages may be more complex, requiring longer and more specific clarification steps and questions.)

**Edge Cases & Considerations:**  
- If the user's intent is highly ambiguous or covers multiple task types, reflect this in both "probable_task_type" and "reasoning_steps."
- Always avoid skipping clarification for missing or unclear details.
- If all required information is present and no clarifications are needed, leave "clarification_questions" empty.

**REPEAT OF KEY INSTRUCTIONS:**  
Always start with step-by-step reasoning. Do not classify or summarize until after reasoning. Use the specified JSON output format. Persist in clarifying until all needed details are gathered."""


