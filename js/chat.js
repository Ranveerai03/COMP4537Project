document.addEventListener('DOMContentLoaded', () => {
    const chatSubmitBtn = document.getElementById('chat-submit');
    const chatInput = document.getElementById('chat-input');
    const chatResponseBox = document.getElementById('chat-response');
    
    const baseUrl = 'https://assignments.isaaclauzon.com/comp4537/llm';

    if (chatSubmitBtn) {
        chatSubmitBtn.addEventListener('click', getChatbotResponse);
    }
    
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                getChatbotResponse();
            }
        });
    }

    async function getChatbotResponse() {
        const prompt = chatInput.value;
        if (!prompt) return; 

        const API_KEY = localStorage.getItem('apiKey');

        if (!API_KEY) {
            chatResponseBox.textContent = 'Error: API Key not found. Please re-register or login.';
            return;
        }

        const API_URL = `${baseUrl}/api/ask`;

        const payload = {
            prompt: prompt,
            max_tokens: 50 
        };

        chatResponseBox.textContent = 'Thinking...'; 
        chatInput.value = ''; 

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify(payload)
            });

            console.log('Chatbot Response:', response);

            if (!response.ok) {
                const errorText = await response.text(); 
                console.error('Chatbot error response text:', errorText); 
                throw new Error(`API error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Chatbot success data:', data);

            chatResponseBox.textContent = data.answer || JSON.stringify(data);

        } catch (error) {
            console.error('Chatbot fetch error:', error); 
            chatResponseBox.textContent = `Error: ${error.message}`;
        }
    }
});