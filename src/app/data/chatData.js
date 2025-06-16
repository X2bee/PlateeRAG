/**
 * @typedef {Object} Message
 * @property {string} id - Unique identifier for the message.
 * @property {string} text - The content of the message.
 * @property {'user' | 'bot'} sender - Who sent the message.
 * @property {Date} timestamp - When the message was sent.
 */

/**
 * Initial dummy messages for the chat.
 * For now, it's an empty array. We can populate it with some initial data later if needed.
 * @type {Message[]}
 */
export const dummyMessages = [];
