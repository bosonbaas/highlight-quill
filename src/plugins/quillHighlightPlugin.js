import Quill from 'quill';
import _ from 'underscore';
import { ClassAttributor, Scope } from 'parchment';

class Highlight extends ClassAttributor {
  constructor(attrName = 'highlight', keyName = 'highlight') {
    super(attrName, keyName, { scope: Scope.INLINE_ATTRIBUTE });
  }

  // If the input value is an array, we repace all existing highlight classes
  // otherwise, we append. This is because when this re-hydrates from a delta,
  // it causes highlight classes to leak between subsequent spans. But it will
  // always use arrays in this case (because that is the value we return)
  add(node, value) {
    if (!this.canAdd(node, value)) return false;
    if (Array.isArray(value)) {
      // Remove any existing highlights"
      const newClassList = _.filter(node.classList, (cl) => !cl.startsWith(`${this.keyName}-`))
      node.classList = newClassList
      value.forEach((id) => {
        node.classList.add(`${this.keyName}-${id}`);
      });
      node.classList.add(this.keyName)
    } else {
      node.classList.add(`${this.keyName}-${value}`);
      node.classList.add(this.keyName)
    }
    return true;
  }

  remove(node, id) {
    if (id == null) {
      super.remove(node);
    } else {
      node.classList.remove(`${this.keyName}-${id}`);
      if (node.classList.length === 0) {
        node.removeAttribute('class');
      }
    }
  }

  value(node) {
    const prefix = `${this.keyName}-`;
    const list = _.filter( node.classList, (c) => {
      return c.startsWith(prefix);
    }).map((c) => {
      return c.slice(prefix.length);
    });
    return (list.length > 0) ? list : null;
  }
}

// Color palette for highlights
const colorPalette = [
  'rgba(100, 200, 255, 0.466)',  // blue
  'rgba(255, 150, 100, 0.466)',  // orange
  'rgba(200, 255, 100, 0.466)',  // lime
  'rgba(255, 100, 200, 0.466)',  // pink
  'rgba(255, 200, 100, 0.466)',  // peach
  'rgba(150, 200, 255, 0.466)',  // light blue
  'rgba(200, 100, 255, 0.466)',  // purple
  'rgba(100, 255, 200, 0.466)',  // cyan
];

const hoverColorPalette = [
  'rgba(78, 117, 129, 0.86)',    // dark blue
  'rgba(200, 100, 50, 0.86)',    // dark orange
  'rgba(150, 200, 50, 0.86)',    // dark lime
  'rgba(200, 100, 150, 0.86)',   // dark pink
  'rgba(200, 150, 50, 0.86)',    // dark peach
  'rgba(100, 150, 200, 0.86)',   // dark light blue
  'rgba(150, 100, 200, 0.86)',   // dark purple
  'rgba(100, 200, 150, 0.86)',   // dark cyan
];

function rgba2ob(color){
  const [pr, b, g, pa] = color.split(',')
  const r = pr.split("(")[1]
  const a = pa.split(")")[0]
  return {
    r: Number(r),
    g: Number(g),
    b: Number(b),
    a: Number(a)
  }
}

function ob2rgba(cOb){
  return `rgba(${cOb.r}, ${cOb.g}, ${cOb.b}, ${cOb.a})`
}

// Following https://stackoverflow.com/questions/10781953/determine-rgba-colour-received-by-combining-two-colours
// Porter-Duff method where c1 is rendered in front of c2
function combineColorsPD(c2, c1){
  const ar = c1.a + c2.a * (1 - c1.a)
  if( ar === 0 ){
    return {
      r: 0,
      g: 0,
      b: 0,
      a: 0
    }
  }
  const c3 = {
    r: (c1.r * c1.a + c2.r * c2.a * (1 - c1.a)) / ar,
    g: (c1.g * c1.a + c2.g * c2.a * (1 - c1.a)) / ar,
    b: (c1.b * c1.a + c2.b * c2.a * (1 - c1.a)) / ar,
    a: ar
  }
  return c3
}

