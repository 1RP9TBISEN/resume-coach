import {
  getMockItems,
  addMockItem,
  toggleMockItem,
  deleteMockItem,
} from "./mock";

// Vite handles the proxy in dev mode. When built or on a different host, it uses this.
const BASE_URL = import.meta.env.VITE_API_URL || "";

/**
 * Fetch all items. Falls back to mock data if backend fails.
 */
export async function getItems() {
  try {
    const res = await fetch(`${BASE_URL}/api/items`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn("[API] getItems failed, falling back to mock data:", err.message);
    return getMockItems();
  }
}

/**
 * Add a new item. Falls back to mock data if backend fails.
 */
export async function addItem(title) {
  try {
    const res = await fetch(`${BASE_URL}/api/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn("[API] addItem failed, falling back to mock data:", err.message);
    return addMockItem(title);
  }
}

/**
 * Toggle or update an item's status. Falls back to mock data if backend fails.
 */
export async function toggleItem(id, done) {
  try {
    const res = await fetch(`${BASE_URL}/api/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn("[API] toggleItem failed, falling back to mock data:", err.message);
    return toggleMockItem(id, done);
  }
}

/**
 * Delete an item. Falls back to mock data if backend fails.
 */
export async function deleteItem(id) {
  try {
    const res = await fetch(`${BASE_URL}/api/items/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn("[API] deleteItem failed, falling back to mock data:", err.message);
    return deleteMockItem(id);
  }
}
