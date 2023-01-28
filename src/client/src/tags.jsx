import React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';

import invert from 'invert-color';
import { getColor, apiURL } from "./utils.js";

export const hiddenTags = ["attachment", "replied", "sent", "passed", "signed"];

export class TagBar extends React.Component {
  constructor(props) {
    super(props);
    this.element = React.createRef();
    this.state = { updating: false };
    this.handleChange = this.handleChange.bind(this);
    this.addTag = this.addTag.bind(this);
    this.delTag = this.delTag.bind(this);
  }

  addTag(tag) {
    this.setState({ updating: true });
    fetch(apiURL("api/tag/add/" + this.props.type + '/' + encodeURIComponent(this.props.id) + '/' + tag))
      .then((result) => {
          if(!this.props.tagsObject.tags.includes(tag)) {
            this.props.tagsObject.tags.push(tag);
          }
      })
      .catch((error) => console.warn(error))
      .finally(() => this.setState({ updating: false }));
  }

  delTag(tag) {
    this.setState({ updating: true });
    fetch(apiURL("api/tag/remove/" + this.props.type + '/' + encodeURIComponent(this.props.id) + '/' + tag))
      .then((result) => {
          this.props.tagsObject.tags = this.props.tagsObject.tags.filter(t => t !== tag);
      })
      .catch((error) => console.warn(error))
      .finally(() => this.setState({ updating: false }));
  }

  componentDidMount() {
    this.element.current.addEventListener("delete", () => {
      if(this.props.tagsObject.tags.includes("unread") > -1) this.delTag("unread");
      this.addTag("deleted");
    });

    this.element.current.addEventListener("read", () => {
      this.delTag("unread");
    });
  }

  handleChange(ev, value, reason) {
    if(reason === "selectOption" || reason === "createOption") {
      let addedTag = value.filter(tag => !this.props.tagsObject.tags.includes(tag))[0];
      this.addTag(addedTag);
    } else if(reason === "removeOption") {
      let deletedTag = this.props.tagsObject.tags.filter(tag => !value.includes(tag))[0];
      this.delTag(deletedTag);
    }
  }

  render() {
    return (
      <Autocomplete
        ref={this.element}
        freeSolo
        autoComplete={true}
        autoHighlight={true}
        disableClearable={true}
        multiple
        fullWidth
        className={this.props.className}
        options={this.props.options}
        filterSelectedOptions
        defaultValue={this.props.tagsObject.tags.filter(tag => this.props.hiddenTags ? !this.props.hiddenTags.includes(tag) : true)}
        value={this.props.tagsObject.tags.filter(tag => this.props.hiddenTags ? !this.props.hiddenTags.includes(tag) : true)}
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
            {this.state.updating ? <CircularProgress color="inherit" size={20} /> : null}
            {params.InputProps.endAdornment}
          </React.Fragment>
        )}}/>}
        onChange={this.handleChange}/>
    )
  }
}

// vim: tabstop=2 shiftwidth=2 expandtab
