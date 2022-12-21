import React from 'react';

import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';

export class Search extends React.PureComponent {
  constructor(props) {
    super(props);
    let opts = ["tag:unread", "tag:todo", "date:today"];
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
          renderInput={(params) => <TextField {...params} className="kukulkan-queryBox" name="search" variant="standard" fullWidth autoFocus margin="normal" />}
        />
      </Box>
    );
  }
}

// vim: tabstop=2 shiftwidth=2 expandtab
