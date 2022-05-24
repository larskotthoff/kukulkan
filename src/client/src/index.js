import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
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

import { useHotkeys } from 'react-hotkeys-hook'

// https://stackoverflow.com/questions/3426404/create-a-hexadecimal-colour-based-on-a-string-with-javascript
function getColor(stringInput) {
  let stringUniqueHash = [...stringInput].reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  return `hsl(${stringUniqueHash % 360}, 95%, 35%)`;
}

function Search({setThreads, setError, setActiveThread}) {
  const [loading, setLoading] = useState(false);

  const queryServer = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    let query = data.get('search');
    setThreads(null);
    setLoading(true);
    fetch('http://localhost:5000/api/query/' + query)
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
        setActiveThread(0);
        document.activeElement.blur();
      });
  };

  return (
    <Box component="form" onSubmit={queryServer} noValidate sx={{ mt: 1, width: "70%" }}>
      <Grid container spacing={2}
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}>
        <Grid item sx={{ width: "90%" }}>
          <TextField
            margin="normal"
            fullWidth
            id="search"
            label="Search"
            name="search"
            autoComplete="search"
            autoFocus
          />
          </Grid>
        <Grid item>
          { loading && <CircularProgress /> }
        </Grid>
      </Grid>
    </Box>
  );
}

function Threads({threads, error, activeThread, setActiveThread}) {
  const df = new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  useHotkeys('k', () => setActiveThread(Math.max(0, activeThread - 1)), [activeThread]);
  useHotkeys('Shift+K', () => setActiveThread(Math.max(0, activeThread - 10)), [activeThread]);
  useHotkeys('j', () => setActiveThread(Math.min(threads.length - 1, activeThread + 1)), [activeThread, threads]);
  useHotkeys('Shift+J', () => setActiveThread(Math.min(threads.length - 1, activeThread + 10)), [activeThread, threads]);

  return (
    <Box id="threads" sx={{ mt: 1, width: "90%" }}>
    { error && 
      <Box id="error" sx={{ mt: 1 }}>
        <Alert severity="error">Error querying backend: {error.message}</Alert>
      </Box>
    }
    { threads && 
      <Box>
      <Typography align="right">{threads.length} results.</Typography>
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
            { threads.map((thread, index) => (
              <TableRow key={index} selected={activeThread === index ? true : false} hover={true} onClick={() => setActiveThread(index)}>
                <TableCell>{df.format(thread.newest_date * 1000)}</TableCell>
                <TableCell>{thread.total_messages}</TableCell>
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
      </Box>
    }
    </Box>
  );
}

function Kukulkan() {
  const [error, setError] = useState(null);
  const [threads, setThreads] = useState(null);
  const [activeThread, setActiveThread] = useState(0);

  const theme = createTheme();

  useHotkeys('/', (e) => {
    e.preventDefault();
    document.getElementById('search').focus();
  });

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="90%">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
            <Search setThreads={setThreads} setError={setError} setActiveThread={setActiveThread} />
            <Threads threads={threads} error={error} activeThread={activeThread} setActiveThread={setActiveThread} />
        </Box>
      </Container>
    </ThemeProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Kukulkan />
  </React.StrictMode>
);

// vim: tabstop=2 shiftwidth=2 expandtab
