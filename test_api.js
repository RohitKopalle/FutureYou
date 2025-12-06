// const fetch = require('node-fetch'); // Using global fetch

const apiKey = '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';

async function testApi() {
    try {
        console.log('Testing Mistral 7B...');
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://futureyou.app',
                'X-Title': 'FutureYou'
            },
            body: JSON.stringify({
                model: 'mistralai/mistral-7b-instruct:free',
                messages: [
                    {
                        role: 'user',
                        content: 'Say hello'
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
        } else {
            const data = await response.json();
            console.log('Success:', data);
        }
    } catch (error) {
        console.error('Network Error:', error);
    }
}

testApi();
