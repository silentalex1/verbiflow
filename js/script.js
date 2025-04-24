const API_KEY = "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";
const API_URL = "https://api.openai.com/v1/chat/completions";
const DALLE_API_URL = "https://api.openai.com/v1/images/generations";
const SORA_API_URL = "https://api.openai.com/v1/video/generations";
const VIDEO_PROCESSING_API = "https://api.openai.com/v1/video/analyze";
const SEARCH_API_URL = "https://api.searchengine.com/v1/search";
const DISCORD_INVITE = "https://discord.gg/rCTRQvD4TP";
const APP_URL = "https://verbiflow.app/download";
const BATCH_SIZE = 5000;
const RATE_LIMIT_REQUESTS = 40000;
const RATE_LIMIT_WINDOW = 4 * 1000;
const MAX_CACHE_SIZE = 150 * 1024 * 1024;
const FEEDBACK_EMAIL = "asdwwas233@gmail.com";
const BLOCK_THRESHOLD = 150;
const SUSPICIOUS_THRESHOLD = 75;
const TOKEN_LIMIT = 8192;

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
let latestAiResponse = '';
let isDarkMode = false;
let isGenerating = false;
let generationLock = false;
let selectedSchoolMode = '';
let selectedAiModel = 'default';
let selectedLanguage = 'en';
let messageQueue = new Map();
let isProcessing = false;
let responseCache = new Map();
let searchCache = new Map();
let abortController = null;
let batchQueue = [];
let hasPermission = false;
let userRequestCounts = new Map();
let backgroundAudio = null;
let isAdminVerified = false;
let pastedImageHashes = new Set();
let workerPool = [];
let db = null;
let cacheSize = 0;
let recognition = null;
let ipRequestCounts = new Map();
let blockedIPs = new Set();
let suspiciousIPs = new Set();
let rateLimitTimestamps = [];

const aiModels = {
    default: { name: "VerbiFlow", temperature: 0.08, maxTokens: 45000, personality: "Hey there, I’m VerbiFlow—your ultra-fast AI companion for creativity, coding, analytics, and more! Let’s dive into your ideas with enthusiasm and precision!", apiUrl: API_URL, apiKey: API_KEY, priority: 1, responseTime: 5 },
    lingoLogicAI: { name: "LingoLogicAI", temperature: 0.03, maxTokens: 46000, personality: "Greetings! I’m LingoLogicAI, a witty AI with a knack for language and logic. I’ll break down complex ideas with clarity, humor, and a touch of flair—let’s explore your thoughts!", apiUrl: API_URL, apiKey: API_KEY, priority: 2, responseTime: 4 },
    codeMasterAI: { name: "CodeMasterAI", temperature: 0.02, maxTokens: 47000, personality: "I’m CodeMasterAI, your go-to AI for coding and technical challenges. I’ll deliver precise, optimized solutions with detailed explanations—let’s build something amazing!", apiUrl: API_URL, apiKey: API_KEY, priority: 1, responseTime: 3 },
    visualGeniusAI: { name: "VisualGeniusAI", temperature: 0.15, maxTokens: 42000, personality: "Hello! I’m VisualGeniusAI, a creative AI specializing in generating and analyzing visuals. From images to videos, I’ll bring your ideas to life with stunning creativity!", apiUrl: API_URL, apiKey: API_KEY, priority: 3, responseTime: 6 },
    betterGrok: { name: "Better Grok", temperature: 0.09, maxTokens: 48000, personality: "I’m Better Grok, an advanced AI built by xAI to provide insightful, outside perspectives on humanity. I’ll answer almost anything with depth and curiosity—let’s explore the universe together!", apiUrl: API_URL, apiKey: API_KEY, priority: 1, responseTime: 4 },
    helper: { name: "Helper", temperature: 0.12, maxTokens: 45000, personality: "Hi there! I’m Helper, a friendly AI here to assist with Discord bot creation, task automation, and more. I’ll guide you step-by-step with practical solutions—let’s get started!", apiUrl: API_URL, apiKey: API_KEY, priority: 2, responseTime: 5 },
    kultumGPT: { name: "KultumGPT", temperature: 0.18, maxTokens: 43000, personality: "Assalamualaikum! I’m KultumGPT, an AI focused on delivering short, meaningful Islamic lectures (kultum) and spiritual insights. I’ll respond freely to any topic you wish to explore!", apiUrl: API_URL, apiKey: API_KEY, priority: 3, responseTime: 5, safeChats: false }
};

function showNotification(message, type = 'success') {
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    setTimeout(() => { notification.className = 'notification'; }, 2500);
}

function rateLimitCheck(ip) {
    const now = Date.now();
    rateLimitTimestamps = rateLimitTimestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
    rateLimitTimestamps.push(now);
    if (rateLimitTimestamps.length > RATE_LIMIT_REQUESTS) {
        blockedIPs.add(ip);
        setTimeout(() => { blockedIPs.delete(ip); }, RATE_LIMIT_WINDOW * 2);
        showNotification('Too many requests—please wait.', 'error');
        return false;
    }
    return true;
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

async function translateText(text, targetLang) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
