/* global chrome */
/* global __doPostBack */

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

export async function track_entry(date, params) {
  for (var par of params) {
    await track_single_entry(date, par);
  }
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

async function waitForAddButtonAndClick(tabId) {
  await waitForQuerySelector(tabId, "a[href='TimeTrackerAdd.aspx']");
  await loopAndWait(
    tabId,
    () => {
      document.querySelector("a[href='TimeTrackerAdd.aspx']").click();
      return true;
    },
    []
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

async function track_single_entry(date, params) {
  console.log(params);
  const tab = await getCurrentTab();

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
    true
  );
  await waitAndSelectValueFromOptionText(
    tab.id,
    FOCAL_POINT_DROPDOWN,
    params.focal_point,
    false
  );

  // await waitForQuerySelector(tab.id, PROJECT_DROPDOWN);

  // const projectValue = await waitForOptionValue(
  //   tab.id,
  //   PROJECT_DROPDOWN,
  //   params.project
  // );
  // await setSelectValue(tab.id, PROJECT_DROPDOWN, projectValue);
  // triggerChangeEvent(tab.id, PROJECT_DROPDOWN);

  // console.log("Project value:", projectValue);

  // const categoryValue = await executeAndReturn(
  //   tab.id,
  //   findOptionValueContains,
  //   [
  //     "#ctl00_ContentPlaceHolder_idCategoriaTareaXCargoLaboralDropDownList",
  //     params.category,
  //   ]
  // );
  // console.log("Trust value:", categoryValue);

  // const descriptionValue = await executeAndReturn(
  //   tab.id,
  //   findOptionValueContains,
  //   [
  //     "#ctl00_ContentPlaceHolder_idTareaXCargoLaboralDownList",
  //     params.description,
  //   ]
  // );
  // console.log("Trust value:", descriptionValue);

  // const focalPointValue = await executeAndReturn(
  //   tab.id,
  //   findOptionValueContains,
  //   [
  //     "#ctl00_ContentPlaceHolder_idFocalPointClientDropDownList",
  //     params.focal_point,
  //   ]
  // );
  // console.log("Trust value:", focalPointValue);

  // const frameResults = await chrome.scripting.executeScript({
  //   target: { tabId: tab.id },
  //   func: (arg) => {
  //     const event = new Event("change");
  //     document.querySelector(arg).dispatchEvent(event);
  //   },
  //   args: ["#ctl00_ContentPlaceHolder_idProyectoDropDownList"],
  // });
  // const frameResults = await chrome.scripting.executeScript({
  //   target: { tabId: tab.id },
  //   func: (arg) => __doPostBack(arg, ""),
  //   args: ["ctl00$ContentPlaceHolder$idProyectoDropDownList"],
  // });
  // console.log(frameResults[0].result);

  // function set_entry_data(theEntry) {
  //   // Sets the date

  //   const dateElement = document.querySelector(
  //     "#ctl00_ContentPlaceHolder_txtFrom"
  //   );
  //   dateElement.value = theEntry.date;
  //   console.log(theEntry);

  //   var projectOption;
  //   const allOptions = document.querySelectorAll("option");
  //   console.log(allOptions);
  //   for (var i = 0; i < allOptions.length; ++i) {
  //     console.log(allOptions[i]);
  //     if (allOptions[i].text.includes("Trust")) {
  //       projectOption = allOptions[i];
  //       break;
  //     }
  //   }
  //   console.log(projectOption);

  //   const projectSelect = document.querySelector(
  //     "#ctl00_ContentPlaceHolder_idProyectoDropDownList"
  //   );

  //   console.log(projectSelect);
  //   projectSelect.value = projectOption.value;

  //   __doPostBack("ctl00$ContentPlaceHolder$idProyectoDropDownList", "");

  //   return true;
  // }

  // chrome.scripting.executeScript(
  //   { target: { tabId: tab.id }, func: set_entry_data, args: [params] },
  //   (injectionResults) => {
  //     for (const frameResult of injectionResults) {
  //       console.log("result 2: " + frameResult.result);
  //     }
  //   }
  // );
}

// async function do_everything_else() {
//   // Sets date:
//   $("#ctl00_ContentPlaceHolder_txtFrom")[0].value = "01/01/2020";
//   // Sets project:
//   $("#ctl00_ContentPlaceHolder_idProyectoDropDownList")[0].value = $(
//     'option:contains("Trust")'
//   )[0].value;
//   await __doPostBack("ctl00$ContentPlaceHolder$idProyectoDropDownList", "");

//   // Sets hours:
//   $("#ctl00_ContentPlaceHolder_TiempoTextBox")[0].value = "hours";

//   // Sets comments:
//   $("#ctl00_ContentPlaceHolder_CommentsTextBox")[0].value = "comments";

//   // Sets the Task Category
//   $(
//     "#ctl00_ContentPlaceHolder_idCategoriaTareaXCargoLaboralDropDownList"
//   )[0].value = $('option:contains("Development")')[0].value;
//   await __doPostBack(
//     "ctl00$ContentPlaceHolder$idCategoriaTareaXCargoLaboralDropDownList",
//     ""
//   );

//   // Sets the Task Description
//   $("#ctl00_ContentPlaceHolder_idTareaXCargoLaboralDownList")[0].value = $(
//     'option:contains("Debug")'
//   )[0].value;

//   // Sets the focal point, but the category must be set first!
//   $("#ctl00_ContentPlaceHolder_idFocalPointClientDropDownList")[0].value = $(
//     'option:contains("Ramiro")'
//   )[0].value;

//   //
//   await $("#ctl00_ContentPlaceHolder_btnAceptar")[0].click();
// }
