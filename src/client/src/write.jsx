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
import { ThemeProvider } from '@mui/material/styles';

import AttachFile from '@mui/icons-material/AttachFile';
import Send from '@mui/icons-material/Send';

import invert from 'invert-color';
import { getColor, apiURL, theme } from "./utils.js";

import { hiddenTags } from "./tags.jsx";

class Templates extends React.PureComponent {
  render() {
    return (
      <Grid container spacing={1} sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        { this.props.templates.map((template) => (
          <Grid item><Button id={"template-" + template.shortcut} variant="outlined" onClick={() => this.props.setTemplate(template.template) }>{template.description} ({template.shortcut})</Button></Grid>
        )) }
      </Grid>
    )
  }
}

class AddrComplete extends React.Component {
  constructor(props) {
    super(props);
    this.state = { options: [] };
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
      ref={this.props.elRef}
      onInputChange={(ev, value) => {
        if(value.length > 2) {
          this.props.setLoading(true);
          fetch(apiURL("api/address/" + encodeURIComponent(value)))
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
  const [templates, setTemplates] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = React.useState(false);

  const [sending, setSending] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(-1);
  const [timer, setTimer] = React.useState(null);
  const [sendingMsg, setSendingMsg] = React.useState("");

  const [files, setFiles] = React.useState([]);

  const [baseMsg, setBaseMsg] = useState(null);
  const [template, setTemplate] = useState(null);

  const to = useRef("");
  const cc = useRef("");
  const bcc = useRef("");
  const [from, setFrom] = React.useState(null);
  const [toLoading, setToLoading] = React.useState(false);
  const [ccLoading, setCcLoading] = React.useState(false);
  const [bccLoading, setBccLoading] = React.useState(false);

  const error = useRef(false);
  const sendingTimer = useRef(false);
  const statusMsg = useRef(null);
  const messageId = useRef(null);
  const action = useRef(null);

  const subject = useRef(null);
  const body = useRef(null);
  const tags = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch(apiURL("api/accounts/")).then(v => v.json()),
      fetch(apiURL("api/templates/")).then(v => v.json()),
      fetch(apiURL("api/tags/")).then(v => v.json())
    ]).then(([_accounts, _templates, _tags]) => {
      setAccounts(_accounts);
      setFrom(_accounts.find(a => a.default).id);
      setTemplates(_templates);
      setAllTags(_tags);
    }).catch((e) => {
      setBaseMsg(null);
      error.current = true;
      statusMsg.current = "Error querying backend: " + e.message;
    });
  }, []);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    if(accounts === null) return;

    document.title = "New Message";
    action.current = searchParams.get("action");
    if(!action.current) {
      action.current = "compose";
    }

