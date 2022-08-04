import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from "react-router-dom";

import { useHotkeys } from 'react-hotkeys-hook';

import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import AttachFile from '@mui/icons-material/AttachFile';
import Send from '@mui/icons-material/Send';

import invert from 'invert-color';
import { getColor } from "./utils.js";

import { hiddenTags } from "./tags.jsx";

class AddrComplete extends React.Component {
  constructor(props) {
    super(props);
    this.state = { options: [] };
    if(this.props.defVal) this.props.setValue(this.props.defVal);
  }

  render() {
    return (
      <Autocomplete
      id={this.props.id}
      freeSolo
      autoComplete={true}
      autoHighlight={true}
      disableClearable={true}
      multiple
      fullWidth
      options={this.state.options}
      defaultValue={this.props.defVal}
      filterSelectedOptions
      onChange={(ev, value) => {
        this.props.setValue(value);
      }}
      onInputChange={(ev, value) => {
        if(value.length > 2) {
          this.props.setLoading(true);
          fetch(window.location.protocol + '//' + window.location.hostname + ':5000/api/address/' + value)
            .then(res => res.json())
            .then((result) => {
              this.setState({ options: result});
            })
            .finally(() => {
              this.props.setLoading(false);
            });
        }
      }}
      renderTags={(value, getTagProps) => {
        return value.map((option, index) => (
          <Chip label={option}
            {...getTagProps({ index })}
            style={{ backgroundColor: getColor(option), color: invert(getColor(option), true) }}
          />
        ))
      }}
      renderInput={(params) => <TextField {...params} variant="standard" InputProps={{...params.InputProps, endAdornment: (
        <React.Fragment>
          {this.props.loading ? <CircularProgress color="inherit" size={20} /> : null}
          {params.InputProps.endAdornment}
        </React.Fragment>
      )}}/>}
      />
    )
  }
}

