import { KEY_ALT, KEY_CAPSLOCK, KEY_CTRL, KEY_META, KEY_NUMLOCK, KEY_SCROLL, KEY_SCROLL_LOCK, KEY_SHIFT } from "./Constant";

// ms to time, "00:00:00"
export const msToTime = (milliseconds, isShowMMSS = false) => {
  let seconds = Math.floor((milliseconds) % 60);
  let minutes = "";
  if(isShowMMSS)
    minutes = Math.floor(milliseconds / 60);
  else
    minutes = Math.floor((milliseconds / 60) % 60);
  let hours = Math.floor((milliseconds / (60 * 60)) % 24);

  return (
    (isShowMMSS ? "" : ("0" + hours).slice(-2) + ":") +
    ("0" + minutes).slice(-2) +
    ":" +
    ("0" + seconds).slice(-2)
  );
}

// check if object is empty
export const isEmpty = (obj) => {
  if (obj == null || obj == undefined) return !obj;
  else if (typeof obj == 'string' || Array.isArray(obj)) return obj.length === 0;
  else if (typeof obj == 'object') return Object.keys(obj).length === 0;
  else return !obj;
}

// convert hex to rgb
export const hexToRGB = (hex) => {
    let r = 0, g = 0, b = 0;

    // 3 digits
    if (hex.length == 4) {
      r = "0x" + hex[1] + hex[1];
      g = "0x" + hex[2] + hex[2];
      b = "0x" + hex[3] + hex[3];

    // 6 digits
    } else if (hex.length == 7) {
      r = "0x" + hex[1] + hex[2];
      g = "0x" + hex[3] + hex[4];
      b = "0x" + hex[5] + hex[6];
    }
   
    return "rgb("+ +r + ", " + +g + ", " + +b + ")";
}

// set number minimum fraction digits format
export const setMinimumFractionFormat = (number = 1, minimumFractionNum = 1) => {
  return (number).toLocaleString(
    undefined, // leave undefined to use the visitor's browser 
              // locale or a string like 'en-US' to override it.
    { minimumFractionDigits: minimumFractionNum }
  );
}

// Send data between components
export const EventBus = {
  on(event, callback) {
    document.addEventListener(event, (e) => callback(e.detail));
  },
  dispatch(event, data) {
    document.dispatchEvent(new CustomEvent(event, { detail: data }));
  },
  remove(event, callback) {
    document.removeEventListener(event, callback);
  },
};

// get item by property from array
export const getItemFromArr = (array, property, threshold) => {
  if (array == undefined || (array && array.length == 0)) return {};
  if (property.length) {
    let res = array.find(item => item[property] == threshold)
    return res == undefined ? {} : res;
  } else {
    let res = array.find(item => item == threshold)
    return res == undefined ? "" : res;
  }
}

// get index by property from array
export const getIndexFromArr = (array, property, threshold) => {
  if (array == undefined || (array && array.length == 0)) return -1;
  if(property.length)
    return array.findIndex(item => item[property] == threshold);
  else
    return array.findIndex(item => item == threshold);
}

export const getModifierState = (event) => {
  let modifier = "";
  // if (
  //   event.getModifierState(KEY_SCROLL_LOCK) ||
  //   event.getModifierState(KEY_SCROLL)
  // ) {
  //   modifier = modifier + KEY_SCROLL_LOCK + " ";
  // }
  if (event.getModifierState(KEY_CTRL)) {
    modifier = modifier + KEY_CTRL + " ";
  }
  if (event.getModifierState(KEY_ALT)) {
    modifier = modifier + KEY_ALT + " ";
  }
  // if (event.getModifierState(KEY_META)) {
  //   modifier = modifier + KEY_META + " ";
  // }
  if (event.getModifierState(KEY_SHIFT)) {
    modifier = modifier + KEY_SHIFT + " ";
  }
  // if (event.getModifierState(KEY_NUMLOCK)) {
  //   modifier = modifier + KEY_NUMLOCK + " ";
  // }
  // if (event.getModifierState(KEY_CAPSLOCK)) {
  //   modifier = modifier + KEY_CAPSLOCK + " ";
  // }

  return modifier.trim();
}