// https://stackoverflow.com/questions/3426404/create-a-hexadecimal-colour-based-on-a-string-with-javascript
export function getColor(stringInput) {
  let stringUniqueHash = [...stringInput].reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  return `hsl(${stringUniqueHash % 360}, 95%, 35%)`;
}

// https://stackoverflow.com/questions/822452/strip-html-from-text-javascript
export function strip(html) {
  let doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
}

export function extractEmailsSort(string) {
  let tmp = string.split('');
  let res = [];

  let keep = false;
  for(let i = 0; i < tmp.length; i++) {
    if(tmp[i] === '<') keep = true;
    if(tmp[i] === '>') keep = false;
    if(keep) res.push(tmp[i]);
  }

  return res.sort().join('');
}

export function filterTagsColor(tags) {
  return tags.filter(i => { return i !== "replied" && i !== "sent"; });
}

export function filterSubjectColor(subject) {
  return subject.replace(new RegExp('^( *(RE|FWD|FW|AW) *: *)+', "igm"), "");
}

// vim: tabstop=2 shiftwidth=2 expandtab
