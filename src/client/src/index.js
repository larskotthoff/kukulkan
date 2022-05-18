import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

import './roboto.css';
import './material-icons.css';

import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme();

const df = new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

// https://stackoverflow.com/questions/3426404/create-a-hexadecimal-colour-based-on-a-string-with-javascript
function getBackgroundColor(stringInput) {
  let stringUniqueHash = [...stringInput].reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  return `hsl(${stringUniqueHash % 360}, 95%, 35%)`;
}

export default function Search() {

  const [error, setError] = useState(null);
  const [threads, setThreads] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    fetch('http://localhost:5000/api/query/' + data.get('search'))
      .then(res => res.json())
      .then(
        (result) => {
            setThreads(result);
        },
        (error) => {
            setError(error);
        }
      )
  };

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
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: "70%" }}>
            <TextField
              margin="normal"
              fullWidth
              id="search"
              label="Search"
              name="search"
              autoComplete="search"
              autoFocus
            />
          </Box>
          { error && 
            <Box id="error" sx={{ mt: 1 }}>
              <Alert severity="error">Error querying backend: {error.message}</Alert>
            </Box>
          }
          { threads && 
            <Box id="threads" sx={{ mt: 1, width: "90%" }}>
              { threads.length > 0
                  ? <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Messages</TableCell>
                            <TableCell>Tags</TableCell>
                            <TableCell>Subject</TableCell>
                            <TableCell>Authors</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          { threads.map((thread, index) => (
                            <TableRow key={index}>
                              <TableCell>{df.format(thread.newest_date * 1000)}</TableCell>
                              <TableCell>{thread.total_messages}</TableCell>
                              <TableCell>
                              <Grid container spacing={1}>
                              { thread.tags.map((tag, index2) => (
                                <Grid item key={index2}>
                                  <Chip key={index2} label={tag} style={{ backgroundColor: getBackgroundColor(tag) }} onDelete={console.log}/>
                                </Grid>
                              )) }
                              </Grid>
                              </TableCell>
                              <TableCell>{thread.subject}</TableCell>
                              <TableCell>{thread.authors}</TableCell>
                            </TableRow>
                        )) }
                        </TableBody>
                      </Table>
                    </TableContainer>
                  : <Alert severity="info">No results.</Alert>
              }
            </Box>
          }
        </Box>
      </Container>
    </ThemeProvider>
  );
}


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Search />
  </React.StrictMode>
);
