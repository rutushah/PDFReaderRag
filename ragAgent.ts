import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { OpenAIEmbeddings } from "@langchain/openai"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import { load } from "langchain/load"
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import "dotenv/config";

const nike10kPdfPath = "documents/nke-10k-2023.pdf"

//step 1 Initializing the PDF loader object
const loader = new PDFLoader(nike10kPdfPath)
const docs = await loader.load()
console.log("docs Length", docs.length)
console.log("Printing the pageContent of first doc", docs[0].pageContent)
console.log(docs[0].metadata)

// new call of recursive character text splitter

//if llm is not giving proper answer then we need to adjust the chunksize and chunkoverlap to get better results.
const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000, // break the page into 1000 character chunks
    chunkOverlap: 200 // overlap of 200 characters between chunks to maintain context by take extra 200 characters from the previous chunk
})

const allSplits = await textSplitter.splitDocuments(docs)
console.log("allSplits Length", allSplits.length)

const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large"
})

// intialization of vector store and storing the embedding model as an argument
const vectorStore = new MemoryVectorStore(embeddings);

//add the documents to vector store using addDocuments function
await vectorStore.addDocuments(allSplits)

// console.log("Vector store initialized and documents added", vectorStore)

const results = await vectorStore.similaritySearch("When was Nike incorporated?") 
// console.log(results)

// await vectorStore.similaritySearch("What is the revenue of Nike in 2023?")

vectorStore.asRetriever({
    searchType:"mmr", // mmr will only return the most relevant and diversified documents without duplicates
    searchKwargs: {
        fetchK: 4, // this will give you the top 4 most relevant documents from the vector store it can be configured based on user requirement
    }
})