import { useRef, useEffect, useState } from "react";
import { nanoid } from "nanoid";
import Highlight from "./components/Highlight"
// This might be the wrong scope for this??
const hoverState = new Set();

function App(props) {
  const [highlights, setHighlights] = useState(props.highlights);
  const [html, setHTML] = useState("")

  function setHover(key, hover){
    setHighlights((hl) => hl.map((el)=>{
      if(el.id == key){
        return {...el, hover}
      } else {
        return el
      }
    }
    ))
  }

  const inputRef = useRef(null);
  console.log("rendering big thing")
  console.log(hoverState)
  
  const highlightDivs = highlights.map((rng) => {
    return (
      <Highlight
        key={rng.id}
        id={rng.id} 
        hover={rng.hover}
        setHover={(hover)=>setHover(rng.id, hover)}
        inputRef={inputRef}
        htmlContext={html}
        />
    )
  })
  
  // This effect only needs to run when this component is first loaded up,
  // all contained event listeners are agnostic to locations of highlights
  useEffect(()=>{
    console.log("Add listeners to input div")
    const input = inputRef.current
    if(input){
      const curHover = new Set();
      function mouseMove(e){
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        elements.forEach((el) => {
          if(el.classList.contains("highlight")){
            curHover.add(el.id)
          }
        })

        // Update current elements and remove ones we left
        hoverState.forEach((el)=>{
          if(curHover.has(el)){
            document.getElementById(el)?.dispatchEvent(new MouseEvent("mousemove", {bubbles: false, clientX: e.clientX, clientY: e.clientY}))
          } else {
            document.getElementById(el)?.dispatchEvent(new MouseEvent("mouseleave", {bubbles: false, clientX: e.clientX, clientY: e.clientY}))
            hoverState.delete(el)
          }
        })

        // Trigger mouseenter events on new hovered elements
        curHover.forEach((el) => {
          if(!hoverState.has(el)){
            document.getElementById(el)?.dispatchEvent(new MouseEvent("mouseenter", {bubbles: false, clientX: e.clientX, clientY: e.clientY}))
            hoverState.add(el)
          }
        })
        curHover.clear();
      }
      function mouseLeave(e) {
        hoverState.forEach((el) => {
          document.getElementById(el)?.dispatchEvent(new MouseEvent("mouseleave", {bubbles: false, clientX: e.clientX, clientY: e.clientY}))
        })
        hoverState.clear()
      }
      input.addEventListener("mousemove", mouseMove)
      input.addEventListener("mouseleave", mouseLeave)
      return () => {
        input.removeEventListener("mousemove", mouseMove)
        input.removeEventListener("mouseleave", mouseLeave)
      }
    }
  }, [])

  function onClick(e) {
    const sel = document.getSelection();
    const range = sel.getRangeAt(0)
    const parent_id = range.commonAncestorContainer.id ? range.commonAncestorContainer.id : range.commonAncestorContainer.parentElement.id
    if(sel && sel.toString().trim().length > 0 && parent_id == "input-div" && !range.collapsed){
      const id = nanoid()
      const markStart = document.createElement("mark")
      markStart.className = "no-copy"
      markStart.id = `${id}-start`
      const markEnd = document.createElement("mark")
      markEnd.className = "no-copy"
      markEnd.id = `${id}-end`
      range.insertNode(markStart)
      range.collapse(false)
      range.insertNode(markEnd)
      setHighlights([...highlights, {id: id, type: "claim", hover: false}])
    }
  }

  const tags = highlights.map((h,i) => {
    return (
      <li style = {{color: h.hover ? "red" : "blue"}}
      onClick = { (e) => {
        setHover(h.id, !h.hover)
      }
      }
      data-ind={i}
      key={h.id}>{h.id}</li>
    )
  })

  return (
    <div className="highlight-app">
      <h1>Highlighter App</h1>
      <div style={{position: "relative"}} ref={inputRef}>
        <div 
          id="input-div" 
          contentEditable={true}
          onInput={(e)=>{setHTML(e.currentTarget.innerHTML)}}
          suppressContentEditableWarning={true}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt 
          ut <mark className="no-copy" id={"a-start"}/> labore et dolore 
          magna aliqua. Ut enim ad minim veniam, <mark className="no-copy" id={"a-end"}/> quis nostrud 
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor 
          in reprehenderit in voluptate velit esse <mark className="no-copy" id={"b-start"}/> cillum dolore eu fugiat nulla pariatur. Excepteur
          sint occaecat cupidatat non proident, sunt in culpa <mark className="no-copy" id={"b-end"}/> qui officia deserunt mollit anim id est laborum
        </div>
        <div id="highlights">
          {highlightDivs}
        </div>
      </div>
      <div className="controls">
        <button onClick={onClick} className="btn"> Add highlight
        </button>
      </div>
      <ul>
        {tags}
      </ul>
    </div>
  );
}

export default App;