// Combining an array of colors passed as strings using Porter-Duff
// The last element of the array is rendered as the front element
function combineColorStringArrayPD(colors){
  return ob2rgba(colors.map(rgba2ob).reduce(combineColorsPD))
}

const highlightColorMap = new Map();
let colorIndex = 0;

function getColorForHighlight(id, hoverState) {
  if (!highlightColorMap.has(id)) {
    highlightColorMap.set(id, {
      normal: colorPalette[colorIndex % colorPalette.length],
      hover: hoverColorPalette[colorIndex % hoverColorPalette.length],
    });
    colorIndex++;
  }
  return hoverState ? highlightColorMap.get(id).hover : highlightColorMap.get(id).normal;
}

export function registerHighlightFormat() {
  try {
    Quill.register({ 'formats/highlight': new Highlight() });
  } catch (e) {
    // Format already registered, this is fine
  }
}

function getHighlights(span){
  return _.filter(span.classList, (hl) => {
    return hl.startsWith("highlight-")
  }).map((hl) => {
    return hl.slice("highlight-".length)
  })
}

export function setupHoverListeners(quill, onHoverChange) {
  const editorElement = quill.root;
  const currentHoveredIds = new Set();

  // Attach mouseenter/mouseleave listeners to each highlight span
  function attachSpanListeners(span) {
    const highlightIds = span.classList;
    highlightIds.forEach((hl) => {
      if(!hl.startsWith("highlight-")){
        return;
      }
      const highlightId = hl.slice("highlight-".length)
      onHoverChange(highlightId, false);
      // Each span is going to potentially get many listeners, as each highlight
      // it is a member of will contribute another listener
      span.addEventListener('mouseenter', (e) => {
        const span = e.target
        const hls = getHighlights(span)
        hls.forEach((highlightId) =>{
          if (!currentHoveredIds.has(highlightId)) {
            currentHoveredIds.add(highlightId);
            onHoverChange(highlightId, true);
          }
        })
      });

      span.addEventListener('mouseleave', (e) => {
        const span = e.target
        const hls = getHighlights(span)
        hls.forEach((highlightId) =>{
        // Check if cursor is still over this highlight or a nested one
          if (!isHighlightStillHovered(highlightId)) {
            currentHoveredIds.delete(highlightId);
            onHoverChange(highlightId, false);
          }
        })
      });
    })
  }

  // Check if any spans of this highlight are curently hovered
  function isHighlightStillHovered(highlightId) {
    const spans = document.querySelectorAll(`.highlight-${highlightId}`);
    for (let span of spans) {
      if (span.matches(':hover')) {
        return true;
      }
    }
    return false;
  }

  // Attach listeners to all existing highlight spans
  editorElement.querySelectorAll('.highlight').forEach(attachSpanListeners);

  // Observe for new highlight spans and attach listeners
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // HTML elements
          if (node.classList.contains('highlight')) {
            attachSpanListeners(node);
          }
          node.querySelectorAll?.('.highlight').forEach(attachSpanListeners);
        }
      });
    });
  });

  observer.observe(editorElement, {
    childList: true,
    subtree: true,
  });
}


function getColorForHighlights(highlights, hoveredState) {
  const colors = _.filter(highlights, (hl) => hl.startsWith("highlight-"))
    .map((hl) => hl.slice("highlight-".length))
    .map((hl) => getColorForHighlight(hl, hoveredState[hl]))
  return combineColorStringArrayPD(colors)
}

function updateHighlightVisuals(id, hoveredState) {
  // Find all spans with this highlight ID
  const allHighlightSpans = document.querySelectorAll(`.highlight-${id}`);
  allHighlightSpans.forEach((el) => {
    const color = getColorForHighlights(el.classList, hoveredState);
    el.style.backgroundColor = color;
  });
}

export function updateHoverFromState(highlightId, hoveredState) {
  // Called when state changes externally (e.g., from button clicks)
  // Syncs the visual state and manages the hover set
  updateHighlightVisuals(highlightId, hoveredState);
}