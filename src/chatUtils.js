export const mergeChatMessages = (current, incoming) => {
  if (!Array.isArray(incoming) || incoming.length === 0) return current;

  const messagesById = new Map();
  for (const message of [...current, ...incoming]) {
    if (!message) continue;
    const id = message.id || [message.stream_key, message.username, message.created_at, message.message].join('|');
    messagesById.set(String(id), message);
  }

  return [...messagesById.values()]
    .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
    .slice(-100);
};
