import React, { useState, useEffect } from 'react';
import { useSearchParams } from "react-router-dom";

import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { getColor } from "./utils.js";

export function Thread() {
  const [threadLoading, setThreadLoading] = useState(false);
  const [thread, setThread] = useState(null);
  const [error, setError] = useState(null);

  const [searchParams] = useSearchParams();
  const threadId = searchParams.get("id");

  useEffect(() => {
    setThread(null);
    setThreadLoading(true);
    fetch('http://localhost:5000/api/thread/' + threadId)
      .then(res => res.json())
      .then(
        (result) => {
            setThread(result);
            setError(null);
        },
        (error) => {
            setThread(null);
            setError(error);
        }
      )
      .finally(() => {
        setThreadLoading(false);
      });
  }, [threadId]);


  const theme = createTheme();

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
          <Box id="thread" sx={{ mt: 1, width: "90%" }}>
          { threadLoading && <CircularProgress /> }
          { error && 
            <Box id="error" sx={{ mt: 1 }}>
              <Alert severity="error">Error querying backend: {error.message}</Alert>
            </Box>
          }
          { thread && 
              <Box>
              { thread.map((msg, index) => (
                <Paper elevation={3} key={index} sx={{ padding: 1, margin: 2 }}>
                  { msg.from && <Typography variant="h6">From: {msg.from}</Typography> }
                  { msg.to && <Typography variant="h6">To: {msg.to}</Typography> }
                  { msg.cc && <Typography variant="h6">CC: {msg.cc}</Typography> }
                  { msg.bcc && <Typography variant="h6">BCC: {msg.bcc}</Typography> }
                  <Typography variant="h6">Date: {msg.date}</Typography>
                  <Typography variant="h6">Subject: {msg.subject}</Typography>
                  <Grid container spacing={1}>
                    { msg.tags.map((tag, index2) => (
                      <Grid item key={index2}>
                        <Chip key={index2} label={tag} style={{ color: getColor(tag) }} onDelete={console.log}/>
                      </Grid>
                    )) }
                  </Grid>
                  <Divider sx={{ marginTop: 2, marginBottom: 2 }} />
                  <Typography style={{whiteSpace: 'pre-line'}} dangerouslySetInnerHTML={{ __html: msg.content }} />
                </Paper>
              )) }
            </Box>
          }
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
