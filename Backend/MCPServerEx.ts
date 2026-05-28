import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { createAgent} from "langchain";
import { ChatOpenAI } from "@langchain/openai";

const client = new MultiServerMCPClient({
    math:{
        transport:"stdio",
        command: "node",
        args: ["Backend/mcpServers/MathServer.js"],
    },
    weather:{
        transport:"http",
        url: "http://localhost:8000/mcp",
    },
});

const tools = await client.getTools();

const agent = createAgent({
    model: new ChatOpenAI({ model: "gpt-4o" }),
    tools,
});

const mathResponse = await agent.invoke({
    messages: [{role:"user", content: "What 's (3+5) * 12 "}]
});

const weatherResponse = await agent.invoke({
    messages: [{role:"user", content: "What's the weather in New York?"}]
});

console.log("Math Response:", mathResponse);
console.log("Weather Response:", weatherResponse);

