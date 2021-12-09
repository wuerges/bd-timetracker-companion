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

function findOptionValueContains(text) {
  const allOptions = document.querySelectorAll("option");
  // console.log(allOptions);
  for (var i = 0; i < allOptions.length; ++i) {
    // console.log(allOptions[i]);
    // console.log(allOptions[i].text);
    if (allOptions[i].text.includes(text)) {
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

async function track_single_entry(date, params) {
  console.log(params);
  const tab = await getCurrentTab();
  // waitForAddButtonAndClick(tab.id);
  await waitForQuerySelector(
    tab.id,
    "#ctl00_ContentPlaceHolder_idProyectoDropDownList"
  );
  const projectValue = await executeAndReturn(
    tab.id,
    findOptionValueContains,
    params.project
  );
  console.log("Trust value:", projectValue);
  const categoryValue = await executeAndReturn(
    tab.id,
    findOptionValueContains,
    params.category
  );
  console.log("Trust value:", categoryValue);

  const descriptionValue = await executeAndReturn(
    tab.id,
    findOptionValueContains,
    params.description
  );
  console.log("Trust value:", descriptionValue);

  const focalPointValue = await executeAndReturn(
    tab.id,
    findOptionValueContains,
    params.focal_point
  );
  console.log("Trust value:", focalPointValue);

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
