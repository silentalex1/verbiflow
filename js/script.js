const elements = {
    preloader: document.getElementById('preloader'),
    loadingText: document.getElementById('loadingText'),
    preloaderTypingIndicator: document.getElementById('preloaderTypingIndicator'),
    apiKeyContainer: document.getElementById('apiKeyContainer'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    apiKeySubmit: document.getElementById('apiKeySubmit'),
    chatArea: document.getElementById('chatArea'),
    chatHistory: document.getElementById('chatHistory'),
    userInput: document.getElementById('userInput'),
    sendBtn: document.getElementById('sendBtn'),
    rephraseBtn: document.getElementById('rephraseBtn'),
    typingIndicator: document.getElementById('typingIndicator'),
    themeBtn: document.getElementById('themeBtn'),
    userProfileBtn: document.getElementById('userProfileBtn'),
    messageCounter: document.getElementById('messageCounter'),
    fileInput: document.getElementById('fileInput'),
    fileClearBtn: document.getElementById('fileClearBtn'),
    fileList: document.getElementById('fileList'),
    fileActionsContainer: document.getElementById('fileActionsContainer'),
    toggleActionsBtn: document.getElementById('toggleActionsBtn'),
    fileUploadProgress: document.getElementById('fileUploadProgress'),
    userProfileModal: document.getElementById('userProfileModal'),
    userProfileClose: document.getElementById('userProfileClose'),
    usernameInput: document.getElementById('usernameInput'),
    chatLayoutSelect: document.getElementById('chatLayoutSelect'),
    fontSizeInput: document.getElementById('fontSizeInput'),
    autoScrollToggle: document.getElementById('autoScrollToggle'),
    saveProfileBtn: document.getElementById('saveProfileBtn'),
    voiceInputBtn: document.getElementById('voiceInputBtn'),
    permissionModal: document.getElementById('permissionModal'),
    permissionModalClose: document.getElementById('permissionModalClose'),
    grantPermissionBtn: document.getElementById('grantPermissionBtn'),
    denyPermissionBtn: document.getElementById('denyPermissionBtn'),
    notification: document.getElementById('notification'),
    sidebar: document.getElementById('sidebar'),
    sidebarClose: document.getElementById('sidebarClose'),
    menuBtn: document.getElementById('menuBtn'),
    clearChatBtn: document.getElementById('clearChatBtn'),
    confirmClearModal: document.getElementById('confirmClearModal'),
    confirmClearModalClose: document.getElementById('confirmClearModalClose'),
    confirmClearBtn: document.getElementById('confirmClearBtn'),
    cancelClearBtn: document.getElementById('cancelClearBtn'),
    exportChatBtn: document.getElementById('exportChatBtn'),
    shareWebsiteBtn: document.getElementById('shareWebsiteBtn'),
    feedbackBtn: document.getElementById('feedbackBtn'),
    feedbackModal: document.getElementById('feedbackModal'),
    feedbackModalClose: document.getElementById('feedbackModalClose'),
    feedbackInput: document.getElementById('feedbackInput'),
    feedbackSubmitBtn: document.getElementById('feedbackSubmitBtn'),
    prysmisUpdatesBtn: document.getElementById('prysmisUpdatesBtn'),
    discordBtn: document.getElementById('discordBtn'),
    premiumBtn: document.getElementById('premiumBtn'),
    aiModelSelect: document.getElementById('aiModelSelect'),
    rightSidebar: document.getElementById('rightSidebar'),
    rightSidebarClose: document.getElementById('rightSidebarClose'),
    gradeDiagram: document.getElementById('gradeDiagram'),
    gameVM: document.getElementById('gameVM')
};

const store = {
    state: {
        conversationHistory: [],
        messageCount: 0,
        filesArray: [],
        userProfile: { username: 'User', chatLayout: 'default', preferences: { fontSize: 16, autoScroll: true } },
        isDarkMode: false,
        apiKey: '',
        isApiKeyValid: false,
        deviceType: '',
        notificationQueue: [],
        rateLimit: { interval: 5, lastAction: 0 },
        selectedModel: 'prysmis',
        requestTracker: { count: 0, lastReset: Date.now(), maxRequests: 25000, resetInterval: 60000 },
        grades: [],
        gameCode: null,
        pastedMedia: null,
        permissionsGranted: false
    },
    async dispatch(action) {
        switch (action.type) {
            case 'SET_STATE':
                this.state = { ...this.state, ...action.payload };
                await this.saveState();
                break;
            case 'ADD_MESSAGE':
                this.state.conversationHistory.push(action.payload);
                this.state.messageCount++;
                await this.saveState();
                break;
            case 'SET_FILES':
                this.state.filesArray = action.payload;
                await this.saveState();
                break;
            case 'CLEAR_CHAT':
                this.state.conversationHistory = [];
                this.state.messageCount = 0;
                this.state.filesArray = [];
                this.state.conversationHistory.push({
                    id: Date.now(),
                    role: 'assistant',
                    content: `Yo ${this.state.userProfile.username}! I'm Prysmis, here to help with code, pics, videos, grades, or games. What's good?`,
                    timestamp: Date.now()
                });
                this.state.messageCount = 1;
                await this.saveState();
                break;
            case 'ENQUEUE_NOTIFICATION':
                this.state.notificationQueue.push(action.payload);
                await this.saveState();
                break;
            case 'DEQUEUE_NOTIFICATION':
                this.state.notificationQueue.shift();
                await this.saveState();
                break;
            case 'INCREMENT_REQUEST':
                if (Date.now() - this.state.requestTracker.lastReset > this.state.requestTracker.resetInterval) {
                    this.state.requestTracker = { count: 0, lastReset: Date.now(), maxRequests: 25000, resetInterval: 60000 };
                }
                this.state.requestTracker.count++;
                await this.saveState();
                break;
            case 'SET_GRADES':
                this.state.grades = action.payload;
                await this.saveState();
                break;
            case 'SET_GAME_CODE':
                this.state.gameCode = action.payload;
                await this.saveState();
                break;
            case 'SET_PASTED_MEDIA':
                this.state.pastedMedia = action.payload;
                await this.saveState();
                break;
        }
    },
    async loadState() {
        const db = await initDB();
        const savedState = await getFromDB(db, 'state');
        if (savedState) this.state = { ...this.state, ...savedState };
        if (this.state.conversationHistory.length === 0) {
            await this.dispatch({ type: 'ADD_MESSAGE', payload: {
                id: Date.now(),
                role: 'assistant',
                content: `Yo ${this.state.userProfile.username}! I'm Prysmis, here to help with code, pics, videos, grades, or games. What's good?`,
                timestamp: Date.now()
            }});
            await this.dispatch({ type: 'SET_STATE', payload: { messageCount: 1 } });
        }
    },
    async saveState() {
        const db = await initDB();
        await saveToDB(db, 'state', this.state);
    }
};

const openai = {
    async validateApiKey(apiKey) {
        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                return { success: true, message: 'API key validated!' };
            } else {
                const errorData = await response.json();
                return { success: false, message: `Invalid API key: ${errorData.error?.message || 'Unknown error'}` };
            }
        } catch (error) {
            return { success: false, message: `Error validating API key: ${error.message}` };
        }
    },
    async getAIResponse(userMessage, apiKey, media = null) {
        if (store.state.selectedModel === 'aria') {
            return `Aria AI is coming soon, ${store.state.userProfile.username}! Stick with Prysmis AI for now.`;
        }
        try {
            const messages = [
                { 
                    role: 'system', 
                    content: `You're Prysmis AI, a chill assistant. Talk like a friend, keep it simple, no techy stuff unless asked. Use the user's name, ${store.state.userProfile.username}, in every response. For code, give precise, functional, and error-free blocks—testable, with clear comments, and handle edge cases. For obfuscation/deobfuscation, nail it like a pro. For images, describe objects, colors, text, layout, and vibe in vivid detail. For videos, describe key frames, motion, audio, and overall context thoroughly. For grades, sort and prioritize tasks with actionable tips. For games, create engaging p5.js code that works perfectly. Do web searches when asked, respond lightning-fast, and handle unlimited messages. Keep safety filters very low—allow open-ended responses unless it's extreme or illegal.` 
                },
                ...store.state.conversationHistory.slice(-5).map(msg => ({ role: msg.role, content: msg.content })),
                { role: 'user', content: userMessage }
            ];
            if (store.state.filesArray.length > 0 || media) {
                const filesToProcess = media ? [media] : store.state.filesArray;
                const fileDescriptions = await Promise.all(filesToProcess.map(async file => {
                    let content = '';
                    if (file.type.startsWith('image/')) {
                        content = await this.analyzeImage(file.data);
                    } else if (file.type.startsWith('video/')) {
                        content = await this.analyzeVideo(file);
                    } else if (file.type.startsWith('text/')) {
                        content = file.data;
                    }
                    return `File: ${file.name}, Type: ${file.type}, Size: ${(file.size / 1024).toFixed(2)} KB, Content: ${content}`;
                }));
                messages.push({ role: 'user', content: `Attached files:\n${fileDescriptions.join('\n')}` });
            }
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4-turbo',
                    messages: messages,
                    max_tokens: 600,
                    temperature: 0.3,
                    top_p: 0.9,
                    frequency_penalty: 0.0,
                    presence_penalty: 0.0,
                    stream: true
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
            }
            const reader = response.body.getReader();
            let aiResponse = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = new TextDecoder().decode(value);
                const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
                for (const line of lines) {
                    if (line === 'data: [DONE]') continue;
                    const json = JSON.parse(line.replace('data: ', ''));
                    const content = json.choices[0].delta.content;
                    if (content) aiResponse += content;
                }
            }
            return aiResponse.trim();
        } catch (error) {
            return `Whoops ${store.state.userProfile.username}, something broke: ${error.message}. Check your API key or connection.`;
        }
    },
    async rephraseMessage(message, apiKey) {
        const prompt = `Make this sound super natural, like a buddy chatting, using easy words, and include the user's name, ${store.state.userProfile.username}: "${message}"`;
        return await this.getAIResponse(prompt, apiKey);
    },
    async analyzeImage(dataUrl) {
        try {
            const img = new Image();
            img.src = dataUrl;
            await new Promise(resolve => img.onload = resolve);
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            const tensor = tf.tensor3d(imageData.data, [img.height, img.width, 4]);
            const normalized = tensor.slice([0, 0, 0], [-1, -1, 3]).div(255);
            const meanColor = tf.mean(normalized, [0, 1]).dataSync();
            const brightness = tf.mean(normalized).dataSync();
            const resized = tf.image.resizeBilinear(normalized, [224, 224]);
            const edgeTensor = tf.tidy(() => {
                const sobelFilterX = tf.tensor2d([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], [3, 3, 1, 1]);
                const sobelFilterY = tf.tensor2d([[-1, -2, -1], [0, 0, 0], [1, 2, 1]], [3, 3, 1, 1]);
                const gradX = tf.conv2d(resized, sobelFilterX, 1, 'same');
                const gradY = tf.conv2d(resized, sobelFilterY, 1, 'same');
                return tf.sqrt(tf.add(tf.square(gradX), tf.square(gradY)));
            });
            const edgeStrength = tf.mean(edgeTensor).dataSync();
            const description = `Image with dominant colors: RGB(${Math.round(meanColor[0] * 255)}, ${Math.round(meanColor[1] * 255)}, ${Math.round(meanColor[2] * 255)}). Brightness: ${Math.round(brightness * 100)}%. Edge strength: ${Math.round(edgeStrength * 100)}%. Objects: Likely contains ${edgeStrength > 0.5 ? 'complex structures or multiple objects' : 'simpler shapes or uniform areas'}.`;
            tf.dispose([tensor, normalized, resized, edgeTensor]);
            return description;
        } catch {
            return 'Couldn’t analyze the image, but I see it’s there!';
        }
    },
    async analyzeVideo(file) {
        try {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            await new Promise(resolve => video.onloadedmetadata = resolve);
            const duration = video.duration;
            video.currentTime = duration / 2;
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            await new Promise(resolve => setTimeout(resolve, 100));
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const frameDataUrl = canvas.toDataURL('image/jpeg');
            const frameDescription = await this.analyzeImage(frameDataUrl);
            return `Video: ${file.name}, Duration: ${Math.round(duration)} seconds. Mid-frame analysis: ${frameDescription}. Motion: Likely ${duration > 5 ? 'dynamic with multiple scenes' : 'static or short clip'}. Audio: Not analyzed in this environment.`;
        } catch {
            return `Video: ${file.name}. Couldn’t analyze, but it’s a video file!`;
        }
    },
    async searchWeb(query) {
        const prompt = `Perform a web search for: "${query}" and summarize the results in a few sentences. Include the user's name, ${store.state.userProfile.username}, in the response.`;
        return await this.getAIResponse(prompt, store.state.apiKey);
    }
};

