import { useState, useEffect, useRef } from "react";
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
          `${date}\t${e.project}\t${e.hours}\t${e.category}\t${e.description}\t${e.comments}\t${e.focal_point}`
      )
      .join("\n") + "\n"
  );
}

function fix_hours(entry) {
  var e2 = { ...entry };
  e2.hours = (Number.parseInt(entry.hours) / 3600).toFixed(3);
  return e2;
}

function fix_empty_commment(entry) {
  var piece = { ...entry };
  piece.comments = entry.comments === "" ? "." : entry.comments;
  return piece;
}

function add_count(entry, count) {
  var piece = { ...entry };
  if (count > 1) {
    piece.comments = `${entry.comments} (${count})`;
  }
  return piece;
}

function break_long_entry_in_pieces(pEntry) {
  const entry = pEntry;
  var count = 1;
  if (entry.hours > 3600) {
    var pieces = [];

    var total = entry.hours;
    while (total > 3600) {
      var piece = { ...entry };
      piece.hours = 3600;
      pieces.push(add_count(piece, count));
      total -= 3600;
      count += 1;
    }

    if (total > 0) {
      var remainingPiece = { ...entry };
      remainingPiece.hours = total;
      pieces.push(add_count(remainingPiece, count));
    }
    return pieces;
  } else {
    return [entry];
  }
}

function prepare_data(pEntries, shouldBreak) {
  const entries = pEntries.map(fix_empty_commment);

  const newEntries = shouldBreak
    ? entries.flatMap(break_long_entry_in_pieces)
    : entries;
  return newEntries.map(fix_hours);
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
  const item = window.localStorage.getItem(key);
  if (item) {
    return JSON.parse(item);
  }
  return def;
}
function setToLocalStorage(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function AccurateTimer(props) {
  const setTimeCallback = props.data;

  const [timeView, setTimeView] = useState(0);

  const time = useRef(0);
  const initial = useRef(new Date().getTime());
  const accumulated = useRef(0);

  const [active, setActive] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (active) {
        time.current =
          accumulated.current + new Date().getTime() - initial.current;
        setTimeCallback(time.current / 1000);
        setTimeView(time.current / 1000 / 60);
      } else {
      }
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  });

  function toggleActive(_) {
    if (!active) {
      accumulated.current = time.current;
      initial.current = new Date().getTime();
    }
    setActive(!active);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <input
        className="input"
        value={active ? `${timeView.toFixed(2)} min` : timeView}
        onChange={(event) => {
          var auxTime = Number.parseFloat(event.target.value);
          if (!auxTime) auxTime = 0;
          time.current = auxTime * 1000 * 60;
          setTimeView(auxTime);
          setTimeCallback(auxTime * 60);
        }}
        disabled={active}
      />
      <input
        className="input"
        value={(timeView / 60).toFixed(2) + " hours"}
        disabled
      />
      <button
        className={"button " + (active ? "is-danger" : "is-success")}
        onClick={toggleActive}
      >
        {active ? "Active" : "Innactive"}
      </button>
    </div>
  );
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
  const [breakHourly, setBreakHourly] = useState(
    getFromLocalStorage("breakHourly", false)
  );

  function duplicate(e) {
    var newEntries = [...entries].map((x) => set(x, "active", false));
    newEntries.unshift(set(set({ ...e }, "comments", "."), "hours", 0));
    setEntries(newEntries);
  }

  function toggleBreakHourly() {
    setBreakHourly(!breakHourly);
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
    // console.log("Saving stuff to local storage");
    window.localStorage.setItem("entries", JSON.stringify(entries));
    window.localStorage.setItem("breakHourly", JSON.stringify(breakHourly));
  }, [entries, breakHourly]);

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

  function fromSecondToHours(v) {
    return v / 3600;
  }

  const [timeGlobal, setTimeGlobal] = useState(0);

  return (
    <div className="App container">
      <div style={{ display: "flex" }}>
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
          onClick={() =>
            download_csv_file(todayDate, prepare_data(entries, breakHourly))
          }
        >
          Download
        </button>
        <button
          className="button"
          onClick={() =>
            write_to_clipboard(todayDate, prepare_data(entries, breakHourly))
          }
        >
          Copy to clipboard
        </button>
        <button
          className="button"
          onClick={() => {
            track_entry(todayDate, prepare_data(entries, breakHourly));
          }}
        >
          Track entries
        </button>
      </div>

      <div style={{ display: "flex" }}>
        <button className="button" onClick={() => setTodayDate(initialDate)}>
          Today
        </button>
        <input
          className="input"
          value={todayDate}
          onChange={(event) => setTodayDate(event.target.value)}
        />
        <button className="button" disabled>
          Total
        </button>
        <input
          className="input"
          value={
            fromSecondToHours(
              entries
                .map((e) => Number.parseFloat(e.hours))
                .reduce((a, b) => a + b)
            ) + " hours"
          }
          disabled
        />
        <button
          className={"button " + (breakHourly ? "is-danger" : "is-success")}
          onClick={toggleBreakHourly}
        >
          {breakHourly
            ? "Break items into hours"
            : "Don't break items into hours"}
        </button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <td>Time</td>
            <td>Proj/Category/Description</td>
            <td>Comments</td>
            <td>Focal point</td>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => {
            return (
              <tr key={i}>
                <td>
                  <AccurateTimer data={(t) => setHours(i, t)} />
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
                <td style={{ minWidth: "250px" }}>
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
                <td>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <input
                      className="input"
                      value={e.focal_point}
                      onChange={(event) => setFocalPoint(i, event.target.value)}
                    />
                    <button className="button" onClick={() => duplicate(e)}>
                      Duplicate entry
                    </button>
                    {entries.length > 1 ? (
                      <button
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
                  </div>
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
