from flask import Flask, request, jsonify, render_template, redirect, url_for
import json
import openai
import os

openai.api_key = "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"
app = Flask(__name__)

users = {
    "user1": "password1",
    "user2": "password2"
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')
    if username in users and users[username] == password:
        return redirect(url_for('messaging'))
    else:
        return redirect(url_for('messaging'))

@app.route('/messaging')
def messaging():
    return render_template('messaging.html')

@app.route('/send-message', methods=['POST'])
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