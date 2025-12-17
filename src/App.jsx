import { useRef, useEffect, useState } from "react";
import Quill from "quill";
import { registerHighlightFormat, setupHoverListeners, HighlightStateManager } from "./plugins/quillHighlightPlugin";
import "./index.css";

// Register the highlight format once at module load
registerHighlightFormat();

function App(props) {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const highlightStateManagerRef = useRef(new HighlightStateManager());
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

  useEffect(() => {
    if (!containerRef.current) return;

    // Create toolbar HTML
    const toolbarHtml = `
      <div id="toolbar" class="ql-toolbar ql-snow">
        <button class="ql-bold" title="Bold"></button>
        <button class="ql-italic" title="Italic"></button>
        <button class="ql-underline" title="Underline"></button>
        <button class="ql-highlight-btn" title="Add highlight">✏️</button>
      </div>
    `;
    
    containerRef.current.innerHTML = toolbarHtml + '<div class="ql-container ql-snow"></div>';

    // Create Quill instance
    const quill = new Quill(containerRef.current.querySelector('.ql-container'), {
      theme: "snow",
      modules: {
        toolbar: containerRef.current.querySelector('#toolbar'),
      },
    });

    // Setup highlight button handler
    const highlightBtn = containerRef.current.querySelector('.ql-highlight-btn');
    if (highlightBtn) {
      highlightBtn.addEventListener('click', () => {
        const selection = quill.getSelection();
        if (selection && selection.length > 0) {
          const highlightId = Math.random().toString(36).substr(2, 9);
          
          // Apply highlight
          quill.formatText(selection.index, selection.length, 'highlight', highlightId);

          setHighlights((prev) => [
            ...prev,
            {
              id: highlightId,
              type: "claim",
              hover: false,
            },
          ]);
        }
      });
    }

    // Set initial content with pre-highlighted text
    quill.setContents([
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
    ]);

    quillRef.current = quill;

    // Setup highlight state manager callbacks
    highlightStateManagerRef.current.onHoverChange = (id, hover) => {
      setHover(id, hover);
    };

    // Setup hover listeners
    setupHoverListeners(quill, (id, hover) => {
      setHover(id, hover);
    });

    return () => {
      if (quill) {
        quill.disable();
      }
    };
  }, []);

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
      <div ref={containerRef} className="quill-editor" />
      <div className="highlights-list">
        <h3>Highlights:</h3>
        <ul>{tags}</ul>
      </div>
    </div>
  );
}

export default App;