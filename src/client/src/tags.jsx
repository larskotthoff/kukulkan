import React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';

import { getColor } from "./utils.js";

export class TagBar extends React.Component {
  constructor(props) {
    super(props);
    this.element = React.createRef();
    this.state = { updating: false };
    this.setColors = this.setColors.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  setColors() {
    if(this.element.current) {
      Array.from(this.element.current.getElementsByClassName("MuiChip-label")).forEach(chip => {
        chip.style.color = getColor(chip.textContent);
      });
    }
  }

  componentDidMount() {
    this.setColors();
  }

  componentDidUpdate() {
    this.setColors();
  }

  handleChange(ev, value, reason) {
    if(reason === "selectOption" || reason === "createOption") {
      this.setState({ updating: true });
      let addedTag = value.filter(tag => !this.props.tagsObject.tags.includes(tag))[0];
      fetch(window.location.protocol + '//' + window.location.hostname + ':5000/api/tag/add/' + this.props.type + '/' + this.props.id + '/' + addedTag)
        .then(
          (result) => {
            this.props.tagsObject.tags.push(addedTag);
          },
          (error) => {console.log(error);}
        ).finally(() => this.setState({ updating: false }));
    } else if(reason === "removeOption") {
      this.setState({ updating: true });
      let deletedTag = this.props.tagsObject.tags.filter(tag => !value.includes(tag))[0];
      fetch(window.location.protocol + '//' + window.location.hostname + ':5000/api/tag/remove/' + this.props.type + '/' + this.props.id + '/' + deletedTag)
        .then(
          (result) => {
            this.props.tagsObject.tags = this.props.tagsObject.tags.filter(tag => tag !== deletedTag);
          },
          (error) => {console.log(error);}
        ).finally(() => this.setState({ updating: false }));
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
        options={this.props.options}
        filterOptions={(opts, state) => opts.filter((tag) => this.props.tagsObject.tags.indexOf(tag) === -1 && tag.startsWith(state.inputValue))}
        defaultValue={this.props.tagsObject.tags.filter(tag => this.props.hiddenTags ? this.props.hiddenTags.indexOf(tag) === -1 : true)}
        value={this.props.tagsObject.tags.filter(tag => this.props.hiddenTags ? this.props.hiddenTags.indexOf(tag) === -1 : true)}
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
