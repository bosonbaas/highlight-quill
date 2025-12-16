import { useRef, useEffect, useState } from "react";
import { nanoid } from "nanoid";
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
  useEffect(()=>{
    console.log("rendering")
    const input = inputRef.current
    if(input){
      const hlDivs = input.getElementsByTagName("div")
      while(hlDivs[0]){
        hlDivs[0].remove()
      }
      highlights.forEach((rng, i) => {
        const range = new Range();
        range.setStartAfter(document.getElementById(`${rng.id}-start`))
        range.setEndBefore(document.getElementById(`${rng.id}-end`))
        const boundRects = range.getClientRects()
        const inputRects = input.getBoundingClientRect()
        let ind = 0
        for( const hls of boundRects ) {
          ind += 1
          const hl = document.createElement("div")
          hl.className = rng.id
          hl.classList.add("highlight")
          hl.id = `${rng.id}-${ind}`
          hl.style.position = "absolute"
          console.log(input.style.top)
          hl.style.top = `${hls.top - inputRects.top}px`
          hl.style.left = `${hls.left - inputRects.left}px`
          hl.style.width = `${hls.width}px`
          hl.style.height = `${hls.height}px`
          hl.style.zIndex = "-1"
          hl.style.backgroundColor = rng.hover ? "rgba(78, 117, 129, 0.86)" : "rgba(173, 216, 230, 0.466)"
          input.appendChild(hl)
          // Add event listeners here
          hl.addEventListener("mouseenter", (e) => {
            console.log("mouse entered" + rng.id)
            setHover(rng.id, true)
          })
          hl.addEventListener("mousemove", (e) => {
            console.log(`mouse moved ${rng.id}`)
          })
          hl.addEventListener("mouseleave", (e) => {
            console.log("mouse left" + rng.id)
            setHover(rng.id, false)
          })
        }
      })
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
  }, [highlights, html])

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
      <div 
        id="input-div" 
        style={{position: "relative"}} 
        contentEditable={true}
        ref={inputRef}
        onInput={(e)=>{setHTML(e.currentTarget.innerHTML)}}
        suppressContentEditableWarning={true}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt 
        ut <mark className="no-copy" id={"a-start"}/> labore et dolore 
        magna aliqua. Ut enim ad minim veniam, <mark className="no-copy" id={"a-end"}/> quis nostrud 
        exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor 
        in reprehenderit in voluptate velit esse <mark className="no-copy" id={"b-start"}/> cillum dolore eu fugiat nulla pariatur. Excepteur
         sint occaecat cupidatat non proident, sunt in culpa <mark className="no-copy" id={"b-end"}/> qui officia deserunt mollit anim id est laborum
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