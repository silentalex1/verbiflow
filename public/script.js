const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const newChatBtn = document.getElementById('newChatBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const signInBtn = document.getElementById('signInBtn');
const userStatus = document.getElementById('userStatus');
const errorMessage = document.getElementById('errorMessage');
const chatArea = document.getElementById('chatArea');
const chatHistory = document.getElementById('chatHistory');
const imageInput = document.getElementById('imageInput');
const sendImageBtn = document.getElementById('sendImageBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsBtnMobile = document.getElementById('settingsBtnMobile');
const settingsUI = document.getElementById('settingsUI');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const modelSelect = document.getElementById('modelSelect');
const customInstructions = document.getElementById('customInstructions');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const aiTabBtn = document.getElementById('aiTabBtn');
const optimizationTabBtn = document.getElementById('optimizationTabBtn');
const aiTab = document.getElementById('aiTab');
const optimizationTab = document.getElementById('optimizationTab');
const codeBlockSelect = document.getElementById('codeBlockSelect');
const responseSpeed = document.getElementById('responseSpeed');
const intelligenceLevel = document.getElementById('intelligenceLevel');
const saveOptimizationBtn = document.getElementById('saveOptimizationBtn');
let currentChatId = null;
let selectedModel = 'gpt-4.1-nano';
let customInstructionsText = '';
let codeBlockStyle = 'default';
let responseSpeedSetting = 'fast';
let intelligenceLevelSetting = 'standard';
const SYSTEM_PROMPT = `You are Prysmis, an advanced AI designed to provide precise, insightful, and human-like responses across all topics. You process text, images, and websites, analyzing content with depth, including objects, context, colors, composition, and intent. Format responses with markdown: **bold**, *italics*, _underline_, ~~strikethrough~~, \`inline code\`. Deliver answers with natural tone, logical coherence, and bypassGPT humanization, adapting to user needs with clarity and depth.`;

function checkAuth() {
    if (puter.auth.isSignedIn()) {
        const user = puter.auth.getUser();
        userStatus.textContent = `Welcome ${user.username}.`;
        signInBtn.textContent = 'Sign Out';
        loadChatHistory();
    } else {
        userStatus.textContent = 'Sign in to save your chats';
        signInBtn.textContent = 'Sign In';
        chatHistory.innerHTML = '';
        chatArea.innerHTML = '<div class="text-center text-gray-400 mt-20 text-lg">Sign in and start a new chat!</div>';
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => errorMessage.classList.add('hidden'), 4000);
}

function fetchLinkContent(url) {
    return fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
        .then(response => response.json())
        .then(data => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.contents, 'text/html');
            const title = doc.querySelector('title')?.textContent || 'No title';
            const description = doc.querySelector('meta[name="description"]')?.content || doc.querySelector('meta[property="og:description"]')?.content || 'No description available';
            return { title, description, content: data.contents.substring(0, 2000) };
        })
        .catch(() => ({ title: 'Link Preview', description: 'Unable to fetch content', content: '' }));
}

function executeCode(code, language) {
    const executionArea = document.createElement('div');
    executionArea.className = 'code-execution-area';
    const header = document.createElement('div');
    header.className = 'execution-header';
    header.textContent = `Execution Output (${language})`;
    const output = document.createElement('div');
    output.className = 'execution-output';
    executionArea.appendChild(header);
    executionArea.appendChild(output);
    try {
        if (language === 'javascript' || language === 'js') {
            const originalLog = console.log;
            let logs = [];
            console.log = (...args) => logs.push(args.join(' '));
            try {
                const result = eval(code);
                if (result !== undefined) logs.push(`Result: ${result}`);
            } catch (e) {
                logs.push(`Error: ${e.message}`);
            }
            console.log = originalLog;
            output.textContent = logs.join('\n') || 'Code executed successfully (no output)';
        } else if (language === 'html') {
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '200px';
            iframe.style.border = 'none';
            iframe.style.borderRadius = '8px';
            iframe.srcdoc = code;
            output.appendChild(iframe);
        } else if (language === 'css') {
            const style = document.createElement('style');
            style.textContent = code;
            document.head.appendChild(style);
            output.textContent = 'CSS applied to page';
        } else {
            output.textContent = `Code execution not supported for ${language}`;
        }
    } catch (error) {
        output.textContent = `Execution Error: ${error.message}`;
    }
    return executionArea;
}

