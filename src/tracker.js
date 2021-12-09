/* global chrome */

export async function track_entry(date, params) {
  for (var par of params) {
    await track_single_entry(date, par);
  }
}
async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

async function sleep(t) {
  await new Promise((r) => setTimeout(r, t));
}

async function loopAndWait(tabId, func, args) {
  while (true) {
    const frameResults = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: func,
      args: [args],
    });
    if (frameResults[0].result) {
      break;
    }
    await sleep(1000);
  }
}

async function executeAndReturn(tabId, func, args) {
  const frameResults = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: func,
    args: [args],
  });
  return frameResults[0].result;
}

async function waitForQuerySelector(tabId, selector) {
  await loopAndWait(
    tabId,
    (arg) => {
      return document.querySelector(arg) ? true : false;
    },
    selector
  );
}

function findOptionValueContains(args) {
  console.log(args);
  const allOptions = document.querySelectorAll(args[0] + " > option");
  console.log(allOptions);
  for (var i = 0; i < allOptions.length; ++i) {
    console.log(allOptions[i]);
    console.log(allOptions[i].text);
    if (allOptions[i].text.includes(args[1])) {
      return allOptions[i].value;
    }
  }
  return null;
}

async function waitForButtonAndClick(tabId, qs) {
  await waitForQuerySelector(tabId, qs);
  await loopAndWait(
    tabId,
    (arg) => {
      document.querySelector(arg).click();
      return true;
    },
    [qs]
  );
}

async function triggerChangeEvent(tabId, qs) {
  await chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (arg) => {
      const event = new Event("change");
      document.querySelector(arg).dispatchEvent(event);
    },
    args: [qs],
  });
}

async function waitForOptionValue(tabId, parentSelect, optionText) {
  while (true) {
    const categoryValue = await executeAndReturn(
      tabId,
      findOptionValueContains,
      [parentSelect, optionText]
    );
    if (categoryValue) {
      return categoryValue;
    }
    await sleep(1000);
  }
}

async function waitForReadyState(tabId) {
  await loopAndWait(tabId, () => document.readyState === "complete", []);
}

async function setFieldValue(tabId, qs, value) {
  await executeAndReturn(
    tabId,
    (args) => {
      document.querySelector(args[0]).value = args[1];
    },
    [qs, value]
  );
}

async function waitAndSelectValueFromOptionText(tabId, qs, text, mustChange) {
  await waitForQuerySelector(tabId, qs);
  const value = await waitForOptionValue(tabId, qs, text);
  await setFieldValue(tabId, qs, value);
  if (mustChange) {
    triggerChangeEvent(tabId, qs);
    await sleep(500);
  }
  await waitForReadyState(tabId);
}
async function waitAndSetFromValue(tabId, qs, value) {
  await waitForQuerySelector(tabId, qs);
  await setFieldValue(tabId, qs, value);
  await waitForReadyState(tabId);
}

const DATE_FIELD = "#ctl00_ContentPlaceHolder_txtFrom";
const PROJECT_DROPDOWN = "#ctl00_ContentPlaceHolder_idProyectoDropDownList";
const CATEGORY_DROPDOWN =
  "#ctl00_ContentPlaceHolder_idCategoriaTareaXCargoLaboralDropDownList";
const DESCRIPTION_DROPDOWN =
  "#ctl00_ContentPlaceHolder_idTareaXCargoLaboralDownList";
const FOCAL_POINT_DROPDOWN =
  "#ctl00_ContentPlaceHolder_idFocalPointClientDropDownList";

const COMMENTS_TEXTBOX = "#ctl00_ContentPlaceHolder_CommentsTextBox";
const HOURS_FIELD = "#ctl00_ContentPlaceHolder_TiempoTextBox";

const ACCEPT_BUTTON = "#ctl00_ContentPlaceHolder_btnAceptar";
const ADD_BUTTON = "a[href='TimeTrackerAdd.aspx']";

async function track_single_entry(date, params) {
  console.log(params);
  const tab = await getCurrentTab();

  await waitForButtonAndClick(tab.id, ADD_BUTTON);

  await waitAndSelectValueFromOptionText(
    tab.id,
    PROJECT_DROPDOWN,
    params.project,
    true
  );
  await waitAndSetFromValue(tab.id, DATE_FIELD, date);
  await waitAndSetFromValue(tab.id, HOURS_FIELD, params.hours);
  await waitAndSetFromValue(tab.id, COMMENTS_TEXTBOX, params.comments);
  await waitAndSelectValueFromOptionText(
    tab.id,
    CATEGORY_DROPDOWN,
    params.category,
    true
  );
  await waitAndSelectValueFromOptionText(
    tab.id,
    DESCRIPTION_DROPDOWN,
    params.description,
    false
  );
  await waitAndSelectValueFromOptionText(
    tab.id,
    FOCAL_POINT_DROPDOWN,
    params.focal_point,
    false
  );

  await waitForButtonAndClick(tab.id, ACCEPT_BUTTON);
}
