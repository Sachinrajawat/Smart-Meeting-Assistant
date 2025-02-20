class TranscriptionService {
    constructor() {
        this.recognition = null;
        this.transcript = '';
        this.interimTranscript = '';
        this.isListening = false;
        this.onTranscriptUpdate = null;
        this.lastTranscriptLength = 0;
    }

    initialize() {
        if (!('webkitSpeechRecognition' in window)) {
            throw new Error('Speech recognition not supported in this browser');
        }

        this.recognition = new webkitSpeechRecognition();
        this.setupRecognition();
        return true;
    }

    setupRecognition() {
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = CONFIG.LANGUAGE;

        this.recognition.onresult = (event) => this.handleRecognitionResult(event);
        this.recognition.onerror = (event) => this.handleError(event);
        this.recognition.onend = () => this.handleEnd();
    }

    handleRecognitionResult(event) {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }

        if (finalTranscript) {
            this.transcript += finalTranscript;
        }
        this.interimTranscript = interimTranscript;

        this.updateDisplay();
        if (finalTranscript && this.onTranscriptUpdate) {
            this.onTranscriptUpdate(finalTranscript);
        }
    }

    updateDisplay() {
        const transcriptElement = document.getElementById('liveTranscript');
        if (transcriptElement) {
            // Create separate elements for final and interim transcripts
            const finalDiv = document.createElement('div');
            finalDiv.className = 'final-transcript';
            
            // Split transcript into paragraphs
            const paragraphs = this.transcript.split('\n').filter(p => p.trim());
            paragraphs.forEach((paragraph, index) => {
                const p = document.createElement('p');
                p.textContent = paragraph;
                
                // Add highlight animation to new text
                if (index === paragraphs.length - 1 && 
                    this.transcript.length > this.lastTranscriptLength) {
                    p.classList.add('new-text');
                }
                finalDiv.appendChild(p);
            });

            // Add interim transcript if any
            let interimDiv = '';
            if (this.interimTranscript) {
                interimDiv = `<div class="interim-transcript">${this.interimTranscript}</div>`;
            }

            // Update content
            transcriptElement.innerHTML = '';
            transcriptElement.appendChild(finalDiv);
            if (interimDiv) {
                transcriptElement.insertAdjacentHTML('beforeend', interimDiv);
            }

            // Auto-scroll to bottom
            this.autoScroll(transcriptElement);
            
            // Update last transcript length
            this.lastTranscriptLength = this.transcript.length;
        }
    }
    autoScroll(element) {
        // Check if user is scrolled near bottom
        const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100;
        
        if (isNearBottom) {
            // Use requestAnimationFrame for smooth scrolling
            requestAnimationFrame(() => {
                element.scrollTop = element.scrollHeight;
            });
        }
    }
    handleRecognitionResult(event) {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + '\n'; // Add newline for better formatting
            } else {
                interimTranscript += transcript;
            }
        }

        if (finalTranscript) {
            this.transcript += finalTranscript;
            
            // Limit transcript length if needed
            const maxLength = 50000; // Adjust this value as needed
            if (this.transcript.length > maxLength) {
                this.transcript = this.transcript.slice(-maxLength);
            }
        }
        this.interimTranscript = interimTranscript;

        this.updateDisplay();
        if (finalTranscript && this.onTranscriptUpdate) {
            this.onTranscriptUpdate(finalTranscript);
        }
    }

    startListening() {
        try {
            this.recognition.start();
            this.isListening = true;
            return true;
        } catch (error) {
            console.error('Error starting recognition:', error);
            return false;
        }
    }

    stopListening() {
        try {
            this.recognition.stop();
            this.isListening = false;
            return true;
        } catch (error) {
            console.error('Error stopping recognition:', error);
            return false;
        }
    }

    handleError(event) {
        console.error('Recognition error:', event.error);
        this.isListening = false;
    }

    handleEnd() {
        if (this.isListening) {
            this.recognition.start();
        }
    }

    getTranscript() {
        return this.transcript;
    }

    clearTranscript() {
        this.transcript = '';
        this.interimTranscript = '';
        this.lastTranscriptLength = 0;
        this.updateDisplay();
    }
    handleError(event) {
        console.error('Recognition error:', event.error);
        this.isListening = false;
        
        // Add user feedback
        const statusElement = document.getElementById('recordingStatus');
        if (statusElement) {
            statusElement.textContent = `Error: ${event.error}`;
        }
        
        // Reset buttons
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (startBtn) startBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = true;
    }
}