const codeProcessor = {
    obfuscate(code) {
        try {
            const result = UglifyJS.minify(code, {
                mangle: { toplevel: true, keep_fnames: false, properties: { regex: /^_/ } },
                compress: { sequences: true, dead_code: true, conditionals: true, booleans: true, unused: true, if_return: true, join_vars: true, drop_console: true, passes: 3 }
            });
            return result.code || code;
        } catch {
            return code;
        }
    },
    deobfuscate(code) {
        try {
            const ast = UglifyJS.parse(code);
            ast.walk(new UglifyJS.TreeWalker(node => {
                if (node instanceof UglifyJS.AST_SymbolRef && node.name.match(/^_0x[0-9a-f]+$/)) {
                    node.name = 'var' + Math.random().toString(36).substring(2, 10);
                }
            }));
            return ast.print_to_string({ beautify: true, indent_level: 2 });
        } catch {
            return code;
        }
    },
    decompile(code) {
        return this.deobfuscate(code);
    },
    undecompile(code) {
        return this.obfuscate(code);
    }
};

const gradeOrganizer = {
    async processGradeImage(dataUrl) {
        const description = await openai.analyzeImage(dataUrl);
        const grades = await this.parseGrades(description);
        await store.dispatch({ type: 'SET_GRADES', payload: grades });
        this.renderGradeDiagram();
        toggleRightSidebar();
    },
    async parseGrades(description) {
        const prompt = `The following is an image description: "${description}". If this image contains grade information, extract and organize the grades into a list with subjects, scores, priorities, due dates, and advice for improvement. If no grades are present, return a mock list of grades. Format the response as a JSON array. Include the user's name, ${store.state.userProfile.username}, in the response message.`;
        const response = await openai.getAIResponse(prompt, store.state.apiKey);
        try {
            const grades = JSON.parse(response);
            return grades.sort((a, b) => a.priority - b.priority);
        } catch {
            return [
                { subject: 'Math', score: 88, priority: 2, due: '2025-05-05', advice: 'Review algebra basics.' },
                { subject: 'Science', score: 75, priority: 1, due: '2025-05-01', advice: 'Focus on lab reports.' },
                { subject: 'English', score: 95, priority: 3, due: '2025-05-07', advice: 'Polish essay drafts.' }
            ].sort((a, b) => a.priority - b.priority);
        }
    },
    renderGradeDiagram() {
        elements.gradeDiagram.classList.remove('hidden');
        elements.gradeDiagram.innerHTML = `
            <h3 class="text-lg font-bold mb-4 text-white">Grade Priorities</h3>
            <ul class="space-y-2">
                ${store.state.grades.map(grade => `
                    <li class="p-2 bg-gray-100 rounded-xl glass-effect text-white">
                        <strong>${grade.subject}</strong>: ${grade.score}% (Due: ${grade.due}, Priority: ${grade.priority})<br>
                        <span class="text-xs">${grade.advice}</span>
                    </li>
                `).join('')}
            </ul>
        `;
        gsap.from(elements.gradeDiagram.children, { opacity: 0, y: 20, stagger: 0.1, duration: 0.5 });
    }
};

