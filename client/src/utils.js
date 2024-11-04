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

export function filterAdminTags(tags) {
  if(!tags) return tags;
  const adminTags = [ "attachment", "passed", "replied", "sent", "signed" ];
  return tags.filter(i => !adminTags.includes(i));
}

export function filterSubjectColor(subject) {
  return subject.replace(new RegExp('^( *(RE|FWD|FW|AW) *: *)+', "igm"), "");
}

function padZ(number) {
  return ("" + number).padStart(2, "0");
}

export function formatDate(date) {
  let now = new Date(),
      time = `${padZ(date.getHours())}:${padZ(date.getMinutes())}`;
  if(date.setHours(0, 0, 0, 0) === now.setHours(0, 0, 0, 0)) { // today
    return time;
  } else if((now - date) / (7 * 24 * 60 * 60 * 1000) < 1) { // less than one week ago
    return date.toLocaleDateString([], { weekday: 'short' }) + " " + time;
  } else if(date.getFullYear() === now.getFullYear()) { // this year
    return `${padZ(date.getDate())}/${padZ(date.getMonth() + 1)} ${time}`;
  } else {
    return `${date.toLocaleDateString()} ${time}`;
  }
}

export function formatDuration(from, to) {
  const diff = to - from,
        hour = 60 * 60 * 1000;
  if(diff < (91 * 60 * 1000)) {
    return (Math.round(diff / (60 * 1000))) + "分";
  } else if(diff < (48 * hour)) {
    return (Math.round(diff / hour)) + "時";
  } else if(diff < (14 * 24 * hour)) {
    return (Math.round(diff / (24 * hour))) + "日";
  } else if(diff < (12 * 7 * 24 * hour)) {
    return (Math.round(diff / (7 * 24 * hour))) + "週";
  } else if(diff < (500 * 24 * hour)) {
    return (Math.round(diff / (30 * 24 * hour))) + "月";
  } else {
    return (Math.round(diff / (365.25 * 24 * hour))) + "年";
  }
}

export function renderDateNumThread(thread, long = true) {
  let res = formatDate(new Date(thread.newest_date * 1000));
  if(thread.total_messages > 1 && long) {
    res += ` (${thread.total_messages}/${formatDuration(new Date(thread.oldest_date * 1000), new Date(thread.newest_date * 1000))})`;
  }
  return res;
}

export function apiURL(suffix) {
  if(process.env.NODE_ENV === "production") {
    return `/${suffix}`;
  } else {
    return `${window.location.protocol}//${window.location.hostname}:5000/${suffix}`;
  }
}

// https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
export function formatFSz(size) {
  var i = Math.floor(Math.log(size) / Math.log(1024));
  return (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['Bi', 'kiB', 'MiB', 'GiB', 'TiB'][i];
}

// vim: tabstop=2 shiftwidth=2 expandtab
