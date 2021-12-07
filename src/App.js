import { useState, useEffect } from "react";
import { /*get,*/ set } from "@rybr/lenses";
import "./App.css";

function time_tracker_data(entries) {
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
          `${e.date}\t${e.project}\t${(e.hours / 3600).toFixed(3)}\t${
            e.category
          }\t${e.description}\t${e.comments}\t${e.focal_point}`
      )
      .join("\n") + "\n"
  );
}

function write_to_clipboard(entries) {
  navigator.clipboard.writeText(time_tracker_data(entries));
}

function download_csv_file(entries) {
  var data = time_tracker_data(entries);

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

  const initial = {
    date: formatDate(new Date()),
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

  function duplicate(e) {
    var newEntries = [...entries].map((x) => set(x, "active", false));
    newEntries.push(set(set({ ...e }, "comments", ""), "hours", 0));
    setEntries(newEntries);
  }
  function setDate(i, v) {
    setEntries(set([...entries], i, "date", v));
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
    <div className="App">
      <div>
        <button
          onClick={() => {
            setToLocalStorage("memo", entries);
            setEntries([initial]);
          }}
        >
          Clear
        </button>
        <button
          onClick={() => {
            const memo = getFromLocalStorage("memo", [initial]);
            // setToLocalStorage("memo", [initial]);
            setEntries(memo);
          }}
        >
          Back
        </button>
        <button onClick={() => download_csv_file(entries)}>Download</button>
        <button onClick={() => write_to_clipboard(entries)}>
          Copy to clipboard
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <td>Date</td>
            <td>Seconds</td>
            <td>Hours</td>
            <td>Active</td>
            <td>Project</td>
            <td>Category</td>
            <td>Description</td>
            <td>Comments</td>
            <td>Focal point</td>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => {
            return (
              <tr key={i}>
                <td>
                  <input
                    value={e.date}
                    onChange={(event) => setDate(i, event.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={e.hours}
                    onChange={(event) => setHours(i, event.target.value)}
                  />
                </td>
                <td>{(e.hours / 3600).toFixed(3)}</td>
                <td>
                  <button onClick={(_) => toggleActive(i)}>
                    {e.active ? "Active" : "Innactive"}
                  </button>
                </td>
                <td>
                  <input
                    value={e.project}
                    onChange={(event) => setProject(i, event.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={e.category}
                    onChange={(event) => setCategory(i, event.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={e.description}
                    onChange={(event) => setDescription(i, event.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={e.comments}
                    onChange={(event) =>
                      setEntries(
                        set([...entries], i, "comments", event.target.value)
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    value={e.focal_point}
                    onChange={(event) => setFocalPoint(i, event.target.value)}
                  />
                </td>
                <td>
                  <button onClick={() => duplicate(e)}>+</button>
                </td>
                <td>
                  {entries.length > 1 ? (
                    <button
                      onClick={() =>
                        setEntries(entries.filter((_, ii) => ii !== i))
                      }
                    >
                      -
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
