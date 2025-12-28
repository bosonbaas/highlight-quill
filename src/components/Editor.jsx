import { useEffect, useRef } from 'react';
import Quill from "quill";
import katex from 'katex';
import { nanoid } from "nanoid";
import { registerHighlightFormat, setupHoverListeners, updateHoverFromState } from "../plugins/quillHighlightPlugin";
import 'katex/dist/katex.min.css';

window.katex = katex;

// Register the highlight format once at module load
registerHighlightFormat();

// Editor is an uncontrolled React component
export default function Editor({highlights, setHighlights, setHover, defaultValue, ref}){
  
  // Why am I making these refs? This is carryover from
  // https://quilljs.com/playground/react
  const containerRef = useRef(null);
  const setHoverRef = useRef(setHover);
  const defaultValueRef = useRef(defaultValue);
  
  function addHighlight(hl) {
    setHighlights((prev) => [
      ...prev,
      hl,
    ]);
  }

  const addHighlightRef = useRef(addHighlight);
  
  useEffect(() => {
    // Sync hover state to visual display
    const hoveredState = highlights.reduce((hs, hl) => {
      hs[hl.id] = hl.hover;
      return hs;
    }, {})
    highlights.forEach(hl => {
      updateHoverFromState(hl.id, hoveredState);
    });
  }, [highlights])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return;

    // Construct custom toolbar
    // Create toolbar HTML
    const toolbarHtml = `
      <button class="ql-bold" title="Bold"></button>
      <button class="ql-italic" title="Italic"></button>
      <button class="ql-underline" title="Underline"></button>
      <button class="ql-formula" title="Underline"></button>
      <button class="ql-highlight-btn" title="Add highlight">✏️</button>
    `;
    const toolbar = container.ownerDocument.createElement('div')
    toolbar.id = "toolbar"
    toolbar.classList.add("ql-toolbar", "ql-snow")
    toolbar.innerHTML = toolbarHtml;

    // Construct editor
    const editor = container.ownerDocument.createElement('div')
    editor.classList.add("ql-container", "ql-snow")

    // Add to the editor container
    const toolbarContainer = container.appendChild(toolbar)
    const editorContainer = container.appendChild(editor)

    // Create Quill instance
    const quill = new Quill(editorContainer, {
      theme: "snow",
      modules: {
        toolbar: {
          container: toolbarContainer,
          handlers: {
            'highlight-btn': function() { // Match the class name 'ql-custom-button' (minus 'ql-')
                const range = this.quill.getSelection();
                if (range) {
                    // Toggle the format
                    const highlightId = nanoid()
                    this.quill.format('highlight', highlightId);
                    addHighlightRef?.current({
                      id: highlightId,
                      type: "claim",
                      hover: false,
                    })
                }
            }
          }
        }
      },
    });

    ref.current = quill;

    // Set initial content with pre-highlighted text
    if (defaultValueRef.current) {
      quill.setContents(defaultValueRef.current);
    }

    // Setup hover listeners. This only has to be run once
    // since the MutationObserver will handle adding new listeners
    setupHoverListeners(quill, (id, hover) => {
      setHoverRef?.current(id, hover);
    });

    return () => {
      quill?.disable();
      editor?.remove();
      toolbar?.remove();
    };
  }, [ref]);

  return <div ref={containerRef}></div>;
}