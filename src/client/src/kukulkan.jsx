import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from "react-router-dom";

import CssBaseline from '@mui/material/CssBaseline';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Create from '@mui/icons-material/Create';
import { ThemeProvider } from '@mui/material/styles';

import { useHotkeys } from 'react-hotkeys-hook';

import { Threads } from "./threads.jsx";
import { Search } from "./search.jsx";

import { apiURL, theme } from "./utils.js";

export function Kukulkan() {
  const [threads, setThreads] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeThread, setActiveThread] = useState(0);

  const query = useRef("");
  const error = useRef(null);

  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    query.current = searchParams.get("query");
    if(query.current !== null) {
      let qs = localStorage.getItem("queries");
      if(qs === null) qs = [];
      else qs = JSON.parse(qs);
      qs.unshift(query.current);
      qs = [...new Set(qs)];
      // store up to 20 most recent queries
      localStorage.setItem("queries", JSON.stringify(qs.slice(0, 20)));

      setLoading(true);
      fetch(apiURL("api/query/" + encodeURIComponent(query.current)))
        .then(res => res.json())
        .then(
          (result) => {
            setThreads(result);
            error.current = null;
          },
          (e) => {
            setThreads([]);
            error.current = e;
          }
        )
        .finally(() => {
          document.activeElement.blur();
          document.title = query.current;
          setLoading(false);
      });
    }
  }, [searchParams]);

  useEffect(() => {
    fetch(apiURL("api/tags/"))
      .then(res => res.json())
      .then((result) => {
        setAllTags(result);
      });
  }, []);

  useHotkeys('Home', () => setActiveThread(0));
  useHotkeys('k', () => setActiveThread(Math.max(0, activeThread - 1)), [activeThread]);
  useHotkeys('Shift+K', () => setActiveThread(Math.max(0, activeThread - 10)), [activeThread]);
  useHotkeys('j', () => setActiveThread(Math.min(threads.length - 1, activeThread + 1)), [threads, activeThread]);
  useHotkeys('Shift+J', () => setActiveThread(Math.min(threads.length - 1, activeThread + 10)), [threads, activeThread]);
  useHotkeys('End', () => setActiveThread(threads.length - 1), [threads]);
  useHotkeys('0', () => setActiveThread(threads.length - 1), [threads]);

  useHotkeys('Enter', () => window.open('/thread?id=' + threads[activeThread].thread_id, '_blank'), [threads, activeThread]);

  useHotkeys('c', () => window.open('/write', '_blank'));

  useHotkeys('t', (e) => {
    e.preventDefault();
    document.getElementsByClassName("Mui-selected")[0].dispatchEvent(new CustomEvent('editTags'));
  });

  useHotkeys('Del', () => {
    document.getElementsByClassName("Mui-selected")[0].dispatchEvent(new CustomEvent('delete'));
  });

  useHotkeys('/', (e) => {
    e.preventDefault();
    document.getElementsByClassName("kukulkan-queryBox")[0].getElementsByTagName("input")[0].focus();
  });

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="100%">
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Grid container spacing={2}
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                mt: 1,
                width: "80%"
              }}>
            <Grid item sx={{ width: "90%" }}>
              <Search setSearchParams={setSearchParams} query={query.current} allTags={allTags} />
            </Grid>
            <Grid item>
              { loading && <CircularProgress /> }
            </Grid>
            <Grid item>
              <a href="/write" target="_blank" rel="noreferrer">
                <Create/>
              </a>
            </Grid>
          </Grid>
          { error.current && <Alert severity="error">Error querying backend: {error.current.message}</Alert> }
          <Threads threads={threads} activeThread={activeThread} setActiveThread={setActiveThread} allTags={allTags} />
        </Box>
      </Container>
    </ThemeProvider>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
