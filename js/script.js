const DISCORD_INVITE = "https://discord.gg/rCTRQvD4TP";
const APP_URL = "https://verbiflow.app/download";

const chatHistory = document.getElementById('chatHistory');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const fileClearBtn = document.getElementById('fileClearBtn');
const fileActionsContainer = document.getElementById('fileActionsContainer');
const filePreviewModal = document.getElementById('filePreviewModal');
const filePreviewContent = document.getElementById('filePreviewContent');
const filePreviewClose = document.getElementById('filePreviewClose');
const loadingSpinner = document.getElementById('loadingSpinner');
const typingIndicator = document.getElementById('typingIndicator');
const chatArea = document.getElementById('chatArea');
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const sidebarClose = document.getElementById('sidebarClose');
const clearChatBtn = document.getElementById('clearChatBtn');
const copyCodeBtn = document.getElementById('copyCodeBtn');
const discordBtn = document.getElementById('discordBtn');
const verbiflowUpdatesBtn = document.getElementById('verbiflowUpdatesBtn');
const premiumPriceBtn = document.getElementById('premiumPriceBtn');
const shareChatBtn = document.getElementById('shareChatBtn');
const shareWebsiteBtn = document.getElementById('shareWebsiteBtn');
const themeBtn = document.getElementById('themeBtn');
const openInAppBtn = document.getElementById('openInAppBtn');
const notification = document.getElementById('notification');
const toggleActionsBtn = document.getElementById('toggleActionsBtn');
const generateMediaBtn = document.getElementById('generateMediaBtn');
const voiceSearchBtn = document.getElementById('voiceSearchBtn');
const schoolHelpDropdown = document.getElementById('schoolHelpDropdown');
const aiModelDropdown = document.getElementById('aiModelDropdown');
const languageDropdown = document.getElementById('languageDropdown');
const rephraseBtn = document.getElementById('rephraseBtn');
const stopGeneratingBtn = document.getElementById('stopGeneratingBtn');
const feedbackBtn = document.getElementById('feedbackBtn');
const feedbackModal = document.getElementById('feedbackModal');
const feedbackInput = document.getElementById('feedbackInput');
const feedbackSubmitBtn = document.getElementById('feedbackSubmitBtn');
const permissionModal = document.getElementById('permissionModal');
const grantPermissionBtn = document.getElementById('grantPermissionBtn');
const denyPermissionBtn = document.getElementById('denyPermissionBtn');

let filesArray = [];
let conversationHistory = [{ role: "assistant", content: "Hey there, I’m VerbiFlow—your ultra-fast AI companion for creativity, coding, analytics, and more! What’s on your mind?" }];
let latestCodeBlocks = [];
let isDarkMode = false;
let isGenerating = false;

function showNotification(message, type = 'success') {
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    setTimeout(() => { notification.className = 'notification'; }, 2500);
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode');
    themeBtn.innerHTML = `<i class="fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}"></i> ${isDarkMode ? 'Light Mode' : 'Dark Mode'}`;
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        isDarkMode = true;
        document.body.classList.add('dark-mode');
        themeBtn.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    } else {
        themeBtn.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
    }
}

function addMessageToChat(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}`;
    messageDiv.innerHTML = `
        <div class="chat-message-content">${content}</div>
        <div class="chat-message-meta">Just now</div>
    `;
    chatHistory.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function simulateAIResponse(userMessage) {
    // Simulate AI response since API calls won't work on GitHub Pages
    return new Promise((resolve) => {
        setTimeout(() => {
            const response = `This is a simulated response to: "${userMessage}". (API calls are disabled on GitHub Pages. To enable full functionality, host this site with a backend server.)`;
            resolve(response);
        }, 1000);
    });
}

async function handleSendMessage() {
    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    addMessageToChat('user', userMessage);
    userInput.value = '';
    typingIndicator.style.display = 'block';

    const aiResponse = await simulateAIResponse(userMessage);
    typingIndicator.style.display = 'none';
    addMessageToChat('ai', aiResponse);
    conversationHistory.push({ role: "user", content: userMessage }, { role: "assistant", content: aiResponse });
}

function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    filesArray.push(...files);
    updateFileList();
    fileClearBtn.style.display = 'block';
}

function updateFileList() {
    fileList.innerHTML = '';
    filesArray.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-item-name">${file.name}</span>
            <span class="file-item-details">${(file.size / 1024).toFixed(2)} KB</span>
        `;
        fileItem.addEventListener('click', () => previewFile(file));
        fileList.appendChild(fileItem);
    });
}

function previewFile(file) {
    filePreviewContent.innerHTML = '';
    if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        filePreviewContent.appendChild(img);
    } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.controls = true;
        filePreviewContent.appendChild(video);
    } else {
        filePreviewContent.textContent = `Preview not available for ${file.name}`;
    }
    filePreviewModal.classList.add('open');
}

function clearFiles() {
    filesArray = [];
    fileList.innerHTML = '';
    fileClearBtn.style.display = 'none';
    fileInput.value = '';
}

function toggleSidebar() {
    sidebar.classList.toggle('open');
}

function toggleFileActions() {
    fileActionsContainer.classList.toggle('collapsed');
    toggleActionsBtn.classList.toggle('collapsed');
}

// Event Listeners
sendBtn.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});
fileInput.addEventListener('change', handleFileUpload);
fileClearBtn.addEventListener('click', clearFiles);
filePreviewClose.addEventListener('click', () => filePreviewModal.classList.remove('open'));
menuBtn.addEventListener('click', toggleSidebar);
sidebarClose.addEventListener('click', toggleSidebar);
clearChatBtn.addEventListener('click', () => {
    chatHistory.innerHTML = '';
