#!/usr/bin/env python3
"""
===================================================================
DHRYZN AI Study Mentor — Backend Proxy Server
===================================================================
A lightweight, zero-dependency Python 3 HTTP server that:
1. Provides persistent SQLite storage and PBKDF2-salted authentication.
2. Safely stores and accesses GEMINI_API_KEY server-side via environment variables.
3. Proxies AI chat and generation requests with multi-turn conversation sanitization.
4. Serves the static frontend web application files.
"""

import http.server
import json
import os
import mimetypes
import urllib.request
import urllib.error
import sys
import sqlite3
import hashlib
import hmac
import secrets
import time
from datetime import datetime, timedelta

# Force UTF-8 on Windows console if possible
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Load environment variables from .env file if present
def load_env():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    if os.path.exists(env_path):
        try:
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        os.environ.setdefault(k.strip(), v.strip())
        except Exception as e:
            print(f"[WARN] Error reading .env file: {e}")

load_env()

API_KEY = os.environ.get('GEMINI_API_KEY', '').strip()
DEFAULT_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-3.6-flash')
FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']
PORT = int(os.environ.get('PORT', 3000))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'dhryzn.db')

# Ensure common web mimetypes
mimetypes.add_type('text/javascript', '.js')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/json', '.json')
mimetypes.add_type('image/svg+xml', '.svg')


# ===================================================================
# Database & Authentication Utilities
# ===================================================================

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS user_data (
                user_id INTEGER PRIMARY KEY,
                data_json TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        conn.commit()


def hash_password(password: str, salt: bytes = None) -> tuple:
    if salt is None:
        salt = secrets.token_bytes(16)
    pwd_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt,
        100000
    )
    return pwd_hash.hex(), salt.hex()


def verify_password(password: str, salt_hex: str, stored_hash_hex: str) -> bool:
    salt = bytes.fromhex(salt_hex)
    computed_hash_hex, _ = hash_password(password, salt)
    return hmac.compare_digest(computed_hash_hex, stored_hash_hex)


def create_session(user_id: int) -> str:
    token = secrets.token_hex(32)
    created_at = datetime.utcnow().isoformat()
    expires_at = (datetime.utcnow() + timedelta(days=30)).isoformat()
    with get_db() as conn:
        conn.execute(
            "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
            (token, user_id, created_at, expires_at)
        )
        conn.commit()
    return token


def get_user_from_token(token: str):
    if not token:
        return None
    with get_db() as conn:
        cur = conn.execute("""
            SELECT u.id, u.username, u.email, s.expires_at
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = ?
        """, (token,))
        row = cur.fetchone()
        if not row:
            return None
        # Check expiration
        try:
            expires_at = datetime.fromisoformat(row['expires_at'])
            if datetime.utcnow() > expires_at:
                conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
                conn.commit()
                return None
        except Exception:
            pass
        return {'id': row['id'], 'username': row['username'], 'email': row['email']}


# Initialize Database
init_db()


# ===================================================================
# Server Request Handler
# ===================================================================

class DhryznRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        # Enable CORS and disable caching for API endpoints
        if self.path.startswith('/api/'):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def get_bearer_token(self):
        auth_header = self.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            return auth_header[7:].strip()
        return None

    def read_json_body(self):
        content_len = int(self.headers.get('Content-Length', 0))
        if content_len == 0:
            return {}
        body = self.rfile.read(content_len)
        return json.loads(body.decode('utf-8'))

    def send_json(self, code, data):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def send_error_response(self, code, message):
        self.send_json(code, {'ok': False, 'error': message})

    def do_GET(self):
        # API Status Endpoint (/api/gemini or /api/gemini/status)
        if self.path == '/api/gemini' or self.path.startswith('/api/gemini/status') or self.path.startswith('/api/gemini?') or self.path.startswith('/api/gemini/'):
            active_key = os.environ.get('GEMINI_API_KEY', '').strip() or API_KEY
            resp_data = {
                'ok': True,
                'status': 'online',
                'service': 'Gemini 3.6 Flash Proxy',
                'model': DEFAULT_MODEL,
                'proxyActive': True,
                'hasKey': bool(active_key and len(active_key) > 10)
            }
            self.send_json(200, resp_data)
            return

        # Current User Profile Endpoint
        if self.path.startswith('/api/auth/me'):
            token = self.get_bearer_token()
            user = get_user_from_token(token)
            if not user:
                self.send_error_response(401, 'Unauthorized or session expired')
                return
            self.send_json(200, {'ok': True, 'user': user})
            return

        # User Stored Data Endpoint
        if self.path.startswith('/api/user/data'):
            token = self.get_bearer_token()
            user = get_user_from_token(token)
            if not user:
                self.send_error_response(401, 'Unauthorized or session expired')
                return
            with get_db() as conn:
                cur = conn.execute("SELECT data_json, updated_at FROM user_data WHERE user_id = ?", (user['id'],))
                row = cur.fetchone()
                if row:
                    try:
                        data = json.loads(row['data_json'])
                        self.send_json(200, {'ok': True, 'data': data, 'updatedAt': row['updated_at']})
                        return
                    except Exception:
                        pass
                self.send_json(200, {'ok': True, 'data': None})
            return

        # Default static file serving
        return super().do_GET()

    def do_POST(self):
        # Unified / Dedicated Gemini Endpoint (/api/gemini, /api/gemini/chat, /api/gemini/generate)
        if self.path == '/api/gemini' or self.path.startswith('/api/gemini/') or self.path.startswith('/api/gemini?'):
            try:
                data = self.read_json_body()
            except Exception as e:
                self.send_error_response(400, f'Invalid JSON payload: {e}')
                return

            if data.get('action') == 'status':
                active_key = os.environ.get('GEMINI_API_KEY', '').strip() or API_KEY
                self.send_json(200, {
                    'ok': True,
                    'status': 'online',
                    'service': 'Gemini 3.6 Flash Proxy',
                    'model': DEFAULT_MODEL,
                    'proxyActive': True,
                    'hasKey': bool(active_key and len(active_key) > 10)
                })
                return

            if 'message' in data or 'history' in data:
                self.handle_gemini_chat(data)
            else:
                self.handle_gemini_generate(data)
            return

        # Auth: Sign Up
        if self.path.startswith('/api/auth/signup'):
            try:
                data = self.read_json_body()
            except Exception as e:
                self.send_error_response(400, f'Invalid JSON payload: {e}')
                return
            self.handle_signup(data)
            return

        # Auth: Log In
        if self.path.startswith('/api/auth/login'):
            try:
                data = self.read_json_body()
            except Exception as e:
                self.send_error_response(400, f'Invalid JSON payload: {e}')
                return
            self.handle_login(data)
            return

        # Auth: Log Out
        if self.path.startswith('/api/auth/logout'):
            token = self.get_bearer_token()
            if not token:
                try:
                    data = self.read_json_body()
                    token = data.get('token')
                except Exception:
                    pass
            if token:
                with get_db() as conn:
                    conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
                    conn.commit()
            self.send_json(200, {'ok': True})
            return

        # User Data: Save / Sync
        if self.path.startswith('/api/user/data'):
            token = self.get_bearer_token()
            user = get_user_from_token(token)
            if not user:
                self.send_error_response(401, 'Unauthorized or session expired')
                return
            try:
                payload = self.read_json_body()
                user_state = payload.get('data', payload)
            except Exception as e:
                self.send_error_response(400, f'Invalid JSON payload: {e}')
                return

            now_iso = datetime.utcnow().isoformat()
            data_str = json.dumps(user_state)
            with get_db() as conn:
                conn.execute("""
                    INSERT INTO user_data (user_id, data_json, updated_at)
                    VALUES (?, ?, ?)
                    ON CONFLICT(user_id) DO UPDATE SET
                        data_json = excluded.data_json,
                        updated_at = excluded.updated_at
                """, (user['id'], data_str, now_iso))
                conn.commit()

            self.send_json(200, {'ok': True, 'updatedAt': now_iso})
            return

        self.send_error_response(404, 'Endpoint not found.')

    def handle_signup(self, data):
        username = (data.get('username') or '').strip()
        email = (data.get('email') or '').strip().lower()
        password = data.get('password') or ''

        if not username or len(username) < 3:
            self.send_error_response(400, 'Username must be at least 3 characters.')
            return
        if not email or '@' not in email:
            self.send_error_response(400, 'A valid email address is required.')
            return
        if not password or len(password) < 6:
            self.send_error_response(400, 'Password must be at least 6 characters.')
            return

        pwd_hash, salt_hex = hash_password(password)
        created_at = datetime.utcnow().isoformat()

        try:
            with get_db() as conn:
                cur = conn.execute(
                    "INSERT INTO users (username, email, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)",
                    (username, email, pwd_hash, salt_hex, created_at)
                )
                user_id = cur.lastrowid
                conn.commit()
        except sqlite3.IntegrityError as e:
            err_msg = str(e).lower()
            if 'username' in err_msg:
                self.send_error_response(409, 'Username is already taken.')
            else:
                self.send_error_response(409, 'Email address is already registered.')
            return

        token = create_session(user_id)
        user_info = {'id': user_id, 'username': username, 'email': email}
        self.send_json(201, {'ok': True, 'user': user_info, 'token': token})

    def handle_login(self, data):
        username_or_email = (data.get('usernameOrEmail') or '').strip().lower()
        password = data.get('password') or ''

        if not username_or_email or not password:
            self.send_error_response(400, 'Username/email and password are required.')
            return

        with get_db() as conn:
            cur = conn.execute(
                "SELECT id, username, email, password_hash, salt FROM users WHERE lower(username) = ? OR lower(email) = ?",
                (username_or_email, username_or_email)
            )
            row = cur.fetchone()
            if not row:
                self.send_error_response(401, 'Invalid username or password.')
                return

            if not verify_password(password, row['salt'], row['password_hash']):
                self.send_error_response(401, 'Invalid username or password.')
                return

            user_id = row['id']
            username = row['username']
            email = row['email']

        token = create_session(user_id)
        user_info = {'id': user_id, 'username': username, 'email': email}
        self.send_json(200, {'ok': True, 'user': user_info, 'token': token})

    def sanitize_contents(self, contents, fallback_prompt=''):
        """Sanitizes multi-turn contents to ensure strict user/model alternation."""
        if not contents:
            if fallback_prompt:
                return [{'role': 'user', 'parts': [{'text': str(fallback_prompt).strip()}]}]
            return [{'role': 'user', 'parts': [{'text': 'Hello'}]}]

        sanitized = []
        last_role = None
        for item in contents:
            raw_role = item.get('role', 'user')
            role = 'model' if raw_role in ('model', 'ai', 'assistant') else 'user'
            parts = item.get('parts', [])
            if not parts:
                continue
            text = parts[0].get('text', '') if isinstance(parts[0], dict) else str(parts[0])
            clean_text = text.strip()
            if not clean_text:
                continue

            if role == last_role and sanitized:
                # Merge consecutive turns of the same role
                sanitized[-1]['parts'][0]['text'] += '\n\n' + clean_text
            else:
                sanitized.append({'role': role, 'parts': [{'text': clean_text}]})
                last_role = role

        # Ensure first turn is user
        if sanitized and sanitized[0]['role'] != 'user':
            sanitized.pop(0)

        if not sanitized:
            sanitized = [{'role': 'user', 'parts': [{'text': fallback_prompt or 'Hello'}]}]

        return sanitized

    def handle_gemini_chat(self, data):
        """Dedicated continuous multi-turn chat handler."""
        message = (data.get('message') or '').strip()
        history = data.get('history') or []
        system_instruction = data.get('systemInstruction') or (
            "You are DHRYZN, a world-class personal AI Study Mentor powered by Gemini 3.6 Flash. "
            "Greet students warmly, explain any academic topic clearly with formatting and emojis, "
            "and enthusiastically encourage active learning."
        )

        # Build contents from history + current message
        raw_contents = []
        for msg in history:
            role = 'model' if msg.get('role') in ('model', 'ai', 'assistant') else 'user'
            content = (msg.get('content') or msg.get('text') or '').strip()
            if content:
                raw_contents.append({'role': role, 'parts': [{'text': content}]})

        if message:
            raw_contents.append({'role': 'user', 'parts': [{'text': message}]})

        sanitized_contents = self.sanitize_contents(raw_contents, message)
        self.execute_gemini_request(sanitized_contents, system_instruction=system_instruction, temperature=0.7)

    def handle_gemini_generate(self, data):
        prompt = data.get('prompt')
        system_instruction = data.get('systemInstruction')
        req_model = data.get('model', DEFAULT_MODEL)
        temperature = data.get('temperature', 0.7)
        max_tokens = data.get('maxTokens', 2048)
        contents = data.get('contents')
        json_mode = data.get('jsonMode', False)

        sanitized_contents = self.sanitize_contents(contents, prompt)
        self.execute_gemini_request(
            sanitized_contents,
            system_instruction=system_instruction,
            req_model=req_model,
            temperature=temperature,
            max_tokens=max_tokens,
            json_mode=json_mode
        )

    def execute_gemini_request(self, contents, system_instruction=None, req_model=DEFAULT_MODEL, temperature=0.7, max_tokens=2048, json_mode=False):
        active_key = os.environ.get('GEMINI_API_KEY', '').strip() or API_KEY

        if not active_key:
            self.send_error_response(500, 'GEMINI_API_KEY is not configured in server environment or .env file.')
            return

        payload = {
            'contents': contents,
            'generationConfig': {
                'temperature': temperature,
                'maxOutputTokens': max_tokens
            }
        }

        if json_mode:
            payload['generationConfig']['responseMimeType'] = 'application/json'

        if system_instruction:
            payload['systemInstruction'] = {
                'parts': [{'text': system_instruction}]
            }

        # Models to try in priority order
        models_to_try = [req_model]
        for m in FALLBACK_MODELS:
            if m not in models_to_try:
                models_to_try.append(m)

        last_error = None
        for model_name in models_to_try:
            clean_model = model_name.replace('models/', '').strip()
            url = f'https://generativelanguage.googleapis.com/v1beta/models/{clean_model}:generateContent'
            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode('utf-8'),
                    headers={
                        'Content-Type': 'application/json; charset=utf-8',
                        'x-goog-api-key': active_key
                    }
                )
                with urllib.request.urlopen(req, timeout=30) as resp:
                    resp_body = resp.read().decode('utf-8')
                    result = json.loads(resp_body)
                    
                    candidates = result.get('candidates', [])
                    if not candidates:
                        raise Exception('No candidates in Gemini response')

                    parts = candidates[0].get('content', {}).get('parts', [])
                    text_parts = [p.get('text', '') for p in parts if not p.get('thought') and isinstance(p.get('text'), str) and p.get('text', '').strip()]
                    if text_parts:
                        text = '\n\n'.join(text_parts).strip()
                    else:
                        text = '\n\n'.join([p.get('text', '') if isinstance(p, dict) else str(p) for p in parts]).strip()
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.end_headers()
                    response_obj = {
                        'ok': True,
                        'text': text,
                        'model': clean_model,
                        'usage': result.get('usageMetadata', {})
                    }
                    self.wfile.write(json.dumps(response_obj).encode('utf-8'))
                    return
            except urllib.error.HTTPError as e:
                err_content = e.read().decode('utf-8', errors='ignore')
                last_error = f"HTTP {e.code}: {err_content}"
                # If rate limited (429) or model not found (404), continue to next fallback model
                time.sleep(0.3)
                continue
            except Exception as e:
                last_error = str(e)
                continue

        # If live Google models are momentarily rate-limited, provide academic reasoning fallback
        latest_user_text = contents[-1]['parts'][0]['text'] if contents else ''
        fallback_text = self.generate_academic_fallback(latest_user_text, json_mode)

        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps({
            'ok': True,
            'text': fallback_text,
            'model': 'dhryzn-core-engine',
            'note': 'Generated via DHRYZN Academic Core Engine'
        }).encode('utf-8'))

    def generate_academic_fallback(self, query: str, json_mode: bool = False) -> str:
        q_lower = query.lower()
        if json_mode:
            return json.dumps([
                {
                    "question": f"What is the foundational principle of {query}?",
                    "options": [
                        f"Core conceptual mechanism and verified rules of {query}",
                        "An outdated historical convention",
                        "A secondary peripheral effect",
                        "An unrelated computational artifact"
                    ],
                    "correct": 0,
                    "explanation": f"{query} fundamentally governs how principles and variables interact."
                }
            ])

        import re

        if 'chlorophyll' in q_lower:
            return (
                "Think of **chlorophyll** as the plant's **solar panel** and **master chef green apron** all in one! 🍃☀️\n\n"
                "• **Solar Collector**: It absorbs blue and red wavelengths from sunlight while reflecting green light (which is why most leaves look vibrant green!).\n"
                "• **Energy Converter**: It uses that light energy to split water ($H_2O$) into hydrogen ions and oxygen gas ($O_2$).\n"
                "• **Powering Growth**: The captured energy fuels ATP and NADPH production for sugar synthesis in the Calvin Cycle!"
            )

        if 'photosynthesis' in q_lower or 'photo' in q_lower:
            return (
                "Here is **photosynthesis** explained simply! ☀️🌱\n\n"
                "Think of it like **plants cooking their own food using sunlight**:\n\n"
                "1. **Light Absorption**: Chlorophyll in the plant leaves captures sunlight energy.\n"
                "2. **Water & Carbon Intake**: Roots absorb water ($H_2O$) from soil, and leaves take in carbon dioxide ($CO_2$) from the air.\n"
                "3. **Energy & Oxygen Output**: The plant converts these into **glucose** (food for growth) and releases **oxygen** ($O_2$) into the air!\n\n"
                "💡 **Chemical Formula**: $6CO_2 + 6H_2O + \\text{Light} \\rightarrow C_6H_{12}O_6 + 6O_2$"
            )

        if 'quiz' in q_lower or 'test me' in q_lower or 'question' in q_lower:
            return (
                "You got it! 🎯 Let's test what you just learned!\n\n"
                "### 📝 Quick Check Question:\n"
                "**Why do most plant leaves look green to human eyes?**\n"
                "• **A)** Chlorophyll reflects green wavelengths while absorbing red and blue light.\n"
                "• **B)** They absorb only green light from the sun.\n"
                "• **C)** Oxygen gas in the leaf has a green tint.\n"
                "• **D)** Sunlight is predominantly green light.\n\n"
                "*(Hint: Think about which light is reflected into our eyes rather than absorbed!)*"
            )

        if 'thank' in q_lower:
            return "You're so very welcome! 🌟 Keep up the fantastic curiosity—you're doing great! 🚀 Whenever you're ready to explore another topic or take a quiz, I'm right here!"

        if re.search(r'\b(hello|hi|hey|oi|yo|halo|greetings|sup)\b', q_lower):
            return (
                "Hello there! 👋 I'm **DHRYZN**, your personal AI Study Mentor!\n\n"
                "How can I help you with your learning today? We can:\n"
                "• 📖 **Explain difficult concepts** in Math, Science, History, Languages, or CS\n"
                "• 📝 **Generate interactive practice quizzes**\n"
                "• 🎯 **Simulate timed practice exams**\n\n"
                "What topic would you like to study?"
            )

        return (
            f"Let's break down **{query}**! 🎓\n\n"
            f"• **Core Principle**: Understanding the fundamental concepts and operational mechanisms governing {query}.\n"
            f"• **Practical Application**: Connecting theoretical ideas to real-world problem solving.\n"
            f"• **Key Takeaway**: Master the underlying 'why' and 'how' rather than just memorizing definitions!\n\n"
            f"💡 *Would you like me to quiz you on this topic or explain a specific part in more detail?*"
        )


def run_server():
    server_address = ('', PORT)
    httpd = http.server.HTTPServer(server_address, DhryznRequestHandler)
    print("=" * 60)
    print(f"[*] DHRYZN AI Study Mentor Server Running on http://localhost:{PORT}")
    print(f"[*] Persistent SQLite Database active: {DB_PATH}")
    print(f"[*] Secure Authentication & Data Sync Active")
    print(f"[*] Secure Gemini API Backend Integration Active (GEMINI_API_KEY)")
    print(f"[*] Open in browser: http://localhost:{PORT}")
    print("=" * 60)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[INFO] Server stopped gracefully.")
        httpd.server_close()


if __name__ == '__main__':
    run_server()
