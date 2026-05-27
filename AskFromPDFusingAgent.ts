import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { OpenAIEmbeddings } from "@langchain/openai"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import { load } from "langchain/load"
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import "dotenv/config";
import { createAgent, dynamicSystemPromptMiddleware } from "langchain";

const nike10kPdfPath = "documents/nke-10k-2023.pdf"

//step 1 Initializing the PDF loader object
const loader = new PDFLoader(nike10kPdfPath)
const docs = await loader.load()
// console.log("docs Length", docs.length)
// console.log("Printing the pageContent of first doc", docs[0].pageContent)
// console.log(docs[0].metadata)

// new call of recursive character text splitter

//if llm is not giving proper answer then we need to adjust the chunksize and chunkoverlap to get better results.
const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000, // break the page into 1000 character chunks
    chunkOverlap: 200 // overlap of 200 characters between chunks to maintain context by take extra 200 characters from the previous chunk
})

const allSplits = await textSplitter.splitDocuments(docs)
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
    const retrievedcontent = retrievedDocs.map((doc)=>{
        doc.pageContent
    }).join("\n\n") 

    return `You are a helpful assistant. Use the following retrieved documents to answer the user's question: ${retrievedcontent}`
});

const agent = createAgent({
    model: "gpt-4o",
    tools:[],
    middleware:[ragMiddleware]
})

const result = await agent.invoke({
    messages: [{role: "user", content: "When was Nike incorporated?"}]
})

console.log(result)