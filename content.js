// Wait for the page to fully load
window.addEventListener('load', function() {
  // First check if we have a saved API key
  chrome.storage.local.get(['mistralApiKey'], function(result) {
    const hasApiKey = result.mistralApiKey && result.mistralApiKey.trim() !== '';
    
    // Create main AI Assistant container
    const container = document.createElement('div');
    container.id = 'ai-assistant-container';
    container.style.display = 'none'; // Initially hidden
    
    // Create header with drag functionality
    const header = document.createElement('div');
    header.id = 'ai-assistant-header';
    header.innerHTML = `
      <h4 id="ai-assistant-title">Exam.net AI Assistant</h4>
      <button id="ai-assistant-minimize">_</button>
      <button id="ai-assistant-close">×</button>
    `;
    
    // Create content area
    const content = document.createElement('div');
    content.id = 'ai-assistant-content';
    
    // Create API key section (only shown if no key is saved)
    const apiSection = document.createElement('div');
    apiSection.id = 'ai-assistant-api-section';
    apiSection.style.display = hasApiKey ? 'none' : 'block';
    apiSection.innerHTML = `
      <input type="text" id="ai-assistant-api-key" placeholder="Enter your Mistral AI API key">
      <button id="ai-assistant-save-key">Save</button>
    `;
    
    // Create chat interface
    const chatInterface = document.createElement('div');
    chatInterface.innerHTML = `
      <div id="ai-assistant-chat"></div>
      <div id="ai-assistant-input-area">
        <input type="text" id="ai-assistant-input" placeholder="Ask AI...">
        <button id="ai-assistant-send">Send</button>
        <button id="ai-assistant-copy">Copy</button>
      </div>
    `;
    
    // Assemble the components
    content.appendChild(apiSection);
    content.appendChild(chatInterface);
    container.appendChild(header);
    container.appendChild(content);
    document.body.appendChild(container);
    
    // Create floating button (now hidden by default since we're using keyboard shortcut)
    const aiButton = document.createElement('button');
    aiButton.textContent = 'AI Assistant';
    aiButton.style.position = 'fixed';
    aiButton.style.right = '20px';
    aiButton.style.top = '20px';
    aiButton.style.zIndex = '10000';
    aiButton.style.padding = '10px';
    aiButton.style.backgroundColor = '#FF8C00'; // Orange color for exam.net theme
    aiButton.style.color = 'white';
    aiButton.style.border = 'none';
    aiButton.style.borderRadius = '5px';
    aiButton.style.cursor = 'pointer';
    aiButton.style.display = 'none'; // Hide the button by default
    document.body.appendChild(aiButton);
    
    // Add CSS styles
    const style = document.createElement('style');
    style.textContent = `
      #ai-assistant-container {
        position: fixed;
        z-index: 2147483647;
        width: 320px;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        right: 20px;
        top: 20px;
        font-family: Arial, sans-serif;
      }
      
      #ai-assistant-header {
        padding: 10px;
        background-color: #FF8C00; /* Orange for exam.net theme */
        color: white;
        cursor: move;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 8px 8px 0 0;
      }
      
      #ai-assistant-title {
        font-weight: bold;
        margin: 0;
      }
      
      #ai-assistant-close, #ai-assistant-minimize {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
        color: white;
      }
      
      #ai-assistant-content {
        padding: 10px;
      }
      
      #ai-assistant-chat {
        height: 250px;
        overflow-y: auto;
        border: 1px solid #ccc;
        padding: 10px;
        margin-bottom: 10px;
        background-color: #f9f9f9;
      }
      
      #ai-assistant-input-area {
        display: flex;
        gap: 5px;
      }
      
      #ai-assistant-input {
        flex-grow: 1;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
      
      #ai-assistant-send, #ai-assistant-copy, #ai-assistant-save-key {
        padding: 8px 12px;
        background-color: #FF8C00; /* Orange for exam.net theme */
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      
      #ai-assistant-copy {
        background-color: #FFA500; /* Slightly different orange for copy button */
      }
      
      .ai-message {
        margin-bottom: 8px;
        padding: 8px;
        border-radius: 4px;
        max-width: 80%;
        word-wrap: break-word;
      }
      
      .user-message {
        background-color: #FFE4B5; /* Light orange for user messages */
        margin-left: auto;
      }
      
      .assistant-message {
        background-color: #F1F1F1;
      }
      
      #ai-assistant-api-key {
        width: 100%;
        padding: 8px;
        margin-bottom: 5px;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
    `;
    document.head.appendChild(style);
    
    // Initialize variables for chat
    let lastResponse = '';
    let isDragging = false;
    let offsetX, offsetY;
    
    // Keyboard shortcut listener (Ctrl+Shift+A)
    // You can change these keys to your preferred combination
    let keys = {
      ctrl: false,
      shift: false,
      a: false
    };
    
    document.addEventListener('keydown', function(e) {
      // Update key states
      if (e.key === 'Control') keys.ctrl = true;
      if (e.key === 'Shift') keys.shift = true;
      if (e.key.toLowerCase() === 'a') keys.a = true;
      
      // Check if keyboard shortcut is triggered (Ctrl+Shift+A)
      if (keys.ctrl && keys.shift && keys.a) {
        toggleAssistant();
        // Prevent default behavior
        e.preventDefault();
      }
    });
    
    document.addEventListener('keyup', function(e) {
      // Reset key states
      if (e.key === 'Control') keys.ctrl = false;
      if (e.key === 'Shift') keys.shift = false;
      if (e.key.toLowerCase() === 'a') keys.a = false;
    });
    
    function toggleAssistant() {
      if (container.style.display === 'none') {
        container.style.display = 'block';
      } else {
        container.style.display = 'none';
      }
    }
    
    // Event listeners
    aiButton.addEventListener('click', function() {
      container.style.display = 'block';
    });
    
    document.getElementById('ai-assistant-close').addEventListener('click', function() {
      container.style.display = 'none';
    });
    
    document.getElementById('ai-assistant-minimize').addEventListener('click', function() {
      container.style.display = 'none';
    });
    
    // Save API key
    document.getElementById('ai-assistant-save-key').addEventListener('click', function() {
      const apiKey = document.getElementById('ai-assistant-api-key').value.trim();
      if (apiKey) {
        chrome.storage.local.set({mistralApiKey: apiKey}, function() {
          addMessageToChat('System: API key saved successfully.');
          document.getElementById('ai-assistant-api-section').style.display = 'none';
        });
      }
    });
    
    // Send message
    document.getElementById('ai-assistant-send').addEventListener('click', sendMessage);
    document.getElementById('ai-assistant-input').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') sendMessage();
    });
    
    // Copy response
    document.getElementById('ai-assistant-copy').addEventListener('click', function() {
      if (lastResponse) {
        navigator.clipboard.writeText(lastResponse)
          .then(() => {
            addMessageToChat('System: Response copied to clipboard!');
          })
          .catch(err => {
            console.error('Failed to copy: ', err);
            addMessageToChat('System: Failed to copy text.');
          });
      }
    });
    
    // Make the header draggable
    header.addEventListener('mousedown', function(e) {
      if (e.target === header || e.target.id === 'ai-assistant-title') {
        isDragging = true;
        offsetX = e.clientX - container.getBoundingClientRect().left;
        offsetY = e.clientY - container.getBoundingClientRect().top;
      }
    });
    
    document.addEventListener('mousemove', function(e) {
      if (isDragging) {
        container.style.left = (e.clientX - offsetX) + 'px';
        container.style.top = (e.clientY - offsetY) + 'px';
        container.style.right = 'auto'; // Override the default right value
      }
    });
    
    document.addEventListener('mouseup', function() {
      isDragging = false;
    });
    
    function sendMessage() {
      const inputField = document.getElementById('ai-assistant-input');
      const message = inputField.value.trim();
      if (!message) return;
      
      // Get API key
      chrome.storage.local.get(['mistralApiKey'], function(result) {
        const apiKey = result.mistralApiKey;
        if (!apiKey) {
          addMessageToChat('System: Please add your Mistral AI API key.');
          document.getElementById('ai-assistant-api-section').style.display = 'block';
          return;
        }
        
        // Add user message to chat
        addMessageToChat('You: ' + message, 'user-message');
        inputField.value = '';
        
        // Call Mistral AI API
        fetchMistralResponse(message, apiKey);
      });
    }
    
    function fetchMistralResponse(message, apiKey) {
      addMessageToChat('AI: Thinking...', 'assistant-message');
      
      fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'mistral-tiny',
          messages: [{
            role: 'user',
            content: message
          }],
          max_tokens: 500
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('API request failed: ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        // Remove the "thinking" message
        const chatDiv = document.getElementById('ai-assistant-chat');
        chatDiv.removeChild(chatDiv.lastChild);
        
        // Get and display AI response
        lastResponse = data.choices[0].message.content;
        addMessageToChat('AI: ' + lastResponse, 'assistant-message');
      })
      .catch(error => {
        const chatDiv = document.getElementById('ai-assistant-chat');
        chatDiv.removeChild(chatDiv.lastChild);
        addMessageToChat('Error: ' + error.message, 'assistant-message');
      });
    }
    
    function addMessageToChat(message, className) {
      const chatDiv = document.getElementById('ai-assistant-chat');
      const messageElement = document.createElement('div');
      messageElement.textContent = message;
      messageElement.className = 'ai-message ' + (className || '');
      chatDiv.appendChild(messageElement);
      chatDiv.scrollTop = chatDiv.scrollHeight;
    }
  });
});