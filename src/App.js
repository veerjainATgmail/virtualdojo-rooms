import React, { useState, useEffect } from "react";
import { ThemeProvider } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";

import { DndProvider } from "react-dnd";
import Backend from "react-dnd-html5-backend";
import * as FirestoreService from "./services/firestore";

import CreateEvent from "./containers/CreateEvent/CreateEvent";
import JoinEvent from "./containers/JoinEvent/JoinEvent";
import Event from "./containers/Event/Event";
import ErrorMessage from "./components/ErrorMessage/ErrorMessage";
import { theme } from "./components/Theme/Theme";

import useQueryString from "./hooks/useQueryString";

function App() {
  const [user, setUser] = useState();
  const [userId, setUserId] = useState();
  const [eventMeta, setEventMeta] = useState();
  const [error, setError] = useState();
  const [isLoading, setIsLoading] = useState(true);

  const [eventId, setEventId] = useQueryString("eventId");

  useEffect(() => {
    FirestoreService.authenticateAnonymously()
      .then((userCredential) => {
        setUserId(userCredential.user.uid);
        if (eventId) {
          return FirestoreService.getEvent(eventId)
            .then((event) => {
              if (event.exists) {
                setError(null);
                setEventMeta(event.data());
              } else {
                setError("event-not-found");
                setEventId();
              }
            })
            .catch(() => {
              setError("event-get-fail");
            })
            .then(() =>
              FirestoreService.isUserRegistered(
                eventId,
                userCredential.user.uid
              )
            )
            .then((result) => setUser(result));
        }
      })
      .then(() => setIsLoading(false))
      .catch(() => {
        setError("anonymous-auth-failed");
        setIsLoading(false);
      });
  }, [eventId, setEventId]);

  function onEventCreate(eventId, userName) {
    setEventId(eventId);
    console.log(eventId);
    FirestoreService.getEvent(eventId)
      .then((event) => {
        if (event.exists) {
          setError(null);
          setEventMeta(event.data());
        } else {
          setError("event-not-found");
          setEventId();
        }
      })
      .catch(() => {
        setError("event-get-fail");
      })
      .then(() => FirestoreService.isUserRegistered(eventId, userId))
      .then((result) => setUser(result));
  }

  function onCloseEvent() {
    setEventId();
    setEventMeta();
    setUser();
  }

  function onSelectUser(userName) {
    setUser(userName);
    FirestoreService.getEvent(eventId)
      .then((updatedEvent) => setEventMeta(updatedEvent.data()))
      .catch(() => setError("event-get-fail"));
  }

  // render a scene based on the current state
  if (isLoading) return <div>{`Loading...`}</div>;

  if (eventMeta && user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <DndProvider backend={Backend}>
          <Event user={user} event={{ eventId, ...eventMeta }}></Event>
        </DndProvider>
      </ThemeProvider>
    );
  } else if (eventMeta) {
    return (
      <div>
        <ErrorMessage errorCode={error}></ErrorMessage>
        <JoinEvent
          users={eventMeta.users}
          {...{ eventId, onSelectUser, onCloseEvent, userId }}
        ></JoinEvent>
      </div>
    );
  }
  return (
    <div>
      <ErrorMessage errorCode={error}></ErrorMessage>
      <CreateEvent onCreate={onEventCreate} userId={userId}></CreateEvent>
    </div>
  );
}

export default App;