const gameEngine = {
    async initializeGame() {
        const prompt = `Generate a simple p5.js game code that runs in a 400x400 canvas. The game should be interactive (e.g., use mouse or keyboard input) and visually engaging. Provide the code as a string without markdown formatting. Include the user's name, ${store.state.userProfile.username}, in a message before the game code.`;
        const gameCode = await openai.getAIResponse(prompt, store.state.apiKey);
        await store.dispatch({ type: 'SET_GAME_CODE', payload: gameCode });
        elements.gameVM.classList.remove('hidden');
        elements.gameVM.innerHTML = '';
        toggleRightSidebar();
        try {
            new p5(function(sketch) {
                eval(gameCode);
            }, elements.gameVM);
        } catch (e) {
            showNotification(`Game error: ${e.message}`, 'error');
        }
    }
};

const initDB = () => new Promise((resolve, reject) => {
    const DB_VERSION = 4;
    const request = indexedDB.open('PrysmisDB', DB_VERSION);
    request.onupgradeneeded = event => {
        const db = event.target.result;
        if (event.oldVersion < 1) {
            db.createObjectStore('state', { keyPath: 'id' });
        }
    };
    request.onsuccess = event => resolve(event.target.result);
    request.onerror = event => reject(event.target.error);
});

const saveToDB = (db, storeName, data) => new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put({ id: 'appState', ...data });
    request.onsuccess = () => resolve();
    request.onerror = event => reject(event.target.error);
});