function parseToHTML(text) {
    let html = text.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
               .replace(/\*(.*?)\*/g, '<em>$1</em>')
               .replace(/_(.*?)_/g, '<u>$1</u>')
               .replace(/~~(.*?)~~/g, '<del>$1</del>')
               .replace(/`(.*?)`/g, '<code class="inline-code bg-gray-900 px-2 py-1 rounded text-sm">$1</code>');

    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        const language = lang.trim() || 'plaintext';
        const highlightedCode = Prism.languages[language] ? Prism.highlight(code.trim(), Prism.languages[language], language) : code.trim().replace(/</g, '<').replace(/>/g, '>');
        let className = 'ai-code-block';
        if (codeBlockStyle === 'minimal') className += ' minimal';
        if (codeBlockStyle === 'enhanced') className += ' enhanced';
        const canExecute = ['javascript', 'js', 'html', 'css'].includes(language);
        const runButton = canExecute ? '<button class="run-btn">Run</button>' : '';
        return `<div class="${className}" data-language="${language}">
                    <div class="code-block-header">
                        <span>${language}</span>
                        <div>
                            <button class="copy-btn">Copy</button>
                            ${runButton}
                        </div>
                    </div>
                    <pre class="language-${language}"><code class="language-${language}">${highlightedCode}</code></pre>
                    <textarea style="display:none;">${code.trim()}</textarea>
                </div>`;
    });

    if (urls) {
        urls.forEach(async (url) => {
            const linkData = await fetchLinkContent(url);
            const linkPreview = `<div class="link-preview">
                <h3>${linkData.title}</h3>
                <p>${linkData.description}</p>
                <a href="${url}" target="_blank" class="text-purple-400 hover:text-purple-300">${url}</a>
            </div>`;
            html = html.replace(url, linkPreview);
        });
    }

    return html;
}

