document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const messageForm = document.getElementById("message-form");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            // Send login data to the server
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
                alert("Invalid credentials");
            }
        });
    }

    if (messageForm) {
        messageForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const message = document.getElementById("message").value;
            document.getElementById("message").value = ""
            setLoading(true);
            // Send message to the server
            const response = await fetch("/send-message", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message }),
            });
            if (response.ok) {
                setLoading(false);
                fetchMessageAndAppend(response);
            } else {
                setLoading(false);
            }
        });
    }

    async function setLoading(visible) {
        const loading = document.getElementById("loading");
        if (visible) {
            loading.classList.add("visible");
        } else {
            loading.classList.remove("visible");
        }
    }

    async function fetchMessageAndAppend(response) {
        const data = await response.json();
        const message = data.message;
        var newMessages = document.getElementById("newMessages")
        const messageContainer = document.createElement('p');
        messageContainer.textContent = message;

        newMessages.appendChild(messageContainer);
    }
});