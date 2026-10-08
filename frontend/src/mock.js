// Fallback mock data used when the backend is offline or unreachable
let mockItems = [
  { id: 1, title: "Brainstorm hackathon project pitch (Mock)", done: true },
  { id: 2, title: "Build FastAPI backend & React frontend (Mock)", done: true },
  { id: 3, title: "Rehearse 2-minute demo with judges (Mock)", done: false },
];

export function getMockItems() {
  return [...mockItems];
}

export function addMockItem(title) {
  const newItem = {
    id: Date.now(),
    title: title.trim(),
    done: false,
  };
  mockItems.push(newItem);
  return newItem;
}

export function toggleMockItem(id, done) {
  const item = mockItems.find((it) => it.id === id);
  if (item) {
    if (done !== undefined) {
      item.done = Boolean(done);
    } else {
      item.done = !item.done;
    }
    return { ...item };
  }
  return null;
}

export function deleteMockItem(id) {
  mockItems = mockItems.filter((it) => it.id !== id);
  return { status: "deleted", id };
}
