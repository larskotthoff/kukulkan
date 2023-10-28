import React from 'react';

import RenderIfVisible from 'react-render-if-visible';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import AttachFile from '@mui/icons-material/AttachFile';
import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { TagBar, hiddenTags } from "./tags.jsx";

import invert from 'invert-color';
import { formatDate, formatDuration, getColor } from "./utils.js";

class ThreadRow extends React.PureComponent {
  constructor(props) {
    super(props);
    this.renderDateNum = this.renderDateNum.bind(this);
    this.onRefChange = this.onRefChange.bind(this);
    this.state = { editTags: false };

    this.element = null;
    this.focusTagBar = false;
    this.del = false;

    this.height = "2em";
  }

  renderDateNum(thread) {
    let res = formatDate(new Date(thread.newest_date * 1000));
    if(thread.total_messages > 1) {
      res += " (" + thread.total_messages + "/" +
        formatDuration(new Date(thread.oldest_date * 1000), new Date(thread.newest_date * 1000)) + ")";
    }
    return res;
  }

  componentDidUpdate() {
    if(this.element && this.props.active) {
      this.element.scrollIntoView({block: "nearest"});
    }

    if(this.focusTagBar && this.element) {
      this.element.getElementsByTagName("input")[0].focus();
      this.focusTagBar = false;
    }

    if(this.del && this.element) {
      this.element.getElementsByClassName("kukulkan-tagBar")[0].dispatchEvent(new CustomEvent('delete'));
      this.del = false;
    }

  }

  onRefChange(node) {
    if(node) {
      this.element = node;
      node.addEventListener("editTags", () => {
        this.setState({ editTags: true });
        this.focusTagBar = true;
      });

      node.addEventListener("delete", () => {
        this.setState({ editTags: true });
        this.del = true;
      });
    }
  }

  render() {
    return (
      <RenderIfVisible initialVisible={this.props.index < 100} key={this.props.index} defaultHeight={this.height} visibleOffset={2500} rootElement={"tbody"} placeholderElement={"tr"}>
        <TableRow ref={this.onRefChange} key={this.props.index} hover={true} style={{ height: this.height }} className={ this.props.active ? "Mui-selected" : "" } onClick={(e) => {
          // check if we're clicking in a tag edit box
          if("input" !== document.activeElement.tagName.toLowerCase()) {
            this.props.setActiveThread(this.props.index);
            window.open('/thread?id=' + this.props.thread.thread_id, '_blank');
          }
        }}>
          <TableCell>{ this.props.thread.tags.includes("attachment") && <AttachFile /> }</TableCell>
          <TableCell style={{ maxWidth: "10vw", whiteSpace: "break-spaces" }}>{ this.renderDateNum(this.props.thread) }</TableCell>
          <TableCell style={{ maxWidth: "50vw", whiteSpace: "break-spaces" }}>
            <Grid container spacing={1} wrap="nowrap">
              <Grid item>
                { this.state.editTags ?
                  <TagBar className="kukulkan-tagBar"
                    tagsObject={this.props.thread} options={this.props.allTags}
                    id={this.props.thread.thread_id} hiddenTags={hiddenTags} type="thread"/> :
                  <span onClick={(e) => {
                    e.stopPropagation();
                    this.setState({ editTags: true });
                  }}>
                  { this.props.thread.tags.filter(tag => !hiddenTags.includes(tag)).sort().map((tag, index2) => (
                    <span key={index2} style={{ backgroundColor: getColor(tag), color: invert(getColor(tag), true), padding: 2, margin: 2, borderRadius: 3 }}>{tag}</span>
                  )) }
                  </span>
                }
              </Grid>
              <Grid item>
                {this.props.thread.subject}
              </Grid>
            </Grid>
          </TableCell>
          <TableCell style={{ maxWidth: "30vw", whiteSpace: "break-spaces" }}>
            {this.props.thread.authors.split(/\s*[,|]\s*/).map((author, index) => (
              <span key={index} style={{ backgroundColor: getColor(author), color: invert(getColor(author), true), padding: 2, margin: 2, borderRadius: 3 }}>{author}</span>
            )) }
          </TableCell>
        </TableRow>
      </RenderIfVisible>
    );
  }
}

export class Threads extends React.PureComponent {
  render() {
    return (
      <Box id="threads" style={{ width: "100%" }}>
      { this.props.threads &&
        <React.Fragment>
        <Typography align="right">{this.props.threads.length} threads.</Typography>
          <TableContainer id="threadsTable">
            <Table size="small" padding="none">
              { this.props.threads.map((thread, index) => (
                <ThreadRow key={index} index={index} thread={thread} active={index === this.props.activeThread} setActiveThread={this.props.setActiveThread} allTags={this.props.allTags}/>
              )) }
            </Table>
          </TableContainer>
        </React.Fragment>
      }
      </Box>
    );
  }
}

// vim: tabstop=2 shiftwidth=2 expandtab
