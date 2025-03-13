document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const saveButton = document.getElementById('saveKey');
  const chatDiv = document.getElementById('chat');
  const inputField = document.getElementById('input');
  const sendButton = document.getElementById('send');
  const copyButton = document.getElementById('copy');
  
  let lastResponse = '';
  
  // Load saved API key
  chrome.storage.local.get(['mistralApiKey'], function(result) {
    if (result.mistralApiKey) {
      apiKeyInput.value = result.mistralApiKey;
    }
  });
  
  // Save API key
  saveButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.local.set({mistralApiKey: apiKey}, function() {
        alert('API key saved!');
      });
    }
  });
  
  // Send message to AI
  sendButton.addEventListener('click', sendMessage);
  inputField.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendMessage();
  });
  
  function sendMessage() {
    const message = inputField.value.trim();
    if (!message) return;
    
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      alert('Please enter a Mistral AI API key');
      return;
    }
    
    // Add user message to chat
    addMessageToChat('You: ' + message);
    inputField.value = '';
    
    // Call Mistral AI API
    fetchMistralResponse(message, apiKey);
  }
  
  function fetchMistralResponse(message, apiKey) {
    addMessageToChat('AI: Thinking...');
    
    fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'mistral-tiny', // Use appropriate model name
        messages: [{
          role: 'user',
          content: message
        }],
        max_tokens: 500
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('API request failed');
      }
      return response.json();
    })
    .then(data => {
      // Remove the "thinking" message
      chatDiv.lastChild.remove();
      
      // Get and display AI response
      lastResponse = data.choices[0].message.content;
      addMessageToChat('AI: ' + lastResponse);
    })
    .catch(error => {
      chatDiv.lastChild.remove();
      addMessageToChat('Error: ' + error.message);
    });
  }
  
  function addMessageToChat(message) {
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    chatDiv.appendChild(messageElement);
    chatDiv.scrollTop = chatDiv.scrollHeight;
  }
  
  // Copy last response
  copyButton.addEventListener('click', function() {
    if (lastResponse) {
      navigator.clipboard.writeText(lastResponse)
        .then(() => {
          alert('Response copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
        });
    }
  });
});