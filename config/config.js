const CONFIG = {
    // Gemini API Configuration
    GEMINI_API: {
        KEY: 'AIzaSyBlAriHN3CIjQEjCQT8nOxjJsr5eswZhz4',
        URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
        MODEL: 'gemini-1.5-flash'
    },

    // Email Configuration (using EmailJS)
    EMAIL: {
        SERVICE_ID: 'service_qdihjhh',   
        TEMPLATE_ID: 'template_vwwlesj', 
        USER_ID: '_U2AUUxki998_NN2f',
        FROM_NAME: 'Sachin Singh Rajawat',
        FROM_EMAIL: 'sachinrajawat38@gmail.com'   
    },

    // Application Settings
    LANGUAGE: 'en-US',
    MAX_RECORDING_TIME: 7200, // 2 hours in seconds
    REFRESH_INTERVAL: 1000    // 1 second
};

if (!CONFIG.GEMINI_API.KEY || !CONFIG.EMAIL.USER_ID) {
    console.error('Missing required API keys');
}

// Add helper functions
CONFIG.showLoading = function() {
    document.getElementById('loadingOverlay').style.display = 'flex';
};

CONFIG.hideLoading = function() {
    document.getElementById('loadingOverlay').style.display = 'none';
};

CONFIG.showError = function(message) {
    alert('Error: ' + message);
    console.error(message);
};