import { Task } from "../types";

const CLIENT_ID =
  "56657301928-l1rrn72shsq3qqfr323pln1ieik23d0s.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

// Global declaration for GIS
declare global {
  interface Window {
    google: any;
  }
}

let googleAccessToken: string | null = null;

export const signInToGoogleCalendar = async (): Promise<string> => {
  if (googleAccessToken) return googleAccessToken;

  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject("Google Identity Services not loaded");
      return;
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response: any) => {
        if (response.error) {
          reject(response);
          return;
        }

        googleAccessToken = response.access_token;
        resolve(response.access_token);
      },
    });

    tokenClient.requestAccessToken();
  });
};

export const createTaskEvent = async (task: Task, token?: string) => {
  if (!token) {
    if (!googleAccessToken) {
      throw new Error("No access token. Call signInToGoogleCalendar first.");
    }
    token = googleAccessToken;
  }

  // NOTE: The user prompt code signature was (task: any, token: string).
  // I should adapt usage in App.tsx or make token optional here if possible,
  // BUT the user prompt code specifically asked to pass the token.
  // I will make it compatible with both (optional token if stored).

  if (!task.dueDate) {
    throw new Error("Task has no due date/time set.");
  }

  const event = {
    summary: task.title,
    description: task.description || "",
    start: {
      dateTime: new Date(task.dueDate).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: new Date(
        new Date(task.dueDate).getTime() +
          (task.estimatedMinutes || 30) * 60 * 1000,
      ).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    },
  );

  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(`Google Calendar Error: ${JSON.stringify(errorBody)}`);
  }

  return res.json();
};
// Removed initializeGoogleCalendar as it is no longer needed with GIS flow (loaded via script tag)
export const initializeGoogleCalendar = async () => {}; // No-op for compatibility if needed
