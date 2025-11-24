async function callAPI(prompt, maxTokens = 50) {
  const API_KEY = "3a7f8c9e2b1d4a6f5e8c9a2b3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2";
  
  const response = await fetch(`https://ai.ranveerrai.ca/generate?prompt=${encodeURIComponent(prompt)}&max_tokens=${maxTokens}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  });
  
  const data = await response.json();
  return data;
}

callAPI("Hello").then(data => console.log(data));