from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import google_auth
import os
from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import datetime
from starlette.requests import Request
import pytz
import google.generativeai as genai


load_dotenv()

app = FastAPI()

# Configure Google Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Add session middleware
app.add_middleware(
    SessionMiddleware, secret_key=os.getenv("SECRET_KEY")
)


# CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # In production, specify your frontend's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the auth router
app.include_router(google_auth.router, prefix="/api/auth/google", tags=["auth"])


@app.get("/")
def read_root():
    return {"message": "Welcome to the Mealendar AI backend!"}

# AI chat endpoint
@app.post("/api/chat")
async def chat_with_ai(request: Request):
    data = await request.json()
    user_message = data.get("message", "")
    selected_date = data.get("selected_date") # Get the selected date from the request

    if not user_message:
        return {"error": "Message cannot be empty"}

    try:
        # Get calendar events to provide context to the AI
        events_for_date = await get_calendar_events_for_ai(request, date_str=selected_date)

        # Create a prompt with context
        prompt = f"""
        You are a helpful assistant named Mealendar AI.
        Your user has selected the date {selected_date}.
        The user's schedule for that day is as follows:
        {events_for_date}

        Based on this schedule, answer the user's question.
        User's question: "{user_message}"
        """

        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        response = model.generate_content(prompt)
        
        return {"response": response.text}

    except Exception as e:
        print(f"Error with Gemini API: {e}")
        return {"error": "Failed to get response from AI"}

async def get_calendar_events_for_ai(request: Request, date_str: str = None):
    """
    A helper function to fetch calendar events for a specific date to be used as context for the AI.
    """
    credentials = request.session.get('credentials')
    if not credentials:
        return "User is not logged in."

    try:
        creds = Credentials(
            token=credentials['access_token'],
            refresh_token=credentials.get('refresh_token'),
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
            token_uri="https://www.googleapis.com/oauth2/v4/token",
            scopes=credentials.get('scope')
        )
        service = build('calendar', 'v3', credentials=creds)
        
        calendar_info = service.calendars().get(calendarId='primary').execute()
        user_timezone = calendar_info.get('timeZone', 'UTC')
        tz = pytz.timezone(user_timezone)
        
        if date_str:
            target_date = datetime.datetime.fromisoformat(date_str).date()
        else: # Fallback to today if no date is provided
            target_date = datetime.datetime.now(tz).date()

        time_min = tz.localize(datetime.datetime.combine(target_date, datetime.time.min)).isoformat()
        time_max = tz.localize(datetime.datetime.combine(target_date, datetime.time.max)).isoformat()

        events_result = service.events().list(
            calendarId='primary', timeMin=time_min, timeMax=time_max,
            singleEvents=True, orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        if not events:
            return f"No events scheduled for {target_date.strftime('%Y-%m-%d')}."
        
        # Format events for the prompt
        formatted_events = ""
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            
            if 'T' in start: # It's a dateTime
                dt_object = datetime.datetime.fromisoformat(start.replace('Z', '+00:00'))
                start_time = dt_object.strftime('%H:%M')
            else: # It's an all-day event
                start_time = "All day"

            summary = event['summary']
            location = f" at {event['location']}" if 'location' in event else ""

            if start_time == "All day":
                formatted_events += f"- {summary}{location} (All day)\n"
            else:
                formatted_events += f"- {summary}{location} starting at {start_time}\n"
        return formatted_events

    except Exception as e:
        print(f"Error getting calendar events for AI prompt: {e}")
        return "Could not retrieve calendar events."


# Google Calendar integration
@app.get("/api/calendar/events")
async def get_calendar_events(request: Request, start_date: str = None):
    credentials = request.session.get('credentials')
    if not credentials:
        return {"error": "User not authenticated"}

    try:
        # Manually map the session credentials to the google.oauth2.credentials.Credentials object
        creds = Credentials(
            token=credentials['access_token'],
            refresh_token=credentials.get('refresh_token'),
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
            token_uri="https://www.googleapis.com/oauth2/v4/token",
            scopes=credentials.get('scope')
        )
        
        service = build('calendar', 'v3', credentials=creds)

        # Get the user's timezone
        calendar_info = service.calendars().get(calendarId='primary').execute()
        user_timezone = calendar_info.get('timeZone', 'UTC')
        tz = pytz.timezone(user_timezone)

        if start_date:
            selected_date = datetime.datetime.fromisoformat(start_date).date()
        else:
            selected_date = datetime.datetime.now(tz).date()
        
        # Localize the start and end of the day
        time_min = tz.localize(datetime.datetime.combine(selected_date, datetime.time.min)).isoformat()
        time_max = tz.localize(datetime.datetime.combine(selected_date, datetime.time.max)).isoformat()

        # Call the Calendar API
        events_result = service.events().list(
            calendarId='primary', 
            timeMin=time_min,
            timeMax=time_max,
            maxResults=50, 
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        events = events_result.get('items', [])

        return {"events": events}

    except Exception as e:
        print(f"Error fetching calendar events: {e}")
        return {"error": "Failed to fetch calendar events"} 