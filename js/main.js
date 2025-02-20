class MeetingAssistant {
    constructor() {
        this.audioCapture = null;
        this.transcriptionService = null;
        this.aiProcessor = null;
        this.emailManager = null;
        this.calendarManager = null;
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    async initialize() {
        try {
            console.log('Initializing Meeting Assistant...');
            
            // Initialize components
            this.audioCapture = new AudioCapture();
            this.transcriptionService = new TranscriptionService();
            this.aiProcessor = new AIProcessor();
            this.emailManager = new EmailManager();
            this.calendarManager = new CalendarManager();

            // Initialize audio and transcription
            await this.audioCapture.initialize();
            this.transcriptionService.initialize();

            // Set up transcript processing
            this.transcriptionService.onTranscriptUpdate = (text) => {
                this.aiProcessor.processText(text);
            };

            // Set up event listeners
            this.setupEventListeners();

            console.log('Meeting Assistant initialized successfully');
        } catch (error) {
            console.error('Error initializing Meeting Assistant:', error);
            this.showError('Failed to initialize the application');
        }
    }

    setupEventListeners() {
        // Recording controls
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');

        if (startBtn && pauseBtn && stopBtn) {
            startBtn.addEventListener('click', () => this.startRecording());
            pauseBtn.addEventListener('click', () => this.pauseRecording());
            stopBtn.addEventListener('click', () => this.stopRecording());
        }

        // Export button
        const exportBtn = document.getElementById('exportPdfBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToPDF());
        }
    }

    async startRecording() {
        try {
            const startBtn = document.getElementById('startBtn');
            const pauseBtn = document.getElementById('pauseBtn');
            const stopBtn = document.getElementById('stopBtn');

            startBtn.disabled = true;
            
            // Initialize audio capture if needed
            if (!this.audioCapture.stream) {
                await this.audioCapture.initialize();
            }

            if (await this.audioCapture.startRecording() && 
                this.transcriptionService.startListening()) {
                
                pauseBtn.disabled = false;
                stopBtn.disabled = false;
                
                this.transcriptionService.clearTranscript();
                this.aiProcessor.clearSummary();
            } else {
                startBtn.disabled = false;
                await this.audioCapture.cleanup();
            }
        } catch (error) {
            console.error('Error starting recording:', error);
            this.showError('Failed to start recording');
            const startBtn = document.getElementById('startBtn');
            if (startBtn) startBtn.disabled = false;
            await this.audioCapture.cleanup();
        }
    }

    async pauseRecording() {
        try {
            const pauseBtn = document.getElementById('pauseBtn');
            
            if (this.audioCapture.isPaused) {
                await this.audioCapture.resumeRecording();
                pauseBtn.innerHTML = '<span class="material-icons">pause</span>Pause';
            } else {
                await this.audioCapture.pauseRecording();
                pauseBtn.innerHTML = '<span class="material-icons">play_arrow</span>Resume';
            }
        } catch (error) {
            console.error('Error pausing/resuming recording:', error);
            this.showError('Failed to pause/resume recording');
        }
    }

    async stopRecording() {
        try {
            const startBtn = document.getElementById('startBtn');
            const pauseBtn = document.getElementById('pauseBtn');
            const stopBtn = document.getElementById('stopBtn');

            if (await this.audioCapture.stopRecording() && 
                this.transcriptionService.stopListening()) {
                
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                stopBtn.disabled = true;
                
                const transcript = this.transcriptionService.getTranscript();
                await this.aiProcessor.processText(transcript);
                
                // Clean up after processing
                await this.audioCapture.cleanup();
            }
        } catch (error) {
            console.error('Error stopping recording:', error);
            this.showError('Failed to stop recording');
            await this.audioCapture.cleanup();
        }
    }

    async exportToPDF() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            let yPosition = 20;
            const pageWidth = doc.internal.pageSize.width;
            const margin = 20;
            const maxWidth = pageWidth - 2 * margin;

            // Helper function to add wrapped text
            const addWrappedText = (text, y) => {
                const lines = doc.splitTextToSize(text, maxWidth);
                doc.text(lines, margin, y);
                return y + (lines.length * 7); // Return new Y position
            };

            // Title
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('Meeting Summary', margin, yPosition);
            yPosition += 15;

            // Date and Time
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPosition);
            yPosition += 15;

            // Action Items
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Action Items:', margin, yPosition);
            yPosition += 10;
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const actionItems = Array.from(document.querySelectorAll('.action-list li'))
                .map(item => `• ${item.textContent.trim()}`)
                .join('\n');
            yPosition = addWrappedText(actionItems || 'No action items', yPosition);
            yPosition += 15;

            // Key Points
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Key Points:', margin, yPosition);
            yPosition += 10;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const keyPoints = Array.from(document.querySelectorAll('.key-points-list li'))
                .map(item => `• ${item.textContent.trim()}`)
                .join('\n');
            yPosition = addWrappedText(keyPoints || 'No key points', yPosition);
            yPosition += 15;

            // Decisions
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Decisions Made:', margin, yPosition);
            yPosition += 10;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const decisions = Array.from(document.querySelectorAll('.decisions-list li'))
                .map(item => `• ${item.textContent.trim()}`)
                .join('\n');
            yPosition = addWrappedText(decisions || 'No decisions recorded', yPosition);
            yPosition += 15;

            // Important Dates
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Important Dates:', margin, yPosition);
            yPosition += 10;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const dates = Array.from(document.querySelectorAll('.dates-list li'))
                .map(item => `• ${item.textContent.trim()}`)
                .join('\n');
            yPosition = addWrappedText(dates || 'No dates recorded', yPosition);
            yPosition += 15;

            // Check if we need a new page for transcript
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }

            // Full Transcript
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Meeting Transcript:', margin, yPosition);
            yPosition += 10;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const transcript = document.getElementById('liveTranscript').innerText.trim();
            yPosition = addWrappedText(transcript || 'No transcript available', yPosition);

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'italic');
                doc.text(
                    `Page ${i} of ${pageCount}`,
                    doc.internal.pageSize.width / 2,
                    doc.internal.pageSize.height - 10,
                    { align: 'center' }
                );
            }

            // Save the PDF
            doc.save('meeting-summary.pdf');
            this.showSuccess('PDF exported successfully!');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            this.showError('Failed to export PDF');
        }
    }

    showSuccess(message) {
        alert(message);
    }

    showError(message) {
        alert('Error: ' + message);
    }
    
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.meetingAssistant = new MeetingAssistant();
});
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Global error:', error);
    alert('An error occurred. Please refresh the page and try again.');
    return false;
};