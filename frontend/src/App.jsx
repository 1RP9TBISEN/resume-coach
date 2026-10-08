import { useState, useEffect } from 'react'
import { getItems, addItem, toggleItem, deleteItem } from './api'
import './App.css'

function App() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load items on mount
  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const data = await getItems()
      setItems(data)
    } catch (err) {
      setError("Failed to fetch items. " + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    setIsSubmitting(true)
    try {
      const newItem = await addItem(newTaskTitle)
      setItems([...items, newItem])
      setNewTaskTitle("")
    } catch (err) {
      setError("Failed to add item.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggle(id, currentDone) {
    try {
      const updatedItem = await toggleItem(id, !currentDone)
      setItems(items.map(it => it.id === id ? updatedItem : it))
    } catch (err) {
      setError("Failed to update item.")
    }
  }

  async function handleDelete(id) {
    try {
      await deleteItem(id)
      setItems(items.filter(it => it.id !== id))
    } catch (err) {
      setError("Failed to delete item.")
    }
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>Hackathon Starter</h1>
        <p>Build your MVP fast.</p>
      </header>

      {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}

      <form className="add-form" onSubmit={handleAdd}>
        <input
          type="text"
          className="add-input"
          placeholder="What needs to be built?"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          disabled={isSubmitting}
        />
        <button type="submit" className="btn" disabled={isSubmitting || !newTaskTitle.trim()}>
          {isSubmitting ? "..." : "Add"}
        </button>
      </form>

      {loading ? (
        <div className="status-message">Loading items...</div>
      ) : items.length === 0 ? (
        <div className="status-message">No items yet. Add one above!</div>
      ) : (
        <ul className="item-list">
          {items.map((item) => (
            <li key={item.id} className="item-row">
              <label className="item-content">
                <input
                  type="checkbox"
                  className="item-checkbox"
                  checked={item.done}
                  onChange={() => handleToggle(item.id, item.done)}
                />
                <span className={`item-title ${item.done ? 'done' : ''}`}>
                  {item.title}
                </span>
              </label>
              <button 
                className="btn delete" 
                onClick={() => handleDelete(item.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App
