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
        "id": str(uuid.uuid4()),
        "username": "jitensha",
        "email": "jitensha@hcmut.edu.vn",
        "password": "jitensha@123",
        "totp_enabled": False,
        "totp_secret": None,
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
        "id": str(uuid.uuid4()),
        "email": email,
        "username": data.get("username", ""),
        "password": password,
        "totp_enabled": False,
        "totp_secret": None,
    }

    return jsonify(
        {
            "message": "Registered successfully (mock)",
            "email": email,
        }
    ), 201


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

    print(f"got {email} with {password}")
    user = users.get(email)
    if not user or user["password"] != password:
        return jsonify({"message": "Invalid email or password"}), 401
    global totp_temp_sessions
    if user["totp_enabled"]:
        # Require TOTP step
        # temp_token = create_token("temp")
        totp_temp_sessions[email] = email
        return jsonify(
            {
                "requireTOTP": True,
                # "tempToken": temp_token,
                "message": "TOTP required (mock)",
            }
        ), 200
    else:
        # Direct login
        token = create_token("token")
        sessions[token] = email
        return jsonify(
            {
                # "requireTOTP": False,
                "accessToken": token,
                "user": {
                    "id": user["id"],
                    "email": user["email"],
                    "username": user["username"],
                },
                "message": "Login successful (mock)",
            }
        ), 200


@app.post("/api/auth/login/totp")
def login_totp():
    """
    Mock TOTP validation after /auth/login.
    Body: { "tempToken": string, "code": string }
    For this mock, valid TOTP code is always "123456".
    """
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    code = data.get("code")

    if not email or not code:
        return jsonify({"error": "email and code are required"}), 400
    email = totp_temp_sessions.get(email)  # Should be a temp session token
    if not email:
        return jsonify({"error": "Invalid or expired tempToken"}), 401

    if code != MOCK_TOTP_CODE:
        return jsonify({"error": "Invalid TOTP code (mock: use 123456)"}), 401

    # Successful TOTP -> create real session token
    token = create_token("token")
    sessions[token] = email
    del totp_temp_sessions[email]

    user = users.get(email)

    return jsonify(
        {
            # "requireTOTP": False,
            "accessToken": token,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "username": user["username"],
            },
            "message": "Login successful (mock)",
        }
    ), 200


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
    secret = "MOCK-SECRET-SECRET"
    qr_code = "data:image/png;base64,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"

    user["totp_secret"] = secret  # mark secret stored, but not yet enabled

    return jsonify(
        {
            "totpSetup": {
                "secret": secret,
                "qrCode": qr_code,
            },
            "message": "TOTP setup generated (mock). Use code 123456 in /auth/totp/verify.",
        }
    ), 200


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

    return jsonify(
        {
            "message": "TOTP enabled successfully (mock)",
            "totpEnabled": True,
        }
    ), 200


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

    return jsonify(
        {
            "message": "Logged out successfully (mock)",
        }
    ), 200


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

    return jsonify(
        {
            "message": "Cập nhật thành công (mock)",
            "policy": policy,
        }
    ), 200


@app.post("/api/admin/cleanup")
def admin_cleanup():
    deleted_files = 0
    return jsonify(
        {
            "message": "Cleanup hoàn tất (mock)",
            "deletedFiles": deleted_files,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
    ), 200


if __name__ == "__main__":
    # For local dev only
    app.run(host="0.0.0.0", port=8080, debug=True)