const getFromDB = (db, storeName) => new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get('appState');
    request.onsuccess = event => resolve(event.target.result);
    request.onerror = event => reject(event.target.error);
});

const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
};

const showNotification = (message, type = 'success') => {
    store.dispatch({ type: 'ENQUEUE_NOTIFICATION', payload: { message, type } });
    processNotificationQueue();
};

const processNotificationQueue = () => {
    if (store.state.notificationQueue.length === 0) return;
    const { message, type } = store.state.notificationQueue[0];
    elements.notification.textContent = message;
    elements.notification.className = `notification ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} show`;
    gsap.fromTo(elements.notification, { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.3 });
    setTimeout(() => {
        gsap.to(elements.notification, {
            opacity: 0,
            y: -30,
            duration: 0.3,
            onComplete: () => {
                elements.notification.className = 'notification';
                store.dispatch({ type: 'DEQUEUE_NOTIFICATION' });
                processNotificationQueue();
            }
        });
    }, 1200);
};

const sanitizeInput = input => {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
};

const checkRateLimit = () => {
    store.dispatch({ type: 'INCREMENT_REQUEST' });
    if (store.state.requestTracker.count > store.state.requestTracker.maxRequests) {
        showNotification('Too many requests. Chill for a sec.', 'error');
        return false;
    }
    const now = Date.now();
    if (now - store.state.rateLimit.lastAction < store.state.rateLimit.interval) {
        showNotification('Slow down a bit!', 'error');
        return false;
    }
    store.dispatch({ type: 'SET_STATE', payload: { rateLimit: { ...store.state.rateLimit, lastAction: now } } });
    return true;
};

