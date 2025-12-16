import { useRef, useEffect } from "react";

export default function Highlight(props){
  const id = props.id
  const hover = props.hover
  const setHover = props.setHover
  const inputRef = props.inputRef
  const hlRef = useRef(null)

  console.log(`${id}: ${hover}`)

  function mouseEnter(e){
    console.log("mouse entered" + id)
    setHover(true)
  }
  function mouseMove(e){
    console.log(`mouse moved ${id}`)
  }
  function mouseLeave(e){
    console.log("mouse left" + id)
    setHover(false)
  }

  // Generation and positioning of divs needs to occur within an effect, as
  // we will not know how many divs we need until after the text is rendered
  useEffect(() => {
    if(hlRef && inputRef){
      // Clear out stale divs
      hlRef.current.replaceChildren()

      const range = new Range();
      range.setStartAfter(document.getElementById(`${id}-start`))
      range.setEndBefore(document.getElementById(`${id}-end`))
      const boundRects = range.getClientRects()
      const inputRects = inputRef.current.getBoundingClientRect()
      let ind = 0

      for( const hls of boundRects ) {
        ind += 1
        const hl = document.createElement("div")
        hl.className = id
        hl.classList.add("highlight")
        hl.id = `${id}-${ind}`
        hl.style.position = "absolute"
        hl.style.top = `${hls.top - inputRects.top}px`
        hl.style.left = `${hls.left - inputRects.left}px`
        hl.style.width = `${hls.width}px`
        hl.style.height = `${hls.height}px`
        hl.style.zIndex = "-1"
        hl.style.backgroundColor = hover ? "rgba(78, 117, 129, 0.86)" : "rgba(173, 216, 230, 0.466)"
        hlRef.current.appendChild(hl)
        
        // No cleanup needed since the entire highlight element gets replaced
        // on each re-render
        hl.addEventListener("mouseenter", mouseEnter)
        hl.addEventListener("mousemove", mouseMove)
        hl.addEventListener("mouseleave", mouseLeave)
      }
    }
  })
  return (
      <div id={id} ref={hlRef}>
      </div>
  )
}