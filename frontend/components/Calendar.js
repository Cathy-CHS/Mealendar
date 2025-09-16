import React, { useState, useEffect } from "react";

const getTodayString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const Calendar = ({ selectedDate, setSelectedDate, events, setEvents }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // const [events, setEvents] = useState([]); // This state is now managed by the parent
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check login status when component mounts
    fetch("http://localhost:8000/api/auth/google/status", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setIsLoggedIn(data.isLoggedIn);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoggedIn(false);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetch(
        `http://localhost:8000/api/calendar/events?start_date=${selectedDate}`,
        {
          method: "GET",
          credentials: "include",
        }
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.events) {
            setEvents(data.events);
          } else {
            console.error("Could not fetch events:", data.error);
            setEvents([]); // Clear events on error
          }
        })
        .catch((error) => {
          console.error("Error fetching calendar events:", error);
          setEvents([]);
        });
    }
  }, [isLoggedIn, selectedDate]);

  const handleLogin = () => {
    window.location.href = "http://localhost:8000/api/auth/google/login";
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  if (isLoading) {
    return (
      <div className="panel-container">
        <h2 className="panel-title">Daily Schedule</h2>
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  return (
    <div className="panel-container">
      <h2 className="panel-title">Daily Schedule</h2>
      {!isLoggedIn ? (
        <div className="login-container">
          <p>Log in to see your schedule.</p>
          <button onClick={handleLogin} className="button-primary">
            Login with Google
          </button>
        </div>
      ) : (
        <div className="schedule-content">
          <div className="date-selector">
            <label htmlFor="schedule-date">Select Date:</label>
            <input
              type="date"
              id="schedule-date"
              value={selectedDate}
              onChange={handleDateChange}
            />
          </div>
          <h3 className="events-header">Events for {selectedDate}:</h3>
          <div className="events-list">
            {events.length > 0 ? (
              <ul>
                {events.map((event, index) => (
                  <li key={event.id} className="event-item">
                    <div className="event-number">{index + 1}</div>
                    <div className="event-details">
                      <strong>{event.summary}</strong>
                      <p className="event-time">
                        {event.start.dateTime
                          ? new Date(event.start.dateTime).toLocaleTimeString(
                              [],
                              { hour: "numeric", minute: "2-digit" }
                            )
                        : "All day"}
                      </p>
                      {event.location && (
                        <p className="event-location">📍 {event.location}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-events-text">No events found for this day.</p>
            )}
          </div>
        </div>
      )}
      <style jsx>{`
        .panel-container {
          background-color: var(--panel-background-color);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-md);
          padding: 1.5rem;
          width: 100%;
          display: flex;
          flex-direction: column;
          /* overflow-y: auto; */ /* This was causing the outer scrollbar */
        }
        .panel-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }
        .loading-text,
        .no-events-text,
        .login-container p {
          color: var(--text-secondary-color);
          text-align: center;
          flex-grow: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-container {
          text-align: center;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }
        .button-primary {
          background-color: var(--accent-color);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: var(--border-radius);
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .button-primary:hover {
          background-color: var(--accent-color-dark);
        }
        .schedule-content {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .date-selector {
          margin-bottom: 1.5rem;
        }
        .date-selector label {
          margin-right: 0.5rem;
          color: var(--text-secondary-color);
        }
        .date-selector input {
          border: 1px solid var(--border-color);
          border-radius: 0.25rem;
          padding: 0.5rem;
        }
        .events-header {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        .events-list {
          overflow-y: auto;
          flex-grow: 1;
        }
        .events-list ul {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }
        .event-item {
          display: flex;
          align-items: flex-start;
          padding-bottom: 1rem;
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }
        .event-item:last-child {
          border-bottom: none;
        }
        .event-number {
          background-color: var(--accent-color);
          color: white;
          border-radius: 50%;
          width: 1.5rem;
          height: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin-right: 1rem;
          flex-shrink: 0;
        }
        .event-details {
          display: flex;
          flex-direction: column;
        }
        .event-time, .event-location {
          color: var(--text-secondary-color);
          margin: 0.25rem 0 0;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default Calendar;