    messageId.current = searchParams.get("id");
    if(messageId.current !== null) {
      setLoading(true);
      setBaseMsg(null);
      fetch(apiURL("api/message/" + encodeURIComponent(messageId.current)))
        .then(res => res.json())
        .then((result) => {
          setBaseMsg(result);
          if(action.current === "forward" && result.attachments) {
            // attach files attached to previous email
            setFiles(result.attachments.map(a => { return { dummy: true, name: a.filename }; }));
          }
          if(action.current.startsWith("cal-")) {
            let idx = searchParams.get("index");
            setFiles([{ dummy: true, name: result.attachments[idx].filename }]);
          }
          let acct = accounts.find(a => result.to.includes(a.email));
          if(!acct) {
            acct = accounts.find(a => result.from.includes(a.email));
          }
          if(!acct && result.cc) {
            acct = accounts.find(a => result.cc.includes(a.email));
          }
          if(!acct && result.bcc) {
            acct = accounts.find(a => result.bcc.includes(a.email));
          }
          if(!acct && result.delivered_to) {
            acct = accounts.find(a => result.delivered_to.includes(a.email));
          }
          if(acct) {
            setFrom(acct.id);
          }
          error.current = false;
          document.title = "Compose: " + prefix(result.subject);
        })
        .catch((e) => {
          setBaseMsg(null);
          error.current = true;
          statusMsg.current = "Error querying backend: " + e.message;
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [searchParams, accounts]);

  const handleAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(files.concat(Array.from(event.target.files)));
  };

  const sendMsg = () => {
    const formData = new FormData();
    formData.append('refId', messageId.current);
    formData.append('action', action.current);
    formData.append('from', from);
    formData.append('to', to.current.innerText);
    formData.append('cc', cc.current.innerText);
    formData.append('bcc', bcc.current.innerText);
    formData.append('subject', subject.current.value);
    formData.append('tags', tags.current.innerText.split('\n'));
    formData.append('body', body.current.value);
    files.map((f, i) => formData.append('attachment-' + i, f.dummy ? f.name : f));

    fetch(apiURL("api/send"), { method: 'POST', body: formData })
      .then((response) => response.json())
      .then((result) => {
        if(result.sendStatus === 0) {
          error.current = false;
          statusMsg.current = "Message sent.";
        } else {
          error.current = true;
          statusMsg.current = "Failed to send message: " + result.sendOutput;
        }
      })
      .catch((error) => {
        error.current = true;
        statusMsg.current = "Error: " + error;
      })
      .finally(() => {
        setSending(false);
      });
  };

  useEffect(() => {
    clearTimeout(timer);
    if(sending) {
      setTimeLeft(3);
      sendingTimer.current = true;
    } else {
      setTimeLeft(-1);
      sendingTimer.current = false;
    }
  // eslint-disable-next-line
  }, [sending]);

  useEffect(() => {
    if(timeLeft > 0) {
      setSendingMsg("Sending in " + timeLeft + "... (close or press s to cancel)");
      setTimer(setTimeout(() => setTimeLeft(timeLeft - 1), 1000));
    } else if(timeLeft === 0) {
      clearTimeout(timer);
      sendingTimer.current = false;
      setSendingMsg("Sending...");
      sendMsg();
    }
  // eslint-disable-next-line
  }, [timeLeft]);

  useEffect(() => {
    if(body.current) {
      body.current.value = (template ? template : "") + body.current.defaultValue;
    }
  // eslint-disable-next-line
  }, [template]);

  const quote = (text) => {
    return "\n\n\nOn " + baseMsg.date + ", " + baseMsg.from + " wrote:\n> " +
      text.replace(/&gt;/g, ">").replace(/&lt;/g, "<").split('\n').join("\n> ");
  };

  const prefix = (text) => {
    let pre = "";
    if(action.current === "reply" && !text.toLowerCase().startsWith("re:")) {
      pre = "Re: ";
    }
    if(action.current === "forward") {
      pre = "Fw: ";
    }
    if(action.current.startsWith("cal-")) {
      let act = action.current.split('-')[1];
      pre = act[0].toUpperCase() + act.slice(1) + ": ";
    }
    return pre + text;
  };

  const makeToCc = (msg) => {
    if(!msg || !action || !accounts) return [ [], [] ];

    let tmpTo = [], tmpCc = [];
    if(action.current === "reply" || action.current.startsWith("cal-")) {
      if(msg.reply_to) {
        tmpTo = [ msg.reply_to ];
      } else {
        tmpTo = [msg.from].concat(msg.to.split(/(?<=>),\s*|(?<=@[^, ]+),\s*/));
        tmpTo = tmpTo.filter(a => {
          return a.length > 0 && accounts.reduce((cum, acct) => {
            if(cum === false) return false;

            if(a.includes(acct.email)) {
              return false;
            }
            return true;
          }, true);
        });

        if(msg.cc.length > 0) {
          tmpCc = msg.cc.split(/(?<=>),\s*|(?<=@[^, ]+),\s*/);
          tmpCc = tmpCc.filter(a => {
            return a.length > 0 && !tmpTo.includes(a) && accounts.reduce((cum, acct) => {
              if(cum === false) return false;

              if(a.includes(acct.email)) {
                return false;
              }
              return true;
            }, true);
          });
        }
      }
    }
    return [ tmpTo, tmpCc ];
  };

  useHotkeys('*', (ev) => {
    if(document.getElementById("template-" + ev.key)) {
      document.getElementById("template-" + ev.key).click();
    }
  });

  useHotkeys('a', () => document.getElementById("attach").click());
  useHotkeys('y', () => setSending(true));
  useHotkeys('s', () => sendingTimer.current === true && setSending(false));

  const [defTo, defCc] = makeToCc(baseMsg);

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="100%">
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} >
          { loading && <CircularProgress /> }
          { statusMsg.current && <Alert severity={error.current ? "error" : "success"}>{statusMsg.current}</Alert> }
          { templates && <Templates templates={templates} setTemplate={setTemplate} /> }
          { accounts && !loading &&
            <Paper elevation={3} sx={{ padding: 1, margin: 1, width: "min(80em, 80vw)" }}>
              <Grid container spacing={1} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <Grid item>From:</Grid>
                <Grid item><TextField id="from"
                  size="small"
                  value={from}
                  onChange={(ev) => setFrom(ev.target.value)}
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
                  <AddrComplete id="to" elRef={to} loading={toLoading} setLoading={setToLoading} defVal={defTo}/>
                </Grid>
              </Grid>
              <Grid container spacing={1} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <Grid item>CC:</Grid>
                <Grid item xs>
                  <AddrComplete id="cc" elRef={cc} loading={ccLoading} setLoading={setCcLoading} defVal={defCc}/>
                </Grid>
              </Grid>
              <Grid container spacing={1} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <Grid item>BCC:</Grid>
                <Grid item xs>
                  <AddrComplete id="bcc" elRef={bcc} loading={bccLoading} setLoading={setBccLoading} />
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
                  <Snackbar open={sending} message={sendingMsg} onClose={() => sendingTimer.current === true && setSending(false)}/>
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
