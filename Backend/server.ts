//this backend server will read the data from pdf and give the result to users in front-end
import express from "express"
import cors from "cors"
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import { load } from "langchain/load"
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import "dotenv/config";
import { createAgent, dynamicSystemPromptMiddleware, HumanMessage, SystemMessage } from "langchain";
import { Document } from "@langchain/core/documents";

const app = express();
app.use(cors());
app.use(express.json());

// const nike10kPdfPath = "documents/nke-10k-2023.pdf"

const pdfPaths = [
    "documents/nke-10k-2023.pdf",
    "documents/nike-growth-story.pdf",
    "documents/Nike-Inc-2025_10K.pdf"
];

let vectorStore : MemoryVectorStore;
async function initializeRAG(){
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
    vectorStore = new MemoryVectorStore(embeddings);

    //add the documents to vector store using addDocuments function
    await vectorStore.addDocuments(allSplits)

    console.log("RAG Ready")
}
  
app.post('/ask', async(req, res) => {
    try{
        const {question} = req.body;
        const retrievedDocs = await vectorStore.similaritySearch(question, 3);
        const retrievedcontent = retrievedDocs
        .map((doc) => doc.pageContent)
        .join("\n\n");

        const model = new ChatOpenAI({
            model: "gpt-4o",
        });

        const response = await model.invoke([
            new SystemMessage(`You are a helpful assistant. Use the following retrieved documents to answer the user's question: ${retrievedcontent}`),
            new HumanMessage(question)
        ])
        res.json({ answer: response.content });   
    }catch(error){
        console.log(error);
        res.status(500).json({error: "An error occurred while processing your request."})
    }
});

await initializeRAG();

app.listen(3000, ()=> {
    console.log("Server is running on port 3000")
})


