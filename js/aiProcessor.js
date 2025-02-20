class AIProcessor {
    constructor() {
        this.summary = {
            actionItems: [],
            keyPoints: [],
            decisions: [],
            dates: []
        };
    }

    async processText(text) {
        try {
            const response = await fetch(`${CONFIG.GEMINI_API.URL}?key=${CONFIG.GEMINI_API.KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Analyze this meeting transcript and provide a structured summary in exactly this format:

Action Items:
- Extract specific tasks, assignments, and deadlines
- Format each item as: "[Task] (Assignee: [Name] | Due: [Date] | Priority: [High/Medium/Low])"
- List one task per line without bullets or special characters

Key Points:
- Extract important information, updates, and highlights
- Format each point clearly and concisely
- One point per line without bullets or special characters

Decisions Made:
- List final decisions and agreements only
- One decision per line without bullets or special characters

Important Dates:
- Extract all mentioned dates, times, and deadlines
- Format: "Event: [Description] | Date: [Date] | Time: [Time]"

Here's the transcript to analyze:

${text}`
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.candidates && data.candidates[0].content) {
                this.processResponse(data);
            } else {
                throw new Error('Invalid response format from API');
            }
        } catch (error) {
            console.error('Error processing with Gemini:', error);
            this.showError(`AI Processing Error: ${error.message}`);
        }
    }

    processResponse(data) {
        const analysis = data.candidates[0].content.parts[0].text;
        
        // Extract sections
        const sections = {
            actionItems: this.extractSection(analysis, 'Action Items'),
            keyPoints: this.extractSection(analysis, 'Key Points'),
            decisions: this.extractSection(analysis, 'Decisions Made'),
            dates: this.extractSection(analysis, 'Important Dates')
        };

        // Process each section
        this.summary = {
            actionItems: this.processActionItems(sections.actionItems),
            keyPoints: this.processKeyPoints(sections.keyPoints),
            decisions: this.processDecisions(sections.decisions),
            dates: this.processDates(sections.dates)
        };

        this.updateUI();
    }

    extractSection(text, sectionName) {
        const sectionPattern = new RegExp(`${sectionName}:([\\s\\S]*?)(?=(Action Items:|Key Points:|Decisions Made:|Important Dates:|$))`, 'i');
        const match = text.match(sectionPattern);
        return match ? match[1].trim() : '';
    }

    processActionItems(text) {
        if (!text) return [];

        return text.split('\n')
            .filter(line => line.trim())
            .map(item => {
                const assigneeMatch = item.match(/Assignee:\s*([^|)]+)/);
                const deadlineMatch = item.match(/Due:\s*([^|)]+)/);
                const priorityMatch = item.match(/Priority:\s*([^|)]+)/);
                
                return {
                    text: item.replace(/^\s*[-•]\s*/, '').trim(),
                    timestamp: new Date(),
                    assignee: assigneeMatch ? assigneeMatch[1].trim() : null,
                    deadline: deadlineMatch ? deadlineMatch[1].trim() : null,
                    priority: priorityMatch ? priorityMatch[1].trim().toLowerCase() : 'medium'
                };
            });
    }

    processKeyPoints(text) {
        if (!text) return [];

        return text.split('\n')
            .filter(line => line.trim())
            .map(point => ({
                text: point.replace(/^\s*[-•]\s*/, '').trim(),
                timestamp: new Date()
            }));
    }

    processDecisions(text) {
        if (!text) return [];

        return text.split('\n')
            .filter(line => line.trim())
            .map(decision => ({
                text: decision.replace(/^\s*[-•]\s*/, '').trim(),
                timestamp: new Date()
            }));
    }

    processDates(text) {
        if (!text) return [];

        return text.split('\n')
            .filter(line => line.trim())
            .map(date => {
                const eventMatch = date.match(/Event:\s*([^|]+)/);
                const dateMatch = date.match(/Date:\s*([^|]+)/);
                const timeMatch = date.match(/Time:\s*([^|]+)/);

                return {
                    event: eventMatch ? eventMatch[1].trim() : null,
                    date: dateMatch ? dateMatch[1].trim() : null,
                    time: timeMatch ? timeMatch[1].trim() : null,
                    timestamp: new Date()
                };
            });
    }

    updateUI() {
        this.updateSection('actionItems', '.action-list');
        this.updateSection('keyPoints', '.key-points-list');
        this.updateSection('decisions', '.decisions-list');
        this.updateSection('dates', '.dates-list');
    }

    updateSection(sectionName, selector) {
        const sectionList = document.querySelector(selector);
        if (sectionList && this.summary[sectionName]) {
            sectionList.innerHTML = this.summary[sectionName]
                .map(item => this.formatListItem(item, sectionName))
                .join('');
        }
    }

    formatListItem(item, type) {
        switch(type) {
            case 'actionItems':
                return `
                    <li class="action-item priority-${item.priority}">
                        <div class="item-content">${item.text}</div>
                        ${item.assignee || item.deadline ? `
                            <div class="item-metadata">
                                ${item.assignee ? `<span class="assignee">Assignee: ${item.assignee}</span>` : ''}
                                ${item.deadline ? `<span class="deadline">Due: ${item.deadline}</span>` : ''}
                            </div>
                        ` : ''}
                    </li>
                `;
            case 'dates':
                return `
                    <li class="date-item">
                        <div class="item-content">${item.event}</div>
                        <div class="item-metadata">
                            <span class="date">Date: ${item.date}</span>
                            ${item.time ? `<span class="time">Time: ${item.time}</span>` : ''}
                        </div>
                    </li>
                `;
            default:
                return `<li><div class="item-content">${item.text}</div></li>`;
        }
    }

    showError(message) {
        console.error(message);
        // Implement error display logic
    }

    clearSummary() {
        this.summary = {
            actionItems: [],
            keyPoints: [],
            decisions: [],
            dates: []
        };
        this.updateUI();
    }
}