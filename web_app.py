from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import check_password_hash
import json
import openai
import os

openai.api_key = "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"
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
    message = request.json.get('message')
    messages = [
        # system message first, it helps set the behavior of the assistant
        {"role": "system", "content": "You are a helpful assistant."},
    ]
    if message:
        messages.append(
            {"role": "user", "content": message},
        )
        chat_completion = openai.ChatCompletion.create(
            model="gpt-3.5-turbo", messages=messages
        )
    
    reply = chat_completion.choices[0].message.content
    # Process the message as needed
    return jsonify({"message": reply + "\n"})

if __name__ == "__main__":
    app.run(debug=True)