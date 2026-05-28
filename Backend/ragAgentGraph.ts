import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { OpenAIEmbeddings } from "@langchain/openai"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import { load } from "langchain/load"
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import "dotenv/config";
import { createAgent, dynamicSystemPromptMiddleware, tool } from "langchain";
import { Document } from "@langchain/core/documents";
import z from "zod";

const pdfPaths = [
    "documents/nke-10k-2023.pdf",
    "documents/nike-growth-story.pdf",
    "documents/Nike-Inc-2025_10K.pdf"
];

//step 1 Initializing the PDF loader object
const allDocs: Document[] = [];
  
for (const pdfPath of pdfPaths) {
    const loader = new PDFLoader(pdfPath);
    const docs = await loader.load();
    allDocs.push(...docs);
}
// new call of recursive character text splitter

//if llm is not giving proper answer then we need to adjust the chunksize and chunkoverlap to get better results.
const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000, // break the page into 1000 character chunks
    chunkOverlap: 200 // overlap of 200 characters between chunks to maintain context by take extra 200 characters from the previous chunk
})

const allSplits = await textSplitter.splitDocuments(allDocs)
// console.log("allSplits Length", allSplits.length)

const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large"
})

// intialization of vector store and storing the embedding model as an argument
const vectorStore = new MemoryVectorStore(embeddings);

//add the documents to vector store using addDocuments function
await vectorStore.addDocuments(allSplits)


const ragMiddleware  = dynamicSystemPromptMiddleware(async (state) => {
    const userMessage = state.messages[0].content;
    const query = typeof userMessage === "string" ? userMessage : "";
    const retrievedDocs = await vectorStore.similaritySearch(query, 3);
    const retrievedcontent = retrievedDocs
    .map((doc) => doc.pageContent)
    .join("\n\n");

    return `You are a helpful assistant. Use the following retrieved documents to answer the user's question: ${retrievedcontent}`
});

//tools
// tool to get the weather based on the city
const getWeather = tool(
    (input) => {
      return `Its sunny in ${input.city} today.`;
    },
    {
      name: "getWeather",
      description: "Get the weather for a given city",
      schema: z.object({
        city: z.string(),
      }),
    }
  );

  // Email tool
const emailTool = tool(({ recipient, subject }) => {
    return `Email sent to ${recipient} with subject "${subject}".`;
}, {
    name: "sendEmail",
    description: "Send an email to a specified recipient",
    schema: z.object({
        recipient: z.string().email(),
        subject: z.string(),
    })
});

const agent = createAgent({
    model: "gpt-4o-mini",
    tools:[emailTool, getWeather],
    middleware:[ragMiddleware]
})

// const result = await agent.invoke({
//     messages: [{role: "user", content: "What was Nike revenue in 2024 and 2025?"}]
// })

// console.log(result)

export const graph = agent;