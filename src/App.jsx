import { useRef, useState } from "react";
import Editor from "./components/Editor"
import "./index.css";


const defaultValue = [
      {
        insert: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut ",
      },
      {
        insert: "labore et dolore magna aliqua.",
        attributes: {
          highlight: "a",
        },
      },
      {
        insert: " Ut enim ad minim veniam, ",
      },
      {
        insert: "quis nostrud exercitation",
        attributes: {
          highlight: "b",
        },
      },
      {
        insert: " ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum\n",
      },
    ]

function App(props) {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const [highlights, setHighlights] = useState(props.highlights);

  function setHover(key, hover) {
    setHighlights((hl) =>
      hl.map((el) => {
        if (el.id === key) {
          return { ...el, hover };
        } else {
          return el;
        }
      })
    );
  }

  const tags = highlights.map((h) => {
    return (
      <li
        style={{ color: h.hover ? "red" : "blue", cursor: "pointer" }}
        onClick={() => {
          setHover(h.id, !h.hover);
        }}
        key={h.id}
      >
        {h.id}
      </li>
    );
  });

  return (
    <div className="highlight-app">
      <h1>Highlighter App with Quill</h1>
      <Editor
        ref={quillRef}
        defaultValue={defaultValue}
        highlights={highlights}
        setHighlights={setHighlights}
        setHover={setHover}
      />
      <div className="highlights-list">
        <h3>Highlights:</h3>
        <ul>{tags}</ul>
      </div>
    </div>
  );
}

export default App;