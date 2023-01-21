import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#558b2f',
    },
    secondary: {
      main: '#ffecb3',
    },
    background: {
      default: '#fff8e1',
      paper: '#f0f4c3',
    }
  },
  components: {
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            backgroundColor: 'rgba(85, 139, 47, 0.3)'
          },
          "&.Mui-selected:hover": {
            backgroundColor: 'rgba(85, 139, 47, 0.4) !important'
          },
          "&:hover": {
            backgroundColor: 'rgba(85, 139, 47, 0.2) !important'
          }
        }
      }
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: 'url("serpent.png")',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom right',
          backgroundAttachment: 'fixed'
        }
      }
    }
  }
});

// https://stackoverflow.com/questions/36721830/convert-hsl-to-rgb-and-hex
function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// https://stackoverflow.com/questions/3426404/create-a-hexadecimal-colour-based-on-a-string-with-javascript
export function getColor(stringInput) {
  let stringUniqueHash = [...stringInput].reduce((acc, char) => {
    return char.charCodeAt(0) + acc;
  }, 0);
  return hslToHex(stringUniqueHash % 360, 95, 40);
}

// https://stackoverflow.com/questions/822452/strip-html-from-text-javascript
export function strip(html) {
  let doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
}

export function extractEmailsSort(string) {
  return string.match(/([^ <>]+@[^ >]+)/g).join('').split('').sort().join('');
}

export function filterTagsColor(tags) {
  return tags.filter(i => { return i !== "replied" && i !== "sent" && i !== "signed" && i !== "passed" && i !== "attachment"; });
}

export function filterSubjectColor(subject) {
  return subject.replace(new RegExp('^( *(RE|FWD|FW|AW) *: *)+', "igm"), "");
}

function padZ(number) {
  return ("" + number).padStart(2, "0");
}

export function formatDate(date) {
  let now = new Date(),
      time = padZ(date.getHours()) + ":" + padZ(date.getMinutes());
  if(date.setHours(0, 0, 0, 0) === now.setHours(0, 0, 0, 0)) { // today
    return time;
  } else if((now - date) / (7 * 24 * 60 * 60 * 1000) < 1) { // less than one week ago
    return date.toLocaleDateString([], { weekday: 'short' }) + " " + time;
  } else if(date.getFullYear() === now.getFullYear()) { // this year
    return padZ(date.getDate()) + "/" + padZ(date.getMonth() + 1) + " " + time;
  } else {
    return date.toLocaleDateString() + " " + time;
  }
}

export function formatDuration(from, to) {
  let diff = to - from;
  if(diff < (91 * 60 * 1000)) {
    return (Math.round(diff / (60 * 1000))) + " minutes";
  } if(diff < (48 * 60 * 60 * 1000)) {
    return (Math.round(diff / (60 * 60 * 1000))) + " hours";
  } if(diff < (14 * 24 * 60 * 60 * 1000)) {
    return (Math.round(diff / (24 * 60 * 60 * 1000))) + " days";
  } if(diff < (12 * 7 * 24 * 60 * 60 * 1000)) {
    return (Math.round(diff / (7 * 24 * 60 * 60 * 1000))) + " weeks";
  } if(diff < (500 * 24 * 60 * 60 * 1000)) {
    return (Math.round(diff / (30 * 24 * 60 * 60 * 1000))) + " months";
  } else {
    return (Math.round(diff / (365.25 * 24 * 60 * 60 * 1000))) + " years";
  }
}

export function apiURL(suffix) {
  if(process.env.NODE_ENV === "production") {
    return "/" + suffix;
  } else {
    return window.location.protocol + "//" + window.location.hostname + ":5000/" + suffix;
  }
}

// https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
export function formatFSz(size) {
  var i = Math.floor(Math.log(size) / Math.log(1024));
  return (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['Bi', 'kiB', 'MiB', 'GiB', 'TiB'][i];
};

// vim: tabstop=2 shiftwidth=2 expandtab
