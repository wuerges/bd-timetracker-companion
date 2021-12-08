import { useState, useEffect } from "react";
import { /*get,*/ set } from "@rybr/lenses";
import "./App.css";
import { track_entry } from "./tracker.js";

function time_tracker_data(date, entries) {
  // Example:     ----------------
  // date:        7/12/2021
  // project:     Trust Payments - Trust Payments
  // hours:       1
  // category:    Training (Trainee)
  // description: Self training
  // comments:    Testing bd-time csv format
  // focal_point: Ramiro Aguilar
  return (
    entries
      .map(
        (e) =>
          `${date}\t${e.project}\t${(e.hours / 3600).toFixed(3)}\t${
            e.category
          }\t${e.description}\t${e.comments === "" ? "." : e.comments}\t${
            e.focal_point
          }`
      )
      .join("\n") + "\n"
  );
}

function write_to_clipboard(date, entries) {
  navigator.clipboard.writeText(time_tracker_data(date, entries));
}

function download_csv_file(date, entries) {
  var data = time_tracker_data(date, entries);

  var hiddenElement = document.createElement("a");
  hiddenElement.href = "data:text/csv;charset=utf-8," + encodeURI(data);
  hiddenElement.target = "_blank";

  //provide the name for the CSV file to be downloaded
  hiddenElement.download = "time_tracker.tcsv";
  hiddenElement.click();
}

function formatDate(date) {
  return (
    date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear()
  );
}

function getFromLocalStorage(key, def) {
  return JSON.parse(window.localStorage.getItem(key)) || def;
}
function setToLocalStorage(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function App() {
  // Fields from the official time tracker:
  // Date (dd/mm/yyyy)             -> Default today (new Date()): 'data'
  // Hours                         -> Default form local storage: 'hours'
  // Project                       -> Default from local storage: 'project'
  // Task Category                 -> Default from local storage: 'category'
  // Task Description              -> Default from local storage: 'description'
  // Comments (500 characters max) -> Default always empty:       'comments'
  // Client Focal Point:           -> Default from local storage: 'focal_point'

  const initialDate = formatDate(new Date());

  const initial = {
    hours: 0,
    active: false,
    project: getFromLocalStorage("project", "A project"),
    category: getFromLocalStorage("category", "A category"),
    description: getFromLocalStorage("description", "A description"),
    comments: "",
    focal_point: getFromLocalStorage("focal_point", "A focal point"),
  };
  const [entries, setEntries] = useState(
    getFromLocalStorage("entries", [initial])
  );

  const [todayDate, setTodayDate] = useState(initialDate);

  function duplicate(e) {
    var newEntries = [...entries].map((x) => set(x, "active", false));
    newEntries.push(set(set({ ...e }, "comments", ""), "hours", 0));
    setEntries(newEntries);
  }

  function setHours(i, v) {
    setEntries(set([...entries], i, "hours", v));
  }
  function setProject(i, v) {
    setToLocalStorage("project", v);
    setEntries(set([...entries], i, "project", v));
  }
  function setCategory(i, v) {
    setToLocalStorage("category", v);
    setEntries(set([...entries], i, "category", v));
  }
  function setDescription(i, v) {
    setToLocalStorage("description", v);
    setEntries(set([...entries], i, "description", v));
  }
  function setFocalPoint(i, v) {
    setToLocalStorage("focal_point", v);
    setEntries(set([...entries], i, "focal_point", v));
  }

  function toggleActive(i) {
    setEntries(set([...entries], i, "active", (x) => !x));
  }

  useEffect(() => {
    window.localStorage.setItem("entries", JSON.stringify(entries));
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setEntries(
        [...entries].map((e) => {
          if (e.active) {
            return set(e, "hours", (x) => parseInt(x) + 1);
          }
          return e;
        })
      );
      return false;
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  });

  return (
    <div className="App container">
      <div className="navbar">
        <button
          className="button"
          onClick={() => {
            setToLocalStorage("memo", entries);
            setEntries([initial]);
          }}
        >
          Clear
        </button>
        <button
          className="button"
          onClick={() => {
            const memo = getFromLocalStorage("memo", [initial]);
            // setToLocalStorage("memo", [initial]);
            setEntries(memo);
          }}
        >
          Back
        </button>
        <button
          className="button"
          onClick={() => download_csv_file(todayDate, entries)}
        >
          Download
        </button>
        <button
          className="button"
          onClick={() => write_to_clipboard(todayDate, entries)}
        >
          Copy to clipboard
        </button>
        <button
          className="button"
          onClick={() => track_entry(todayDate, entries)}
        >
          Track entries
        </button>
      </div>

      <div className="navbar">
        <button className="button" onClick={() => setTodayDate(initialDate)}>
          Today
        </button>
        <input
          style={{ maxWidth: "400px" }}
          className="input"
          value={todayDate}
          onChange={(event) => setTodayDate(event.target.value)}
        />
      </div>

      <table className="table">
        <thead>
          <tr>
            <td>Time</td>
            <td>Project/Category/Description</td>
            <td>Comments</td>
            <td>Focal point</td>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => {
            return (
              <tr key={i}>
                <td style={{ width: "100px" }}>
                  <input
                    className="input"
                    value={e.hours}
                    onChange={(event) => setHours(i, event.target.value)}
                  />
                  <input
                    className="input"
                    value={(e.hours / 3600).toFixed(3)}
                    disabled
                  />
                  <button
                    className={
                      "button " + (e.active ? "is-danger" : "is-success")
                    }
                    onClick={(_) => toggleActive(i)}
                  >
                    {e.active ? "Active" : "Innactive"}
                  </button>
                </td>
                <td>
                  <input
                    className="input"
                    value={e.project}
                    onChange={(event) => setProject(i, event.target.value)}
                  />
                  <input
                    className="input"
                    value={e.category}
                    onChange={(event) => setCategory(i, event.target.value)}
                  />
                  <input
                    className="input"
                    value={e.description}
                    onChange={(event) => setDescription(i, event.target.value)}
                  />
                </td>
                <td style={{ minWidth: "300px" }}>
                  <textarea
                    className="textarea"
                    value={e.comments}
                    onChange={(event) =>
                      setEntries(
                        set([...entries], i, "comments", event.target.value)
                      )
                    }
                  />
                </td>
                <td style={{ width: "200px", minWidth: "200px" }}>
                  <input
                    className="input"
                    value={e.focal_point}
                    onChange={(event) => setFocalPoint(i, event.target.value)}
                  />
                  <button
                    style={{ width: "200px", minWidth: "200px" }}
                    className="button"
                    onClick={() => duplicate(e)}
                  >
                    Duplicate entry
                  </button>
                  {entries.length > 1 ? (
                    <button
                      style={{ width: "200px", minWidth: "200px" }}
                      className="button"
                      onClick={() =>
                        setEntries(entries.filter((_, ii) => ii !== i))
                      }
                    >
                      Remove entry
                    </button>
                  ) : (
                    <></>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default App;
