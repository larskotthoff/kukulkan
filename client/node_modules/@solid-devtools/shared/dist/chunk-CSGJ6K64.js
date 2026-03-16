// packages/shared/src/utils.ts
function assert(condition, message, cause) {
  if (!condition) {
    throw Error(message ?? "Assertion failed", { cause });
  }
}
function msg(kind, data) {
  return { kind, data };
}
var LOG_LABEL_CYAN = `\x1B[1;30m\x1B[46msolid-devtools\x1B[0m`;
function info(data) {
  console.info(LOG_LABEL_CYAN, data);
  return data;
}
function log(message, ...args) {
  console.log(LOG_LABEL_CYAN + " " + message, ...args);
  return;
}
function warn(message, ...args) {
  console.warn(LOG_LABEL_CYAN + " " + message, ...args);
  return;
}
function error(message, ...args) {
  console.error(LOG_LABEL_CYAN + " " + message, ...args);
  return;
}
function log_message(to, from, e) {
  console.log(`${LOG_LABEL_CYAN} \x1B[36m${to}\x1B[0m <- \x1B[36m${from}\x1B[0m: \x1B[35m${e.kind}\x1B[0m:`, e.data);
}
function formatTime(d = /* @__PURE__ */ new Date()) {
  return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2);
}
function interceptPropertySet(obj, key, cb) {
  const descriptor = Object.getOwnPropertyDescriptor(obj, key);
  if (!descriptor) {
    let value = obj[key];
    Object.defineProperty(obj, key, {
      set(newValue) {
        value = newValue;
        cb(newValue);
      },
      get() {
        return value;
      }
    });
    return;
  }
  const { set } = descriptor;
  if (!set) return;
  Object.defineProperty(obj, key, {
    set(value) {
      cb(value);
      set.call(this, value);
    },
    get() {
      return descriptor.get?.call(this);
    }
  });
}
var asArray = (value) => Array.isArray(value) ? value : [value];
var isObject = (o) => typeof o === "object" && !!o;
function callArrayProp(object, key, ...args) {
  const arr = object[key];
  if (arr) for (const cb of arr) cb(...args);
}
function pushToArrayProp(object, key, value) {
  let arr = object[key];
  if (arr) arr.push(value);
  else arr = object[key] = [value];
  return arr;
}
function trimString(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "\u2026";
}
function findIndexById(array, id) {
  for (let i = 0; i < array.length; i++) if (array[i].id === id) return i;
  return -1;
}
function findItemById(array, id) {
  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    if (item.id === id) return item;
  }
}
var splitOnColon = (str) => {
  const splitIndex = str.indexOf(":");
  if (splitIndex === -1) return [str, null];
  return [str.slice(0, splitIndex), str.slice(splitIndex + 1)];
};
function whileArray(toCheck, callback) {
  let index = 0;
  let current = toCheck[index++];
  while (current) {
    const result = callback(current, toCheck);
    if (result !== void 0) return result;
    current = toCheck[index++];
  }
}
function dedupeArrayById(input) {
  const ids = /* @__PURE__ */ new Set();
  const deduped = [];
  for (let i = input.length - 1; i >= 0; i--) {
    const update = input[i];
    if (ids.has(update.id)) continue;
    ids.add(update.id);
    deduped.push(update);
  }
  return deduped;
}
function mutate_filter(array, callback) {
  for (let i = array.length - 1; i >= 0; i--) {
    if (!callback(array[i])) array.splice(i, 1);
  }
}
function mutate_remove(array, item) {
  const index = array.indexOf(item);
  if (index !== -1) array.splice(index, 1);
}

export {
  assert,
  msg,
  LOG_LABEL_CYAN,
  info,
  log,
  warn,
  error,
  log_message,
  formatTime,
  interceptPropertySet,
  asArray,
  isObject,
  callArrayProp,
  pushToArrayProp,
  trimString,
  findIndexById,
  findItemById,
  splitOnColon,
  whileArray,
  dedupeArrayById,
  mutate_filter,
  mutate_remove
};