function addMessage(content, isUser, messageId = null) {
    if (chatArea.innerHTML.includes('start a new chat')) {
        chatArea.innerHTML = '';
    }
    const div = document.createElement('div');
    const bubbleType = isUser ? 'user-bubble' : 'ai-bubble';
    div.className = `chat-bubble ${bubbleType}`;
    div.dataset.messageId = messageId || Date.now().toString();
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    actionsDiv.innerHTML = '<button class="delete-btn">×</button>';
    div.innerHTML = isUser ? content : parseToHTML(content);
    div.appendChild(actionsDiv);
    chatArea.appendChild(div);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function deleteMessage(messageElement) {
    messageElement.style.animation = 'fade-in-up 0.3s ease reverse';
    setTimeout(() => {
        messageElement.remove();
        saveChat();
    }, 300);
}

function clearChat() {
    chatArea.innerHTML = '';
    if (currentChatId && puter.auth.isSignedIn()) {
        puter.fs.delete(`/chat_${currentChatId}.json`);
        puter.fs.delete(`/chattitle_${currentChatId}.txt`);
        loadChatHistory();
    }
    currentChatId = null;
}

function saveChat() {
    if (!puter.auth.isSignedIn() || !currentChatId) return;
    const messages = Array.from(chatArea.children).map(div => ({
        content: div.innerHTML.replace(/<div class="message-actions">.*?<\/div>/, ''),
        isUser: div.classList.contains('user-bubble'),
        messageId: div.dataset.messageId
    }));
    puter.fs.write(`/chat_${currentChatId}.json`, JSON.stringify(messages));
    const firstUserMessage = messages.find(m => m.isUser)?.content.replace(/<[^>]*>/g, '').substring(0, 40) || 'New Chat';
    puter.fs.write(`/chattitle_${currentChatId}.txt`, firstUserMessage);
    loadChatHistory();
}

function loadChatHistory() {
    if (!puter.auth.isSignedIn()) return;
    puter.fs.list().then(files => {
        chatHistory.innerHTML = '';
        const chatFiles = files.filter(file => file.name.startsWith('chat_'));
        if (chatFiles.length === 0) {
            chatHistory.innerHTML = '<li class="p-3 text-gray-500 text-sm text-center">No chats found</li>';
        } else {
            chatFiles.forEach(file => {
                const chatId = file.name.replace('chat_', '').replace('.json', '');
                let title = `Chat ${chatId}`;
                puter.fs.read(`/chattitle_${chatId}.txt`).then(titleBlob => {
                    title = titleBlob.text();
                }).catch(() => {});
                const li = document.createElement('li');
                li.className = 'history-item text-sm truncate';
                li.textContent = title;
                li.dataset.chatId = chatId;
                li.addEventListener('click', () => {
                    currentChatId = li.dataset.chatId;
                    puter.fs.read(`/chat_${currentChatId}.json`).then(blob => {
                        const messages = JSON.parse(blob.text());
                        chatArea.innerHTML = '';
                        messages.forEach(msg => {
                            const div = document.createElement('div');
                            div.className = `chat-bubble ${msg.isUser ? 'user-bubble' : 'ai-bubble'}`;
                            div.dataset.messageId = msg.messageId || Date.now().toString();
                            const actionsDiv = document.createElement('div');
                            actionsDiv.className = 'message-actions';
                            actionsDiv.innerHTML = '<button class="delete-btn">×</button>';
                            div.innerHTML = msg.content;
                            div.appendChild(actionsDiv);
                            chatArea.appendChild(div);
                        });
                        chatArea.scrollTop = chatArea.scrollHeight;
                    });
                });
                chatHistory.appendChild(li);
            });
        }
    }).catch(() => showError('Failed to load chat history'));
}

signInBtn.addEventListener('click', () => {
    if (puter.auth.isSignedIn()) {
        puter.auth.signOut();
        userStatus.textContent = 'Sign in to save your chats';
        signInBtn.textContent = 'Sign In';
        chatHistory.innerHTML = '';
        chatArea.innerHTML = '<div class="text-center text-gray-400 mt-20 text-lg">Sign in and start a new chat!</div>';
    } else {
        puter.auth.signIn().then(() => {
            const user = puter.auth.getUser();
            userStatus.textContent = `Welcome ${user.username}.`;
            signInBtn.textContent = 'Sign Out';
            loadChatHistory();
        });
    }
});

newChatBtn.addEventListener('click', () => {
    if (!puter.auth.isSignedIn()) {
        showError('Please sign in to start a new chat');
        return;
    }
    currentChatId = Date.now().toString();
    chatArea.innerHTML = '';
    messageInput.value = '';
});

clearChatBtn.addEventListener('click', () => {
    if (chatArea.children.length === 0) {
        showError('No messages to clear');
        return;
    }
    if (confirm('Are you sure you want to clear this chat?')) {
        clearChat();
    }
});

settingsBtn.addEventListener('click', () => {
    settingsUI.classList.remove('hidden');
});

settingsBtnMobile.addEventListener('click', () => {
    settingsUI.classList.remove('hidden');
});

closeSettingsBtn.addEventListener('click', () => {
    settingsUI.classList.add('hidden');
});

aiTabBtn.addEventListener('click', () => {
    aiTab.classList.remove('hidden');
    optimizationTab.classList.add('hidden');
    aiTabBtn.classList.add('bg-indigo-700');
    optimizationTabBtn.classList.remove('bg-indigo-700');
});

optimizationTabBtn.addEventListener('click', () => {
    optimizationTab.classList.remove('hidden');
    aiTab.classList.add('hidden');
    optimizationTabBtn.classList.add('bg-indigo-700');
    aiTabBtn.classList.remove('bg-indigo-700');
});

saveSettingsBtn.addEventListener('click', () => {
    if (!puter.auth.isSignedIn()) {
        showError('Please sign in to save settings');
        return;
    }
    selectedModel = modelSelect.value;
    customInstructionsText = customInstructions.value.trim() || '';
    codeBlockStyle = codeBlockSelect.value;
    responseSpeedSetting = responseSpeed.value;
    intelligenceLevelSetting = intelligenceLevel.value;
    applySettings();
    if (!currentChatId) {
        currentChatId = Date.now().toString();
    }
    saveChat();
    settingsUI.classList.add('hidden');
});

saveOptimizationBtn.addEventListener('click', () => {
    if (!puter.auth.isSignedIn()) {
        showError('Please sign in to save settings');
        return;
    }
    selectedModel = modelSelect.value;
    customInstructionsText = customInstructions.value.trim() || '';
    codeBlockStyle = codeBlockSelect.value;
    responseSpeedSetting = responseSpeed.value;
    intelligenceLevelSetting = intelligenceLevel.value;
    applySettings();
    if (!currentChatId) {
        currentChatId = Date.now().toString();
    }
    saveChat();
    settingsUI.classList.add('hidden');
});

function applySettings() {
    document.body.className = `text-gray-200 font-sans flex h-screen ${codeBlockStyle === 'minimal' ? 'minimal-ui' : ''}`;
    chatArea.className = `flex-1 p-8 overflow-y-auto chat-area ${responseSpeedSetting === 'fastest' ? 'fast-response' : ''}`;
    messageInput.className = `flex-1 p-4 main-input text-white rounded-xl placeholder-gray-400 font-medium sm:p-3 ${intelligenceLevelSetting === 'max' ? 'smart-input' : ''}`;
}

async function streamAndDisplayResponse(prompt) {
    if (chatArea.innerHTML.includes('start a new chat')) {
        chatArea.innerHTML = '';
    }
    addMessage('', false);
    const aiMessageDiv = chatArea.lastChild;
    const loadingIndicator = document.createElement('span');
    loadingIndicator.className = 'animate-pulse text-purple-400';
    loadingIndicator.textContent = '● ● ●';
    aiMessageDiv.appendChild(loadingIndicator);
    chatArea.scrollTop = chatArea.scrollHeight;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = prompt.match(urlRegex);
    let fullPrompt = prompt;
    if (urls) {
        const linkPromises = urls.map(async (url) => {
            const linkData = await fetchLinkContent(url);
            return `\n\nLink content from ${url}:\nTitle: ${linkData.title}\nDescription: ${linkData.description}\nContent preview: ${linkData.content}`;
        });
        const linkContents = await Promise.all(linkPromises);
        fullPrompt += linkContents.join('');
    }
    fullPrompt = `${SYSTEM_PROMPT}\n${customInstructionsText}\n\nUser: ${fullPrompt}`;
    let temperature = 0.3;
    if (responseSpeedSetting === 'faster') temperature = 0.2;
    if (responseSpeedSetting === 'fastest') temperature = 0.1;
    let topP = 0.9;
    if (intelligenceLevelSetting === 'high') topP = 0.85;
    if (intelligenceLevelSetting === 'max') topP = 0.8;
    const customConfig = { model: selectedModel, stream: true, temperature: temperature, top_p: topP, max_tokens: 4000 };
    try {
        const response = await puter.ai.chat(fullPrompt, customConfig);
        let aiResponse = '';
        for await (const part of response) {
            aiResponse += part?.text || '';
            if (aiMessageDiv.contains(loadingIndicator)) {
                aiMessageDiv.removeChild(loadingIndicator);
            }
            aiMessageDiv.innerHTML = parseToHTML(aiResponse);
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions';
            actionsDiv.innerHTML = '<button class="delete-btn">×</button>';
            aiMessageDiv.appendChild(actionsDiv);
            chatArea.scrollTop = chatArea.scrollHeight;
        }
        Prism.highlightAllUnder(aiMessageDiv);
    } catch (error) {
        showError('Failed to get response from AI. Please try again.');
        aiMessageDiv.innerHTML = 'Error loading response.';
    }
    saveChat();
}

sendMessageBtn.addEventListener('click', async () => {
    if (!puter.auth.isSignedIn()) {
        showError('Please sign in to send messages');
        return;
    }
    const content = messageInput.value.trim();
    if (!content) return;
    if (!currentChatId) {
        currentChatId = Date.now().toString();
    }
    addMessage(content, true);
    messageInput.value = '';
    await streamAndDisplayResponse(content);
});

sendImageBtn.addEventListener('click', () => {
    if (!puter.auth.isSignedIn()) {
        showError('Please sign in to send images');
        return;
    }
    imageInput.click();
});

imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
            const imageData = event.target.result;
            if (!currentChatId) {
                currentChatId = Date.now().toString();
            }
            addMessage(`<img src="${imageData}" class="image-preview">`, true);
            const prompt = `Analyze this image in detail. Describe its contents, context, objects, people, text, colors, composition, and any notable features. Provide insights with depth, logical coherence, and a natural, bypassGPT-compliant tone. Image data: ${imageData}`;
            await streamAndDisplayResponse(prompt);
        };
        reader.readAsDataURL(file);
    } else {
        showError('Please select a valid image file');
    }
    imageInput.value = '';
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessageBtn.click();
    }
});

chatArea.addEventListener('click', function(event) {
    if (event.target.classList.contains('copy-btn')) {
        const codeBlock = event.target.closest('.ai-code-block');
        const codeToCopy = codeBlock.querySelector('textarea').value;
        navigator.clipboard.writeText(codeToCopy).then(() => {
            event.target.textContent = 'Copied!';
            setTimeout(() => {
                event.target.textContent = 'Copy';
            }, 2000);
        });
    }
    if (event.target.classList.contains('run-btn')) {
        const codeBlock = event.target.closest('.ai-code-block');
        const code = codeBlock.querySelector('textarea').value;
        const language = codeBlock.dataset.language;
        const executionResult = executeCode(code, language);
        codeBlock.appendChild(executionResult);
        event.target.textContent = 'Executed';
        setTimeout(() => {
            event.target.textContent = 'Run';
        }, 2000);
    }
    if (event.target.classList.contains('delete-btn')) {
        const messageElement = event.target.closest('.chat-bubble');
        deleteMessage(messageElement);
    }
});

checkAuth();
aiTabBtn.click();
applySettings();
