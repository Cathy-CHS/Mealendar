import Head from "next/head";
import Map from "../components/Map";
import Calendar from "../components/Calendar";
import Chat from "../components/Chat";
import { useState } from 'react';

const getTodayString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(getTodayString());

  return (
    <div className="app-container">
      <Head>
        <title>Mealendar</title>
        <meta name="description" content="Mealendar AI Assistant" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main-grid">
        <div className="map-area">
          <Map />
        </div>
        <div className="schedule-area">
          <Calendar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
        </div>
        <div className="chat-area">
          <Chat selectedDate={selectedDate} />
        </div>
      </main>

      <style jsx>{`
        .app-container {
          padding: 1rem;
          height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .main-grid {
          flex-grow: 1;
          display: grid;
          grid-template-columns: 2fr 1fr;
          grid-template-rows: minmax(0, 2fr) minmax(0, 3fr);
          gap: 1rem;
          /* Subtract padding from height */
          height: calc(100vh - 2rem);
        }

        .map-area {
          grid-column: 1 / 2;
          grid-row: 1 / 3;
          border-radius: var(--border-radius);
          overflow: hidden;
          box-shadow: var(--shadow-md);
        }

        .schedule-area {
          grid-column: 2 / 3;
          grid-row: 1 / 2;
          display: flex;
          overflow: hidden; /* Important for child scrolling */
        }

        .chat-area {
          grid-column: 2 / 3;
          grid-row: 2 / 3;
          display: flex;
          overflow: hidden; /* Important for child scrolling */
        }
      `}</style>
    </div>
  );
}
