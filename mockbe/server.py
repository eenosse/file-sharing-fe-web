from flask import Flask, jsonify, request
from flask_cors import CORS

from datetime import datetime
import uuid

app = Flask(__name__)

# cors for localhost:3000 make request
CORS(
    app,
    resources={r"/api/*": {"origins": "http://localhost:3000"}},
    supports_credentials=True,
)

# Mock "database"

# Users stored in memory:
# users[email] = {
#   "email": str,
#   "password": str,
#   "totp_enabled": bool,
#   "totp_secret": str | None,
# }
users = {
    "jitensha@hcmut.edu.vn": {
        "email": "jitensha@hcmut.edu.vn",
        "password": "jitensha@123",
        "totp_enabled": False,
        "totp_secret": None
    },
}

# Active sessions:
# sessions[token] = email
sessions = {}

# Temp sessions waiting for TOTP:
# totp_temp_sessions[temp_token] = email
totp_temp_sessions = {}

# Very simple TOTP code for all users in this mock
MOCK_TOTP_CODE = "123456"

# Helper functions
def create_token(prefix: str = "token") -> str:
    return f"{prefix}-{uuid.uuid4().hex}"


def get_current_user():
    """
    Read Authorization: Bearer <token> and return (token, user_dict) or (None, None)
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, None

    token = auth_header.split(" ", 1)[1].strip()
    email = sessions.get(token)
    if not email:
        return None, None

    user = users.get(email)
    if not user:
        return None, None

    return token, user


# temporary /auth endpoints
@app.post("/api/auth/register")
def register():
    """
    Mock user registration.
    Body: { "email": string, "password": string }
    """
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    if email in users:
        return jsonify({"error": "User already exists"}), 400

    users[email] = {
        "email": email,
        "password": password,
        "totp_enabled": False,
        "totp_secret": None,
    }

    return jsonify({
        "message": "Registered successfully (mock)",
        "email": email,
    }), 201


@app.post("/api/auth/login")
def login():
    """
    Mock login.
    Body: { "email": string, "password": string }
    If user has TOTP enabled -> requireTOTP: true and returns tempToken.
    Else -> returns token directly.
    """
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")

    print(f'got {email} with {password}')
    user = users.get(email)
    if not user or user["password"] != password:
        return jsonify({"message": "Invalid email or password"}), 401

    if user["totp_enabled"]:
        # Require TOTP step
        temp_token = create_token("temp")
        totp_temp_sessions[temp_token] = email
        return jsonify({
            "requireTOTP": True,
            "tempToken": temp_token,
            "message": "TOTP required (mock)",
        }), 200
    else:
        # Direct login
        token = create_token("token")
        sessions[token] = email
        return jsonify({
            # "requireTOTP": False,
            "accessToken": token,
            "user": {user[email]},
            "message": "Login successful (mock)",
        }), 200


@app.post("/api/auth/login/totp")
def login_totp():
    """
    Mock TOTP validation after /auth/login.
    Body: { "tempToken": string, "code": string }
    For this mock, valid TOTP code is always "123456".
    """
    data = request.get_json(silent=True) or {}
    temp_token = data.get("tempToken")
    code = data.get("code")

    if not temp_token or not code:
        return jsonify({"error": "tempToken and code are required"}), 400

    email = totp_temp_sessions.get(temp_token)
    if not email:
        return jsonify({"error": "Invalid or expired tempToken"}), 401

    if code != MOCK_TOTP_CODE:
        return jsonify({"error": "Invalid TOTP code (mock: use 123456)"}), 401

    # Successful TOTP -> create real session token
    token = create_token("token")
    sessions[token] = email
    del totp_temp_sessions[temp_token]

    return jsonify({
        "requireTOTP": False,
        "token": token,
        "message": "TOTP verified, login successful (mock)",
    }), 200


@app.post("/api/auth/totp/setup")
def totp_setup():
    """
    Mock TOTP setup.
    Requires Authorization: Bearer <token>.
    Returns a fake secret and QR code string (base64 placeholder).
    """
    token, user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    # For mock: just generate a fake secret and QR placeholder
    secret = f"MOCK-SECRET-{user['email']}"
    qr_code = f"data:image/png;base64,MOCK_QR_FOR_{user['email']}"

    user["totp_secret"] = secret  # mark secret stored, but not yet enabled

    return jsonify({
        "secret": secret,
        "qrCode": qr_code,
        "message": "TOTP setup generated (mock). Use code 123456 in /auth/totp/verify.",
    }), 200


@app.post("/api/auth/totp/verify")
def totp_verify():
    """
    Mock TOTP verify to enable 2FA.
    Requires Authorization: Bearer <token>.
    Body: { "code": string }
    Accepts code "123456" for everyone.
    """
    token, user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    code = data.get("code")

    if not code:
        return jsonify({"error": "code is required"}), 400

    if code != MOCK_TOTP_CODE:
        return jsonify({"error": "Invalid TOTP code (mock: use 123456)"}), 401

    user["totp_enabled"] = True

    return jsonify({
        "message": "TOTP enabled successfully (mock)",
        "totpEnabled": True,
    }), 200


@app.post("/api/auth/logout")
def logout():
    """
    Mock logout.
    Requires Authorization: Bearer <token>.
    Simply removes the token from sessions dict.
    """
    token, user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    # Remove token from sessions
    if token in sessions:
        del sessions[token]

    return jsonify({
        "message": "Logged out successfully (mock)",
    }), 200


# /admin endpoints
policy = {
    "id": 1,
    "maxFileSizeMB": 50,
    "minValidityHours": 1,
    "maxValidityDays": 30,
    "defaultValidityDays": 7,
    "requirePasswordMinLength": 6,
}

UPDATABLE_FIELDS = {
    "maxFileSizeMB",
    "minValidityHours",
    "maxValidityDays",
    "defaultValidityDays",
    "requirePasswordMinLength",
}


@app.get("/api/admin/policy")
def get_policy():
    return jsonify(policy), 200


@app.patch("/api/admin/policy")
def update_policy():
    data = request.get_json(silent=True) or {}

    for key in UPDATABLE_FIELDS:
        if key in data:
            policy[key] = data[key]

    return jsonify({
        "message": "Cập nhật thành công (mock)",
        "policy": policy,
    }), 200


@app.post("/api/admin/cleanup")
def admin_cleanup():
    deleted_files = 0
    return jsonify({
        "message": "Cleanup hoàn tất (mock)",
        "deletedFiles": deleted_files,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }), 200


if __name__ == "__main__":
    # For local dev only
    app.run(host="0.0.0.0", port=8080, debug=True)
