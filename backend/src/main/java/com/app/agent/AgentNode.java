package com.app.agent;

public interface AgentNode {
    AgentContext execute(AgentContext context) throws Exception;
    String getName();
}
