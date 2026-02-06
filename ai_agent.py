load_dotenv()

# ✅ Langfuse (Environment variables)
langfuse_handler = CallbackHandler()

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0
)

@tool
def calculator(expression: str) -> str:
    """Evaluate a math expression"""
    return str(eval(expression))

tools = [calculator]

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful AI agent that can use tools."),
    ("human", "{input}")
])

agent = prompt | llm.bind_tools(tools)

result = agent.invoke(
    {"input": "What is (15 + 5) * 2?"},
    config={"callbacks": [langfuse_handler]}
)

print("Final Answer Content:", result.content)
print("Tool Calls:", result.tool_calls)