export function Write() {
  const [accounts, setAccounts] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = React.useState(false);

  const [sending, setSending] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(-1);
  const [timer, setTimer] = React.useState(null);
  const [sendingMsg, setSendingMsg] = React.useState("");

  const [from, setFrom] = React.useState(null);
  const [to, setTo] = React.useState("");
  const [toLoading, setToLoading] = React.useState(false);
  const [cc, setCc] = React.useState("");
  const [ccLoading, setCcLoading] = React.useState(false);
  const [bcc, setBcc] = React.useState("");
  const [bccLoading, setBccLoading] = React.useState(false);

  const [files, setFiles] = React.useState([]);

  const [baseMsg, setBaseMsg] = useState(null);

  const error = useRef(null);
  const messageId = useRef(null);
  const action = useRef(null);

  const subject = useRef(null);
  const body = useRef(null);
  const tags = useRef(null);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    action.current = searchParams.get("action");
    if(!action.current) {
      action.current = "compose";
    }

    messageId.current = searchParams.get("id");
    if(messageId.current !== null) {
      setLoading(true);
      setBaseMsg(null);
      fetch(window.location.protocol + '//' + window.location.hostname + ':5000/api/message/' + encodeURIComponent(messageId.current))
        .then(res => res.json())
        .then(
          (result) => {
            setBaseMsg(result);
            if(action.current === "forward" && result.attachments) {
              // attach files attached to previous email
              setFiles(result.attachments.map(a => { return { dummy: true, name: a.filename }; }));
            }
            error.current = null;
          },
          (e) => {
            setBaseMsg(null);
            error.current = e;
          })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [searchParams]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFrom(event.target.value);
  };

  const handleAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(files.concat(Array.from(event.target.files)));
  };

  const sendMsg = () => {
    const formData = new FormData();
    formData.append('refId', messageId.current);
    formData.append('action', action.current);
    formData.append('from', from);
    formData.append('to', to);
    formData.append('cc', cc);
    formData.append('bcc', bcc);
    formData.append('subject', subject.current.value);
    formData.append('tags', tags.current.innerText.split('\n'));
    formData.append('body', body.current.value);
    files.map((f, i) => formData.append('attachment-' + i, f.dummy ? f.name : f));

    fetch(window.location.protocol + '//' + window.location.hostname + ':5000/api/send', { method: 'POST', body: formData })
      .then((response) => response.json())
      .then((result) => {
        if(result.sendStatus === 0) {
          setSendingMsg("Message sent: " + result.sendOutput);
        } else {
          setSendingMsg("Failed to send message: " + result.sendOutput);
        }
      })
      .catch((error) => {
        setSendingMsg("Error: " + error);
      })
      .finally(() => {
        setTimeout(() => setSending(false), 10000);
      });
  };

  useEffect(() => {
    if(sending) {
      setTimeLeft(5);
    } else {
      clearTimeout(timer);
    }
  // eslint-disable-next-line
  }, [sending]);

  useEffect(() => {
    if(timeLeft > 0) {
      setSendingMsg("Sending in " + timeLeft + "... (close or press s to cancel)");
      setTimer(setTimeout(() => setTimeLeft(timeLeft - 1), 1000));
    } else if(timeLeft === 0) {
      setSendingMsg("Sending...");
      sendMsg();
    }
  // eslint-disable-next-line
  }, [timeLeft]);

  const quote = (text) => {
    return "\n\n\nOn " + baseMsg.date + ", " + baseMsg.from + " wrote:\n\n>" +
      text.replace(/&gt;/g, ">").replace(/&lt;/g, "<").split('\n').join("\n>");
  };

  const prefix = (text) => {
    let pre = "";
    if(action.current === "reply" && !text.toLowerCase().startsWith("re:")) {
      pre = "Re: ";
    }
    if(action.current === "forward") {
      pre = "Fw: ";
    }
    return pre + text;
  };

  const makeTo = (msg) => {
    let tmp = [];
    if(action.current === "reply") {
      tmp = [baseMsg.from].concat(baseMsg.to.split(/\s*[,|]\s*/));
      tmp = tmp.filter(a => {
        return accounts.reduce((cum, acct) => {
          if(cum === false) return false;

          if(a.includes(acct.email)) {
            return false;
          }
          return true;
        }, true);
      });
    }
    return tmp;
  };

  useEffect(() => {
    fetch(window.location.protocol + '//' + window.location.hostname + ':5000/api/accounts/')
      .then(res => res.json())
      .then((result) => {
        setAccounts(result);
        setFrom(result.find(a => a.default).id);
      });
  }, []);

  useEffect(() => {
    fetch(window.location.protocol + '//' + window.location.hostname + ':5000/api/tags/')
      .then(res => res.json())
      .then((result) => {
        setAllTags(result);
      });
  }, []);

  useHotkeys('a', () => document.getElementById("attach").click());
  useHotkeys('y', () => setSending(true));
  useHotkeys('s', () => setSending(false));

  const theme = createTheme();

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="100%">
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} >
          { loading && <CircularProgress /> }
          { error.current && <Alert severity="error">Error querying backend: {error.current.message}</Alert> }
          { accounts && !loading &&
            <Paper elevation={3} sx={{ padding: 1, margin: 1, width: "80em" }}>
              <Grid container spacing={1} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <Grid item>From:</Grid>
                <Grid item><TextField id="from"
                  size="small"
                  value={from}
                  onChange={handleChange}
                  select>
                    {accounts.map((acct) => (
                      <MenuItem key={acct.id} value={acct.id}>
                        {acct.name + " <" + acct.email + ">"}
                      </MenuItem>
                  ))}
                </TextField></Grid>
              </Grid>
              <Grid container spacing={1} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <Grid item>To:</Grid>
                <Grid item xs>
                  <AddrComplete id="to" setValue={setTo} loading={toLoading} setLoading={setToLoading} defVal={baseMsg ? makeTo(baseMsg) : []}/>
                </Grid>
              </Grid>
              <Grid container spacing={1} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <Grid item>CC:</Grid>
                <Grid item xs>
                  <AddrComplete id="cc" setValue={setCc} loading={ccLoading} setLoading={setCcLoading} defVal={baseMsg && baseMsg.cc.length > 0 ? baseMsg.cc.split(/\s*[,|]\s*/) : []}/>
                </Grid>
              </Grid>
              <Grid container spacing={1} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <Grid item>BCC:</Grid>
                <Grid item xs>
                  <AddrComplete id="bcc" setValue={setBcc} loading={bccLoading} setLoading={setBccLoading} />
                </Grid>
              </Grid>
              <Grid container spacing={1} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <Grid item>Subject:</Grid>
                <Grid item xs><TextField variant="standard" defaultValue={baseMsg ? prefix(baseMsg.subject) : ""} fullWidth id="subject" inputRef={subject}/></Grid>
              </Grid>

              <Grid container spacing={1} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <Grid item>Tags:</Grid>
                <Grid item xs><Autocomplete
                  id="tags"
                  freeSolo
                  autoComplete={true}
                  autoHighlight={true}
                  disableClearable={true}
                  multiple
                  fullWidth
                  options={allTags.filter(tag => !hiddenTags.includes(tag))}
                  defaultValue={baseMsg ? baseMsg.tags.filter(tag => !hiddenTags.includes(tag)) : []}
                  filterSelectedOptions
                  ref={tags}
                  renderTags={(value, getTagProps) => {
                    return value.map((option, index) => (
                      <Chip label={option}
                        {...getTagProps({ index })}
                        style={{ backgroundColor: getColor(option), color: invert(getColor(option), true) }}
                      />
                    ))
                  }}
                  renderInput={(params) => <TextField {...params} variant="standard" InputProps={{...params.InputProps}}/>}
                /></Grid>
              </Grid>

              <Divider sx={{ marginTop: 2, marginBottom: 2 }} />

              <TextField multiline minRows={10} fullWidth id="body" defaultValue={baseMsg ? quote(baseMsg.body["text/plain"]) : ""} style={{ marginBottom: ".5em" }} inputRef={body}/>
              { files.map((f, i) => (
                <Chip key={i} label={f.name} variant="outlined" style={{ margin: ".3em" }} onDelete={() => {
                  setFiles(files.filter(fi => fi !== f));
                }}/>
              ))}
              <Grid container style={{ marginTop: ".5em" }}>
                <Grid item xs>
                  <Button key="attach" id="attach" startIcon={<AttachFile/>} variant="outlined" component="label">
                    Attach
                    <input type="file" multiple hidden onChange={handleAttach}/>
                  </Button>
                </Grid>
                <Grid item>
                  <Button key="send" startIcon={<Send/>} variant="outlined" onClick={() => setSending(true)}>Send</Button>
                  <Snackbar open={sending} message={sendingMsg} onClose={() => setSending(false)}/>
                </Grid>
              </Grid>
            </Paper>
          }
        </Box>
      </Container>
    </ThemeProvider>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
