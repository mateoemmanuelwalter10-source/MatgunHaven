import { useEffect, useState } from "react";
import {
  hasSupabaseConnectionFailed,
  supabaseConnectionEvent,
} from "../../services/supabase";
import "./DatabaseConnectionBoundary.css";

export default function DatabaseConnectionBoundary({ children }) {
  const [connectionFailed, setConnectionFailed] = useState(
    hasSupabaseConnectionFailed,
  );

  useEffect(() => {
    function handleConnectionState(event) {
      if (!event.detail.connected) setConnectionFailed(true);
    }

    window.addEventListener(supabaseConnectionEvent, handleConnectionState);
    return () =>
      window.removeEventListener(supabaseConnectionEvent, handleConnectionState);
  }, []);

  if (connectionFailed) {
    return (
      <main className="database-connection-page" role="alert">
        <div className="database-connection-card">
          <p className="eyebrow">Service unavailable</p>
          <h1>Cannot connect to the database</h1>
          <p>
            The app cannot reach its data service right now. Please check your
            internet connection or contact Admin IT for help.
          </p>
          <button
            className="primary-button"
            type="button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return children;
}
