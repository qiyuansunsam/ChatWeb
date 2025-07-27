document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const messageForm = document.getElementById("message-form");
    const newMessagesContainer = document.getElementById("newMessages");
    const messageInput = document.getElementById("message");

    // Auto-resize textarea
    if (messageInput) {
        messageInput.addEventListener('input', autoResize);
        messageInput.addEventListener('keydown', handleKeyDown);
    }

    // Login form handler
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            // Add loading state to button
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> Signing in...';
            submitBtn.disabled = true;

            try {
                const response = await fetch("/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({ username, password }),
                });

                if (response.ok) {
                    window.location.href = "/messaging";
                } else {
                    showNotification("Invalid credentials. Please try again.", "error");
                }
            } catch (error) {
                showNotification("Network error. Please check your connection.", "error");
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Message form handler
    if (messageForm) {
        messageForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const message = messageInput.value.trim();
            if (!message) return;

            // Add user message immediately
            appendMessage(message, true);
            messageInput.value = "";
            resetTextareaHeight();
            setLoading(true);

            try {
                const response = await fetch("/send-message", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ message }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.error) {
                        showNotification(data.error, "error");
                    } else {
                        appendMessage(data.message, false);
                    }
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    showNotification(errorData.error || "Failed to send message. Please try again.", "error");
                }
            } catch (error) {
                console.error("Network error:", error);
                showNotification("Network error. Please check your connection.", "error");
            } finally {
                setLoading(false);
                scrollToBottom();
                messageInput.focus();
            }
        });
    }

    // Auto-resize textarea function
    function autoResize() {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    }

    function resetTextareaHeight() {
        messageInput.style.height = 'auto';
    }

    // Handle keyboard shortcuts
    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            messageForm.dispatchEvent(new Event('submit'));
        }
    }

    // Loading state management
    function setLoading(visible) {
        const loading = document.getElementById("loading");
        if (loading) {
            if (visible) {
                loading.classList.add("visible");
            } else {
                loading.classList.remove("visible");
            }
        }
    }

    // Enhanced message appending with better code highlighting
    function appendMessage(messageContent, isUser) {
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('message');
        if (isUser) {
            messageContainer.classList.add('user-message');
        }

        // Parse message content for code blocks and regular text
        const parsedContent = parseMessageContent(messageContent);
        messageContainer.appendChild(parsedContent);

        newMessagesContainer.appendChild(messageContainer);
        
        // Highlight code blocks if Prism is available
        if (window.Prism) {
            Prism.highlightAllUnder(messageContainer);
        }
        
        scrollToBottom();
    }

    // Enhanced message content parsing
    function parseMessageContent(content) {
        const container = document.createElement('div');
        const segments = content.split(/(```[\s\S]*?```|`[^`]+`)/);
        
        segments.forEach((segment, index) => {
            if (segment.startsWith('```') && segment.endsWith('```')) {
                // Multi-line code block
                const codeContent = segment.slice(3, -3);
                const lines = codeContent.split('\n');
                
                // Detect language from first line
                let language = '';
                let codeText = codeContent;
                
                if (lines.length > 1 && lines[0].trim() && !lines[0].includes(' ')) {
                    language = lines[0].trim().toLowerCase();
                    codeText = lines.slice(1).join('\n');
                }
                
                const pre = document.createElement('pre');
                const code = document.createElement('code');
                
                // Set language class for Prism
                if (language) {
                    code.className = `language-${language}`;
                }
                
                code.textContent = codeText.trim();
                pre.appendChild(code);
                container.appendChild(pre);
                
            } else if (segment.startsWith('`') && segment.endsWith('`')) {
                // Inline code
                const code = document.createElement('code');
                code.textContent = segment.slice(1, -1);
                container.appendChild(code);
                
            } else if (segment.trim()) {
                // Regular text - parse for markdown-like formatting
                const textElement = parseTextFormatting(segment);
                container.appendChild(textElement);
            }
        });
        
        return container;
    }

    // Parse basic text formatting (bold, italic, etc.)
    function parseTextFormatting(text) {
        const p = document.createElement('p');
        
        // Simple markdown parsing for **bold** and *italic*
        let formattedText = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
        
        p.innerHTML = formattedText;
        return p;
    }

    // Smooth scrolling to bottom
    function scrollToBottom() {
        if (newMessagesContainer) {
            newMessagesContainer.scrollTo({
                top: newMessagesContainer.scrollHeight,
                behavior: 'smooth'
            });
        }
    }

    // Notification system
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="material-icons">${getNotificationIcon(type)}</span>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="notification-close">
                <span class="material-icons">close</span>
            </button>
        `;
        
        // Add notification styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#fed7d7' : '#c6f6d5'};
            color: ${type === 'error' ? '#c53030' : '#22543d'};
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1001;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    function getNotificationIcon(type) {
        switch (type) {
            case 'error': return 'error';
            case 'success': return 'check_circle';
            case 'warning': return 'warning';
            default: return 'info';
        }
    }

    // Initialize
    scrollToBottom();
    if (messageInput) {
        messageInput.focus();
    }

    // Add CSS animations for notifications
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .notification-close {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            margin-left: 0.5rem;
            opacity: 0.7;
            transition: opacity 0.2s ease;
        }
        
        .notification-close:hover {
            opacity: 1;
        }
        
        .notification-close .material-icons {
            font-size: 1.2rem;
        }
    `;
    document.head.appendChild(style);
});