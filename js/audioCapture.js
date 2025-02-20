class AudioCapture {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
        this.isRecording = false;
        this.isPaused = false;
        this.startTime = null;
        this.timerInterval = null;
        this.pausedTime = 0;  // Add this for pause functionality
    }

    async initialize() {
        try {
            // Clean up any existing streams
            await this.cleanup();
            
            // Get new stream
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            return true;
        } catch (error) {
            console.error('Error initializing audio capture:', error);
            return false;
        }
    }

    async cleanup() {
        this.stopTimer();
        
        // Stop all tracks in the stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        // Reset MediaRecorder
        if (this.mediaRecorder) {
            if (this.mediaRecorder.state !== 'inactive') {
                try {
                    this.mediaRecorder.stop();
                } catch (e) {
                    console.log('MediaRecorder already stopped');
                }
            }
            this.mediaRecorder = null;
        }

        // Reset all states
        this.audioChunks = [];
        this.isRecording = false;
        this.isPaused = false;
        this.startTime = null;
        this.pausedTime = 0;
    }

    async startRecording() {
        try {
            // Reinitialize if needed
            if (!this.stream) {
                await this.initialize();
            }

            this.mediaRecorder = new MediaRecorder(this.stream);
            this.audioChunks = [];
            this.isRecording = true;
            this.isPaused = false;
            this.startTime = new Date();
            this.pausedTime = 0;

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstart = () => {
                this.startTimer();
                this.updateStatus('Recording...');
            };

            this.mediaRecorder.onstop = () => {
                this.stopTimer();
                this.updateStatus('Processing...');
                this.processRecording();
            };

            this.mediaRecorder.start(1000);
            return true;
        } catch (error) {
            console.error('Error starting recording:', error);
            await this.cleanup();
            return false;
        }
    }

    pauseRecording() {
        if (this.mediaRecorder && this.isRecording && !this.isPaused) {
            this.mediaRecorder.pause();
            this.isPaused = true;
            this.pausedTime = Date.now();
            this.stopTimer(); // Stop the timer when paused
            this.updateStatus('Paused');
            return true;
        }
        return false;
    }

    resumeRecording() {
        if (this.mediaRecorder && this.isRecording && this.isPaused) {
            this.mediaRecorder.resume();
            this.isPaused = false;
            // Adjust startTime to account for pause duration
            if (this.pausedTime > 0) {
                const pauseDuration = Date.now() - this.pausedTime;
                this.startTime = new Date(this.startTime.getTime() + pauseDuration);
                this.pausedTime = 0;
            }
            this.startTimer(); // Restart the timer
            this.updateStatus('Recording...');
            return true;
        }
        return false;
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.isPaused = false;
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            return true;
        }
        return false;
    }

    startTimer() {
        const timerElement = document.getElementById('recordingTime');
        this.timerInterval = setInterval(() => {
            if (!this.isPaused) {
                const currentTime = new Date();
                const diff = new Date(currentTime - this.startTime);
                const hours = diff.getUTCHours().toString().padStart(2, '0');
                const minutes = diff.getUTCMinutes().toString().padStart(2, '0');
                const seconds = diff.getUTCSeconds().toString().padStart(2, '0');
                timerElement.textContent = `${hours}:${minutes}:${seconds}`;
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateStatus(status) {
        const statusElement = document.getElementById('recordingStatus');
        const statusDot = document.getElementById('statusDot');
        
        if (statusElement) {
            statusElement.textContent = status;
        }
        
        if (statusDot) {
            statusDot.className = 'status-dot';
            if (status === 'Recording...') {
                statusDot.classList.add('recording');
            } else if (status === 'Paused') {
                statusDot.classList.add('paused');
            }
        }
    }

    async processRecording() {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        return audioBlob;
    }

    cleanup() {
        this.stopTimer();
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.isPaused = false;
        this.startTime = null;
    }
}