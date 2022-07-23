import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Outlet, useSearchParams } from "react-router-dom";
import { Table, Column, AutoSizer } from "react-virtualized";
import 'react-virtualized/styles.css';

import CssBaseline from '@mui/material/CssBaseline';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import TableContainer from '@mui/material/TableContainer';
import AttachFile from '@mui/icons-material/AttachFile';
import Reply from '@mui/icons-material/Reply';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { useHotkeys } from 'react-hotkeys-hook';

import { TagBar } from "./tags.jsx";
import { Thread } from "./thread.jsx";
import { SingleMessage } from "./message.jsx";

import { formatDate, formatDuration } from "./utils.js";

class Search extends React.Component {
  constructor(props) {
    super(props);
    let opts = ["tag:unread", "tag:todo", "date:1d.."];
    let qs = localStorage.getItem("queries");
    if(qs !== null) opts = [...new Set(opts.concat(JSON.parse(qs)))];
    this.state = { opts: opts };
  }

  render() {
    return (
      <Box component="form" noValidate onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        this.props.setSearchParams({query: data.get("search")});
      }}>
        <Autocomplete
          freeSolo
          autoComplete={true}
          autoHighlight={true}
          value={this.props.query ? this.props.query : ""}
          options={this.state.opts}
          onInputChange={(ev, value, reason) => {
            if(reason === "input") {
              let pts = value.split(':'),
                  last = pts.pop();
              if(pts.length > 0 && pts[pts.length - 1].endsWith("tag") && last.length > 0) {
                // autocomplete possible tag
                let tagCandidates = this.props.allTags.filter((t) => { return t.startsWith(last); });
                this.setState({ opts: tagCandidates.map((t) => { return pts.join(':') + ":" + t; }) });
              }
            }
          }}
          renderInput={(params) => <TextField {...params} label="Search" className="kukulkan-queryBox" name="search" variant="standard" fullWidth autoFocus margin="normal" />}
        />
      </Box>
    );
  }
}

class Threads extends React.Component {
  constructor(props) {
    super(props);
    this.hiddenTags = ["attachment", "replied", "sent"];
    this.renderDate = this.renderDate.bind(this);
    this.renderTagBar = this.renderTagBar.bind(this);
  }

  renderDate({rowData}) {
    let res = formatDate(new Date(rowData.newest_date * 1000));
    if(rowData.total_messages > 1) {
      res += " (" + formatDuration(new Date(rowData.oldest_date * 1000), new Date(rowData.newest_date * 1000)) + ")";
    }
    return res;
  }

  renderTagBar({rowData, rowIndex}) {
    return <TagBar className={rowIndex === this.props.activeThread ? "kukulkan-tagbar-active" : "" }
      tagsObject={rowData} options={this.props.allTags}
      id={rowData.thread_id} hiddenTags={this.hiddenTags} type="thread"/>
  }

  render() {
    return (
      <Box id="threads" sx={{ mt: 1, width: "90%" }}>
      { this.props.threads &&
        <React.Fragment>
        <Typography align="right">{this.props.threads.length} threads.</Typography>
        <TableContainer id="threadsTable" style={{ height: "calc(100vh - 13em)", overflowX: "hidden" }}>
          <AutoSizer>
            {({ width, height }) => {
              return <Table
                  width={width}
                  height={height}
                  headerHeight={40}
                  rowHeight={40}
                  rowGetter={({index}) => this.props.threads[index]}
                  rowCount={this.props.threads.length}
                  rowStyle={({index}) => {
                    return this.props.activeThread === index ? { backgroundColor: '#eee' } : {};
                  }}
                  scrollToIndex={this.props.activeThread}
                  onRowClick={(e, index, rowData) => {
                    // check if we're clicking in a tag edit box
                    if("input" !== document.activeElement.tagName.toLowerCase()) {
                      e.preventDefault();
                      this.props.setActiveThread(index);
                      window.open('/thread?id=' + rowData.thread_id, '_blank');
                    }
                  }}
                  overscanRowCount={10}>
                    <Column label="Date (Duration)" dataKey="newest_date" width={200} cellRenderer={this.renderDate}/>
                    <Column label="#" dataKey="total_messages" width={30}/>
                    <Column dataKey="tags" width={30}
                      cellRenderer={function({rowData}) {
                        if(rowData.tags.includes("attachment"))
                          return <AttachFile />;
                      }}
                    />
                    <Column dataKey="tags" width={30}
                      cellRenderer={function({rowData}) {
                        if(rowData.tags.includes("replied") || rowData.tags.includes("sent"))
                          return <Reply />;
                      }}
                    />
                    <Column label="Tags" dataKey="tags" width={200} flexGrow={2} flexShrink={1} cellRenderer={this.renderTagBar}/>
                    <Column label="Subject" dataKey="subject" flexGrow={4} flexShrink={1} width={400}/>
                    <Column label="Authors" dataKey="authors" flexGrow={2} flexShrink={1} width={400}
                      cellRenderer={function({cellData}) { return cellData.replace("| ", ", "); }}
                    />
                </Table>
            }}
          </AutoSizer>
        </TableContainer>
        </React.Fragment>
      }
      </Box>
    );
  }
}

function Kukulkan() {
  const [threads, setThreads] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeThread, setActiveThread] = useState(0);

  const query = useRef("");
  const error = useRef(null);

  const theme = createTheme();

  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    query.current = searchParams.get("query");
    if(query.current !== null) {
      let qs = localStorage.getItem("queries");
      if(qs === null) qs = [];
      else qs = JSON.parse(qs);
      qs.unshift(query.current);
      qs = [...new Set(qs)];
      // store up to 10 most recent queries
      localStorage.setItem("queries", JSON.stringify(qs.slice(0, 10)));

      setLoading(true);
      fetch(window.location.protocol + '//' + window.location.hostname + ':5000/api/query/' + query.current)
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
    fetch(window.location.protocol + '//' + window.location.hostname + ':5000/api/tags/')
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

  useHotkeys('Enter', () => window.open('/thread?id=' + threads[activeThread].thread_id, '_blank'), [threads, activeThread]);

  useHotkeys('t', (e) => {
    e.preventDefault();
    document.getElementsByClassName("kukulkan-tagbar-active")[0].getElementsByTagName("input")[0].focus();
  });

  useHotkeys('Del', () => {
    document.getElementsByClassName("kukulkan-tagbar-active")[0].dispatchEvent(new CustomEvent('delete'));
  });

  useHotkeys('/', (e) => {
    e.preventDefault();
    document.getElementsByClassName("kukulkan-queryBox")[0].getElementsByTagName("input")[0].focus();
  });

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
          <Grid container spacing={2}
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                mt: 1,
                width: "70%"
              }}>
            <Grid item sx={{ width: "90%" }}>
              <Search setSearchParams={setSearchParams} query={query.current} allTags={allTags} />
            </Grid>
            <Grid item>
              { loading && <CircularProgress /> }
            </Grid>
          </Grid>
          { error.current && <Alert severity="error">Error querying backend: {error.current.message}</Alert> }
          <Threads threads={threads} activeThread={activeThread} setActiveThread={setActiveThread} allTags={allTags} />
        </Box>
      </Container>
    </ThemeProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Outlet />}>
        <Route index element={<Kukulkan />} />
        <Route path="thread" element={<Thread />} />
        <Route path="message" element={<SingleMessage />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

// vim: tabstop=2 shiftwidth=2 expandtab
