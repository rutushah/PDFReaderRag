import { useState } from 'react'


function App() {

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  async function askQuestion(){
    const res = await fetch("http://localhost:3000/ask",{
      method: "POST",
      headers:{
        "Content-Type": "application/json"
      },
      body: JSON.stringify({question})
    });

    const data = await res.json();
    setAnswer(data.answer);
  }

  return (
    <div style ={{padding:"30px", maxWidth:"700px"}}>
      <h2>Nike PDF RAG Chatbot</h2>
      <textarea 
        rows={4}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder='Ask a question...'
        style={{width:"100%", padding:"10px", fontSize:"16px"}}
      />

      <button onClick={askQuestion} style={{marginTop:"10px"}}>
        ASk
      </button>

      <div style={{ marginTop: "20px" }}>
        <strong>Answer:</strong>
        <p>{answer}</p>
      </div>
    </div>
  )

}

export default App