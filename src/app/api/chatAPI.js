/**
 * Simulates sending a message to a chat API and receiving a response.
 * @param {string} message - The message to send.
 * @returns {Promise<{text: string}>} A promise that resolves with a response object.
 */
export const sendMessage = (message) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                text: `This is a response to your message: "${message}"`,
            });
        }, 1000); // Simulate 1 second delay
    });
};