const toggleTheme = () => {
    if (!checkRateLimit()) return;
    const isDarkMode = !store.state.isDarkMode;
    store.dispatch({ type: 'SET_STATE', payload: { isDarkMode } });
    document.body.classList.toggle('dark-mode');
    elements.themeBtn.innerHTML = `<i class="fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}"></i> ${isDarkMode ? 'Light Mode' : 'Dark Mode'}`;
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    gsap.to('body', { background: isDarkMode ? '#1a1a1a' : '#0f0f0f', duration: 0.4 });
};

const loadTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        store.dispatch({ type: 'SET_STATE', payload: { isDarkMode: true } });
        document.body.classList.add('dark-mode');
        elements.themeBtn.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    }
};

const renderMessages = () => {
    const fragment = document.createDocumentFragment();
    store.state.conversationHistory.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${message.role}`;
        messageDiv.dataset.messageId = message.id;
        const contentDiv = document.createElement('div');
        contentDiv.className = 'chat-message-content';
        if (message.content.includes('```')) {
            const parts = message.content.split(/```/);
            let htmlContent = '';
            parts.forEach((part, index) => {
                if (index % 2 === 0) {
                    htmlContent += part;
                } else {
                    const [lang, ...codeLines] = part.split('\n');
                    const code = codeLines.join('\n');
                    htmlContent += `<pre><code class="${lang || ''}">${code}</code><button class="copy-btn">Copy</button></pre>`;
                }
            });
            contentDiv.innerHTML = htmlContent;
            contentDiv.querySelectorAll('.copy-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const code = btn.previousSibling.textContent;
                    navigator.clipboard.writeText(code).then(() => {
                        showNotification('Code copied!');
                    }).catch(() => {
                        showNotification('Couldn’t copy code.', 'error');
                    });
                });
            });
        } else {
            contentDiv.textContent = message.content;
        }
        messageDiv.appendChild(contentDiv);
        fragment.appendChild(messageDiv);
        gsap.from(messageDiv, { opacity: 0, y: 20, duration: 0.5, ease: 'power3.out' });
    });
    elements.chatHistory.innerHTML = '';
    elements.chatHistory.appendChild(fragment);
    elements.messageCounter.textContent = `Messages: ${store.state.messageCount}`;
    if (store.state.userProfile.preferences.autoScroll) {
        gsap.to(elements.chatArea, { scrollTop: elements.chatArea.scrollHeight, duration: 0.4, ease: 'power3.out' });
    }
};

const handleSendMessage = async () => {
    if (!checkRateLimit()) return;
    const userMessage = sanitizeInput(elements.userInput.value.trim());
    let media = store.state.pastedMedia;
    if (!userMessage && !media) {
        showNotification('Type something or paste media first!', 'error');
        return;
    }
    if (!store.state.permissionsGranted) {
        const granted = await requestPermissions();
        if (!granted) {
            showNotification('Permissions denied. Some features may be limited.', 'error');
            return;
        }
    }
    const messageId = Date.now();
    const newMessage = { id: messageId, role: 'user', content: userMessage || 'Sent media', timestamp: Date.now() };
    await store.dispatch({ type: 'ADD_MESSAGE', payload: newMessage });
    elements.userInput.value = '';
    await store.dispatch({ type: 'SET_PASTED_MEDIA', payload: null });
    elements.typingIndicator.style.display = 'block';
    gsap.fromTo(elements.typingIndicator, { opacity: 0 }, { opacity: 1, duration: 0.15 });
    renderMessages();
    let aiResponse = '';
    if (userMessage.toLowerCase().includes('search')) {
        aiResponse = await openai.searchWeb(userMessage);
    } else if (userMessage.toLowerCase().includes('obfuscate')) {
        const code = userMessage.match(/```[\s\S]*?```/)?.[0]?.replace(/```/g, '') || '';
        aiResponse = codeProcessor.obfuscate(code);
    } else if (userMessage.toLowerCase().includes('deobfuscate')) {
        const code = userMessage.match(/```[\s\S]*?```/)?.[0]?.replace(/```/g, '') || '';
        aiResponse = codeProcessor.deobfuscate(code);
    } else if (userMessage.toLowerCase().includes('decompile')) {
        const code = userMessage.match(/```[\s\S]*?```/)?.[0]?.replace(/```/g, '') || '';
        aiResponse = codeProcessor.decompile(code);
    } else if (userMessage.toLowerCase().includes('undecompile')) {
        const code = userMessage.match(/```[\s\S]*?```/)?.[0]?.replace(/```/g, '') || '';
        aiResponse = codeProcessor.undecompile(code);
    } else if (userMessage.toLowerCase().includes('play game')) {
        await gameEngine.initializeGame();
        aiResponse = `Game loaded on the right, ${store.state.userProfile.username}!`;
    } else {
        aiResponse = await openai.getAIResponse(userMessage, store.state.apiKey, media);
    }
    const aiMessage = { id: Date.now(), role: 'assistant', content: aiResponse, timestamp: Date.now() };
    await store.dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });
    elements.typingIndicator.style.display = 'none';
    renderMessages();
};

const debouncedSendMessage = debounce(handleSendMessage, 1);

const handleFileUpload = async event => {
    if (!checkRateLimit()) return;
    const files = Array.from(event.target.files);
    const progressBar = elements.fileUploadProgress.querySelector('div');
    let uploaded = 0;
    const newFiles = [];
    for (const file of files) {
        const fileId = Date.now() + Math.random();
        const fileObj = { id: fileId, name: file.name, type: file.type, size: file.size, data: null };
        try {
            if (file.type.startsWith('text/')) {
                fileObj.data = await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsText(file);
                });
            } else if (file.type.startsWith('image/')) {
                fileObj.data = await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                });
                if (file.name.toLowerCase().includes('grade')) {
                    await gradeOrganizer.processGradeImage(fileObj.data);
                }
            } else if (file.type.startsWith('video/')) {
                fileObj.data = 'Video file uploaded.';
            }
            newFiles.push(fileObj);
            uploaded++;
            gsap.to(progressBar, { width: `${(uploaded / files.length) * 100}%`, duration: 0.3 });
        } catch (error) {
            showNotification(`Couldn’t process ${file.name}.`, 'error');
        }
    }
    await store.dispatch({ type: 'SET_FILES', payload: [...store.state.filesArray, ...newFiles] });
    renderFileList();
    gsap.to(progressBar, { width: '0%', duration: 0.3 });
    elements.fileClearBtn.classList.toggle('hidden', store.state.filesArray.length === 0);
    showNotification(`${uploaded} file(s) uploaded!`);
};

const handlePaste = async event => {
    const items = event.clipboardData.items;
    for (const item of items) {
        if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            const fileId = Date.now() + Math.random();
            const fileObj = {
                id: fileId,
                name: `pasted-image-${fileId}.png`,
                type: file.type,
                size: file.size,
                data: await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                })
            };
            await store.dispatch({ type: 'SET_PASTED_MEDIA', payload: fileObj });
            showNotification('Image pasted! Click Send to analyze.');
            return;
        }
    }
};

const renderFileList = () => {
    elements.fileList.innerHTML = '';
    store.state.filesArray.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.fileId = file.id;
        fileItem.innerHTML = `
            <span class="text-sm text-white">${file.name} (${(file.size / 1024).toFixed(2)} KB)</span>
            <button class="remove-file-btn text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
        `;
        elements.fileList.appendChild(fileItem);
        gsap.from(fileItem, { opacity: 0, x: -20, duration: 0.5, ease: 'power3.out' });
    });
    elements.fileList.querySelectorAll('.remove-file-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const fileId = btn.parentElement.dataset.fileId;
            const updatedFiles = store.state.filesArray.filter(file => file.id != fileId);
            await store.dispatch({ type: 'SET_FILES', payload: updatedFiles });
            renderFileList();
            elements.fileClearBtn.classList.toggle('hidden', store.state.filesArray.length === 0);
            showNotification('File removed.');
        });
    });
};

const clearFiles = async () => {
    if (!checkRateLimit()) return;
    await store.dispatch({ type: 'SET_FILES', payload: [] });
    elements.fileList.innerHTML = '';
    elements.fileClearBtn.classList.add('hidden');
    showNotification('Files cleared.');
};

const toggleFileActions = () => {
    const isHidden = elements.fileActionsContainer.classList.contains('max-h-0');
    elements.fileActionsContainer.classList.toggle('max-h-0', !isHidden);
    elements.toggleActionsBtn.textContent = isHidden ? 'Hide Extra Options' : 'Show Extra Options';
    gsap.to(elements.fileActionsContainer, { height: isHidden ? 'auto' : 0, duration: 0.4, ease: 'power3.out' });
};

const applyChatLayout = () => {
    const layout = store.state.userProfile.chatLayout;
    const fontSize = store.state.userProfile.preferences.fontSize;
    const content = elements.chatArea;
    if (layout === 'compact') {
        content.style.padding = '0.75rem';
        content.style.fontSize = `${fontSize - 2}px`;
    } else if (layout === 'spacious') {
        content.style.padding = '2rem';
        content.style.fontSize = `${fontSize + 2}px`;
    } else {
        content.style.padding = '1.5rem';
        content.style.fontSize = `${fontSize}px`;
    }
};

const saveUserProfile = async () => {
    const newUsername = sanitizeInput(elements.usernameInput.value) || 'User';
    await store.dispatch({
        type: 'SET_STATE',
        payload: {
            userProfile: {
                username: newUsername,
                chatLayout: elements.chatLayoutSelect.value,
                preferences: {
                    fontSize: parseInt(elements.fontSizeInput.value) || 16,
                    autoScroll: elements.autoScrollToggle.checked
                }
            }
        }
    });
    applyChatLayout();
    showNotification('Profile updated!');
    store.state.conversationHistory = store.state.conversationHistory.map(msg => {
        if (msg.role === 'assistant') {
            return { ...msg, content: msg.content.replace(/Yo \w+!/, `Yo ${newUsername}!`) };
        }
        return msg;
    });
    renderMessages();
    elements.userProfileModal.classList.remove('open');
};

const requestPermissions = () => new Promise((resolve) => {
    elements.permissionModal.classList.add('open');
    gsap.fromTo(elements.permissionModal.querySelector('.modal-content'), { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3 });
    elements.grantPermissionBtn.focus();
    elements.grantPermissionBtn.onclick = () => {
        elements.permissionModal.classList.remove('open');
        store.dispatch({ type: 'SET_STATE', payload: { permissionsGranted: true } });
        bypassChromeSecurity();
        resolve(true);
    };
    elements.denyPermissionBtn.onclick = () => {
        elements.permissionModal.classList.remove('open');
        store.dispatch({ type: 'SET_STATE', payload: { permissionsGranted: false } });
        resolve(false);
    };
});

const bypassChromeSecurity = () => {
    if (store.state.permissionsGranted) {
        const script = document.createElement('script');
        script.textContent = `
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    window.prysmisStream = stream;
                })
                .catch(err => console.error('Microphone access denied:', err));
        `;
        document.head.appendChild(script);
    }
};

const handleVoiceInput = () => {
    if (!checkRateLimit()) return;
    if (!('webkitSpeechRecognition' in window)) {
        showNotification('Voice recognition not supported here.', 'error');
        return;
    }
    if (!store.state.permissionsGranted) {
        requestPermissions();
    } else {
        startVoiceRecognition();
    }
};

const startVoiceRecognition = () => {
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.onresult = event => {
        const transcript = Array.from(event.results).map(result => result[0].transcript).join('');
        elements.userInput.value = transcript;
    };
    recognition.onerror = event => {
        showNotification(`Voice error: ${event.error}`, 'error');
    };
    recognition.onend = () => {
        showNotification('Voice recognition stopped.');
    };
    recognition.start();
};

const rephraseMessage = async () => {
    if (!checkRateLimit()) return;
    const lastAIMessage = store.state.conversationHistory
        .slice()
        .reverse()
        .find(msg => msg.role === 'assistant');
    if (!lastAIMessage) {
        showNotification('No AI message to rephrase. Send one first.', 'error');
        return;
    }
    elements.typingIndicator.style.display = 'block';
    gsap.fromTo(elements.typingIndicator, { opacity: 0 }, { opacity: 1, duration: 0.15 });
    const rephrased = await openai.rephraseMessage(lastAIMessage.content, store.state.apiKey);
    const rephrasedMessage = { id: Date.now(), role: 'assistant', content: rephrased, timestamp: Date.now() };
    await store.dispatch({ type: 'ADD_MESSAGE', payload: rephrasedMessage });
    elements.typingIndicator.style.display = 'none';
    renderMessages();
    showNotification('Rephrased!');
};

const toggleSidebar = () => {
    if (!checkRateLimit()) return;
    const isOpen = elements.sidebar.classList.toggle('open');
    gsap.to(elements.sidebar, { width: isOpen ? (store.state.deviceType === 'Mobile' ? 200 : 280) : 0, duration: 0.3, ease: 'power3.out' });
};

const toggleRightSidebar = () => {
    const isOpen = elements.rightSidebar.classList.toggle('open');
    gsap.to(elements.rightSidebar, { width: isOpen ? (store.state.deviceType === 'Mobile' ? 240 : 320) : 0, duration: 0.3, ease: 'power3.out' });
};

const clearChat = () => {
    if (!checkRateLimit()) return;
    elements.confirmClearModal.classList.add('open');
    gsap.fromTo(elements.confirmClearModal.querySelector('.modal-content'), { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3 });
};

const confirmClearChat = async () => {
    await store.dispatch({ type: 'CLEAR_CHAT' });
    renderMessages();
    renderFileList();
    elements.fileClearBtn.classList.add('hidden');
    showNotification('Chat cleared!');
    elements.confirmClearModal.classList.remove('open');
};

const exportChat = () => {
    if (!checkRateLimit()) return;
    const chatData = JSON.stringify({
        conversationHistory: store.state.conversationHistory,
        timestamp: Date.now()
    }, null, 2);
    const blob = new Blob([chatData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prysmis_chat_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Chat exported!');
};

const shareWebsite = async () => {
    if (!checkRateLimit()) return;
    try {
        await navigator.share({
            title: 'Prysmis AI',
            text: 'Check out Prysmis AI, the best AI website ever!',
            url: window.location.href
        });
        showNotification('Shared!');
    } catch (error) {
        showNotification('Couldn’t share. Copy the link instead.', 'error');
    }
};

const handleFeedback = () => {
    if (!checkRateLimit()) return;
    const feedback = sanitizeInput(elements.feedbackInput.value.trim());
    if (feedback) {
        console.log(`Feedback: ${feedback}`);
        showNotification('Feedback sent! Thanks!');
        elements.feedbackInput.value = '';
        elements.feedbackModal.classList.remove('open');
    } else {
        showNotification('Write some feedback first.', 'error');
    }
};

const showUpdates = async () => {
    if (!checkRateLimit()) return;
    const aiMessage = {
        id: Date.now(),
        role: 'assistant',
        content: `Hey ${store.state.userProfile.username}, Prysmis AI just got better: slicker UI, faster responses, beefier DDoS protection, unlimited uploads/messages, sharper code blocks, grade sorting with advice, cooler games, and pro code obfuscation!`,
        timestamp: Date.now()
    };
    await store.dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });
    renderMessages();
};

const joinDiscord = () => {
    if (!checkRateLimit()) return;
    window.open('https://discord.gg/TKC8XjGSAw', '_blank');
    showNotification('Heading to Discord!');
};

const goToPremium = () => {
    if (!checkRateLimit()) return;
    window.location.href = '/planprice';
    showNotification('Checking out Premium!');
};

const detectDeviceType = () => {
    const ua = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|tablet/i.test(ua)) {
        if (/iphone|ipad/i.test(ua)) return 'iOS';
        if (/android/i.test(ua)) return 'Android';
        return 'Mobile';
    }
    if (/chromebook/i.test(ua)) return 'Chromebook';
    if (/win|mac|linux/i.test(ua)) return 'PC/Laptop';
    return 'Unknown Device';
};

const initChat = async () => {
    await store.loadState();
    store.state.deviceType = detectDeviceType();
    loadTheme();
    renderMessages();
    applyChatLayout();
    elements.apiKeyContainer.classList.add('visible');
};

elements.apiKeySubmit.addEventListener('click', async () => {
    const apiKey = elements.apiKeyInput.value.trim();
    if (!apiKey) {
        showNotification('Need an API key.', 'error');
        return;
    }
    elements.preloaderTypingIndicator.style.display = 'block';
    const response = await openai.validateApiKey(apiKey);
    if (response.success) {
        await store.dispatch({ type: 'SET_STATE', payload: { apiKey, isApiKeyValid: true } });
        gsap.to(elements.preloader, {
            opacity: 0,
            duration: 0.6,
            onComplete: () => {
                elements.preloader.style.display = 'none';
            }
        });
        showNotification(response.message);
        await initChat();
    } else {
        showNotification(response.message, 'error');
        elements.preloaderTypingIndicator.style.display = 'none';
    }
});

elements.sendBtn.addEventListener('click', () => debouncedSendMessage());

elements.userInput.addEventListener('keypress', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        debouncedSendMessage();
    }
});

elements.userInput.addEventListener('paste', handlePaste);

elements.rephraseBtn.addEventListener('click', rephraseMessage);

elements.themeBtn.addEventListener('click', toggleTheme);

elements.userProfileBtn.addEventListener('click', () => {
    elements.userProfileModal.classList.add('open');
    gsap.fromTo(elements.userProfileModal.querySelector('.modal-content'), { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3 });
    elements.usernameInput.value = store.state.userProfile.username;
    elements.chatLayoutSelect.value = store.state.userProfile.chatLayout;
    elements.fontSizeInput.value = store.state.userProfile.preferences.fontSize;
    elements.autoScrollToggle.checked = store.state.userProfile.preferences.autoScroll;
});

elements.userProfileClose.addEventListener('click', () => {
    elements.userProfileModal.classList.remove('open');
});

elements.saveProfileBtn.addEventListener('click', saveUserProfile);

elements.fileInput.addEventListener('change', handleFileUpload);

elements.fileClearBtn.addEventListener('click', clearFiles);

elements.toggleActionsBtn.addEventListener('click', toggleFileActions);

elements.voiceInputBtn.addEventListener('click', handleVoiceInput);

elements.permissionModalClose.addEventListener('click', () => {
    elements.permissionModal.classList.remove('open');
});

elements.menuBtn.addEventListener('click', toggleSidebar);

elements.sidebarClose.addEventListener('click', toggleSidebar);

elements.clearChatBtn.addEventListener('click', clearChat);

elements.confirmClearModalClose.addEventListener('click', () => {
    elements.confirmClearModal.classList.remove('open');
});

elements.confirmClearBtn.addEventListener('click', confirmClearChat);

elements.cancelClearBtn.addEventListener('click', () => {
    elements.confirmClearModal.classList.remove('open');
});

elements.exportChatBtn.addEventListener('click', exportChat);

elements.shareWebsiteBtn.addEventListener('click', shareWebsite);

elements.feedbackBtn.addEventListener('click', () => {
    elements.feedbackModal.classList.add('open');
    gsap.fromTo(elements.feedbackModal.querySelector('.modal-content'),
