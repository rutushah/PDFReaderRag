import { useState } from 'react'
import './App.css'

function App() {
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function askQuestion() {
    if (!question.trim()) return
    setLoading(true)
    setAnswer("")
    setError("")

    try {
      const res = await fetch("http://localhost:3000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      })

      if (!res.ok) throw new Error("Something went wrong. Please try again.")

      const data = await res.json()
      setAnswer(data.answer)
    } catch (err: any) {
      setError(err.message || "Failed to get a response.")
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      askQuestion()
    }
  }

  return (
    <div className="container">
      <div className="header">
        <div className="logo">📄</div>
        <div>
          <h1 className="title">PDF Chatbot RAG</h1>
          <p className="subtitle">In this pdf I have loaded documents related to nike, Ask anything about the Nike PDF document</p>
        </div>
      </div>

      <div className="input-area">
        <textarea
          rows={4}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your PDF... (Enter to send)"
          className="textarea"
        />
        <button
          onClick={askQuestion}
          disabled={loading || !question.trim()}
          className="ask-btn"
        >
          {loading ? (
            <span className="btn-content">
              <span className="spinner" /> Thinking...
            </span>
          ) : (
            <span className="btn-content">
              <span>➤</span> Ask
            </span>
          )}
        </button>
      </div>

      {loading && (
        <div className="answer-card loading-card">
          <p className="answer-label">Answer</p>
          <div className="skeleton-lines">
            <div className="skeleton" style={{ width: "90%" }} />
            <div className="skeleton" style={{ width: "75%" }} />
            <div className="skeleton" style={{ width: "60%" }} />
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="answer-card error-card">
          <p className="answer-label">Error</p>
          <p className="answer-text">{error}</p>
        </div>
      )}

      {answer && !loading && (
        <div className="answer-card">
          <p className="answer-label">Answer</p>
          <p className="answer-text">{answer}</p>
        </div>
      )}
    </div>
  )
}

export default App
