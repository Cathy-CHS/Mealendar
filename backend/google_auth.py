from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from requests_oauthlib import OAuth2Session
from starlette.requests import Request
import os
from dotenv import load_dotenv

# Allow HTTP for local development
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

load_dotenv()

router = APIRouter()

# --- Google OAuth2 Settings ---
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
AUTHORIZATION_BASE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://www.googleapis.com/oauth2/v4/token"
SCOPES = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/calendar.readonly",
]

@router.get("/login")
async def login(request: Request):
    """
    Redirects the user to Google's authorization page.
    """
    google = OAuth2Session(CLIENT_ID, redirect_uri=REDIRECT_URI, scope=SCOPES)
    authorization_url, state = google.authorization_url(
        AUTHORIZATION_BASE_URL,
        access_type="offline",
        prompt="select_account",
    )
    request.session['oauth_state'] = state
    return RedirectResponse(authorization_url)

@router.get("/callback")
async def callback(request: Request):
    """
    Handles the callback from Google after user authorization.
    Fetches the access token and stores it in the session.
    """
    expected_state = request.session.pop('oauth_state', None)
    google = OAuth2Session(CLIENT_ID, redirect_uri=REDIRECT_URI, state=expected_state)
    try:
        # The full callback URL is needed for OAuth2Session
        token = google.fetch_token(
            TOKEN_URL, client_secret=CLIENT_SECRET, authorization_response=str(request.url)
        )
        
        # Store the token in the session
        request.session['credentials'] = token

        return RedirectResponse(url=f"http://localhost:3000?auth_status=success")

    except Exception as e:
        # Log the error
        print(f"Error fetching token: {e}")
        return RedirectResponse(url=f"http://localhost:3000?auth_status=failed")

@router.get("/status")
async def get_auth_status(request: Request):
    """
    Checks if the user has a valid session.
    """
    if 'credentials' in request.session:
        return {"isLoggedIn": True}
    return {"isLoggedIn": False} 