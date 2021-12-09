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
    await track_single_entry({ date: date, params: par });
  }
}

function searchQuerySelector(selector) {
  return document.querySelector(selector) ? true : false;
}
async function track_single_entry(params) {
  const tab = await getCurrentTab();
  await waitForQuerySelector(tab.id, "a[href='TimeTrackerAdd.aspx']");

  function tracker_click_add() {
    document.querySelector("a[href='TimeTrackerAdd.aspx']").click();
    return new Promise((r) => setTimeout(r, 2000)).then(
      (_) => true,
      (_) => false
    );
  }

  const result1 = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: tracker_click_add,
  });

  // await waitForQuerySelector(tab.id, "#ctl00_ContentPlaceHolder_txtFrom");

  console.log("Showing result 1");
  console.log(result1);
  const result2 = await result1;
  console.log("Showing result 2");
  console.log(result2);
  // chrome.scripting.executeScript(
  //   { target: { tabId: tab.id }, func: tracker_click_add },
  //   (injectionResults) => {
  //     for (const frameResult of injectionResults) {
  //       console.log("result 1: " + frameResult.result);
  //     }
  //   }
  // );

  console.log("before 2 seconds");
  await new Promise((r) => setTimeout(r, 2000));
  console.log("waited 2 seconds");

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
