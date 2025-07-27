from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import check_password_hash
import json
from openai import OpenAI
import os

# Initialize OpenAI client with API key
client = OpenAI(api_key="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")
app = Flask(__name__)
app.secret_key = os.urandom(24)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "index"

class User(UserMixin):
    def __init__(self, id):
        self.id = id

users = {
    "user1": "password1",
    "user2": "password2"
}

@login_manager.user_loader
def load_user(username):
    if username in users:
        return User(username)
    return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')
    next_url = request.args.get('next') or url_for('messaging')
    if username in users and users[username] == password:
        user = User(username)
        login_user(user)
        return redirect(next_url)
    else:
        return redirect(url_for('index'))

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/messaging')
@login_required
def messaging():
    return render_template('messaging.html')

@app.route('/send-message', methods=['POST'])
@login_required
def send_message():
    try:
        message = request.json.get('message')
        if not message:
            return jsonify({"error": "No message provided"}), 400
            
        messages = [
            # system message first, it helps set the behavior of the assistant
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": message}
        ]
        
        chat_completion = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages
        )
        
        reply = chat_completion.choices[0].message.content
        return jsonify({"message": reply})
        
    except Exception as e:
        print(f"Error in send_message: {e}")
        return jsonify({"error": "Failed to process message"}), 500

if __name__ == "__main__":
    app.run(debug=True)