import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Outlet, useSearchParams } from "react-router-dom";

import CssBaseline from '@mui/material/CssBaseline';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import AttachFile from '@mui/icons-material/AttachFile';
import Reply from '@mui/icons-material/Reply';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { useHotkeys } from 'react-hotkeys-hook';

import { Thread } from "./thread.jsx";
import { SingleMessage } from "./message.jsx";

import { getColor } from "./utils.js";

class Search extends React.Component {
  constructor(props) {
    super(props);
    this.opts = ["tag:todo", "date:1d.."];
    let qs = localStorage.getItem("queries");
    if(qs !== null) this.opts = [...new Set(this.opts.concat(JSON.parse(qs)))];
  }

  render() {
    return (
      <Box component="form" noValidate sx={{ mt: 1, width: "70%" }} onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        this.props.setSearchParams({query: data.get("search")});
      }}>
        <Grid container spacing={2}
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}>
          <Grid item sx={{ width: "90%" }}>
            <Autocomplete
              freeSolo
              autoComplete={true}
              value={this.props.query ? this.props.query : ""}
              options={this.opts}
              renderInput={(params) => <TextField {...params} label="Search" id="search" name="search" fullWidth autoFocus margin="normal" />}
            />
            </Grid>
          <Grid item>
            { this.props.loading && <CircularProgress /> }
          </Grid>
        </Grid>
      </Box>
    );
  }
}

class Threads extends React.Component {
  constructor(props) {
    super(props);
    this.df = new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  componentDidUpdate() {
    this.props.updateActiveThread(0);
  }

  render() {
    return (
      <Box id="threads" sx={{ mt: 1, width: "90%" }}>
      { this.props.threads &&
        <Paper elevation={3} sx={{ padding: 2 }}>
        <Typography align="right">{this.props.threads.length} threads.</Typography>
        <TableContainer id="threadsTable">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Messages</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell>Tags</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Authors</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              { this.props.threads.map((thread, index) => (
                <TableRow key={index} hover={true} className="kukulkan-keyboard-nav" onClick={(e) => {
                          e.preventDefault();
                          this.props.updateActiveThread(index);
                          window.open('/thread?id=' + thread.thread_id, '_blank')
                }}>
                  <TableCell align="center">{ thread.total_messages > 1 && this.df.format(thread.oldest_date * 1000) + " — " } { this.df.format(thread.newest_date * 1000) }</TableCell>
                  <TableCell>{ thread.total_messages }</TableCell>
                  <TableCell>{ thread.tags.includes("attachment") && <AttachFile /> }</TableCell>
                  <TableCell>{ (thread.tags.includes("replied") || thread.tags.includes("sent")) && <Reply /> }</TableCell>
                  <TableCell>
                    <Grid container spacing={1}>
                      { thread.tags.filter((tag) => (tag !== "attachment" && tag !== "replied" && tag !== "sent"))
                        .map((tag, index2) => (
                        <Grid item key={index2}>
                          <Chip key={index2} label={tag} style={{ color: getColor(tag) }} onDelete={console.log}/>
                        </Grid>
                      )) }
                    </Grid>
                  </TableCell>
                  <TableCell>{thread.subject}</TableCell>
                  <TableCell>{thread.authors.replace("| ", ", ")}</TableCell>
                </TableRow>
              )) }
            </TableBody>
          </Table>
        </TableContainer>
        </Paper>
      }
      </Box>
    );
  }
}

function Kukulkan() {
  const [query, setQuery] = useState(null);
  const [threads, setThreads] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const activeThread = useRef(0);

  const theme = createTheme();

  useHotkeys('/', (e) => {
    e.preventDefault();
    document.getElementById('search').focus();
  });

  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    setQuery(searchParams.get("query"));
  }, [searchParams]);

  useEffect(() => {
    if(query !== null) {
      let qs = localStorage.getItem("queries");
      if(qs === null) qs = [];
      else qs = JSON.parse(qs);
      qs.unshift(query);
      qs = [...new Set(qs)];
      // store up to 10 most recent queries
      localStorage.setItem("queries", JSON.stringify(qs.slice(0, 10)));

      setThreads(null);
      setLoading(true);
      fetch(window.location.protocol + '//' + window.location.hostname + ':5000/api/query/' + query)
        .then(res => res.json())
        .then(
          (result) => {
            setThreads(result);
            setError(null);
          },
          (error) => {
            setThreads(null);
            setError(error);
          }
        )
        .finally(() => {
          setLoading(false);
          document.activeElement.blur();
          document.title = query;
        });
    }
  }, [query]);

  function updateActiveThread(at) {
    const clName = "Mui-selected";
    let els = Array.from(document.getElementsByClassName("kukulkan-keyboard-nav"));
    if(els[activeThread.current]) {
      els[activeThread.current].className = els[activeThread.current].className.replace(clName, "");
    }
    activeThread.current = at;
    if(els[activeThread.current]) {
      els[activeThread.current].className += " " + clName;
      els[activeThread.current].scrollIntoView({block: "nearest"});
    }
  }

  useHotkeys('k', () => updateActiveThread(Math.max(0, activeThread.current - 1)), [activeThread]);
  useHotkeys('Shift+K', () => updateActiveThread(Math.max(0, activeThread.current - 10)), [activeThread]);
  useHotkeys('j', () => updateActiveThread(Math.min(threads.length - 1, activeThread.current + 1)), [threads, activeThread]);
  useHotkeys('Shift+J', () => updateActiveThread(Math.min(threads.length - 1, activeThread.current + 10)), [threads, activeThread]);
  useHotkeys('Enter', () => window.open('/thread?id=' + threads[activeThread.current].thread_id, '_blank'), [threads, activeThread]);

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="90%">
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
            <Search loading={loading} setSearchParams={setSearchParams} query={query} />
            { error && 
              <Box id="error" sx={{ mt: 1 }}>
                <Alert severity="error">Error querying backend: {error.message}</Alert>
              </Box>
            }
            <Threads threads={threads} updateActiveThread={updateActiveThread}/>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Outlet />}>
          <Route index element={<Kukulkan />} />
          <Route path="thread" element={<Thread />} />
          <Route path="message" element={<SingleMessage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// vim: tabstop=2 shiftwidth=2 expandtab
