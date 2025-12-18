import Quill from 'quill';
import { InlineBlot, ParentBlot, Scope } from 'parchment';

const Inline = Quill.import('blots/inline');

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

const highlightColorMap = new Map();
let colorIndex = 0;

function getColorForHighlight(id) {
  if (!highlightColorMap.has(id)) {
    highlightColorMap.set(id, {
      normal: colorPalette[colorIndex % colorPalette.length],
      hover: hoverColorPalette[colorIndex % hoverColorPalette.length],
    });
    colorIndex++;
  }
  return highlightColorMap.get(id);
}

// Custom highlight format - each span represents a single highlight
class HighlightFormat extends Inline {
  static blotName = 'highlight';
  static tagName = 'span';
  
  static create(value) {
    //this.blotName = `highlight-${value}`
    const domNode = super.create();
    
    // Value is a single highlight ID
    domNode.setAttribute('data-highlight-id', value);
    
    const colors = getColorForHighlight(value);
    domNode.style.backgroundColor = colors.normal;
    domNode.style.mixBlendMode = 'multiply';
    domNode.style.cursor = 'pointer';
    domNode.style.padding = '2px 0';
    domNode.style.borderRadius = '2px';
    domNode.style.transition = 'background-color 0.2s ease';
    
    return domNode;
  }

  // Override formatAt to support overlapping highlights with different IDs.
  // Parchment's InlineBlot prevents overlapping inline formats of the same type
  // with different values. We bypass InlineBlot's logic by delegating to ParentBlot
  // when applying a different highlight ID to facilitate overlap
  formatAt(index, length, name, value) {
    if (
      value &&
      name === "highlight" &&
      this.domNode.getAttribute("data-highlight-id") !== value
    ) {
      // Different highlight ID: skip InlineBlot's restrictive logic
      ParentBlot.prototype.formatAt.call(this, index, length, name, value);
    } else {
      // Same or no highlight: use normal InlineBlot behavior
      super.formatAt(index, length, name, value);
    }
  }

  static formats(domNode) {
    return domNode.getAttribute('data-highlight-id');
  }
}

export function registerHighlightFormat() {
  try {
    Quill.register(HighlightFormat);
  } catch (e) {
    // Format already registered, this is fine
  }
}

export function setupHoverListeners(quill, onHoverChange) {
  const editorElement = quill.root;
  const currentHoveredIds = new Set();

  // Attach mouseenter/mouseleave listeners to each highlight span
  function attachSpanListeners(span) {
    const highlightId = span.getAttribute('data-highlight-id');

    span.addEventListener('mouseenter', () => {
      if (!currentHoveredIds.has(highlightId)) {
        currentHoveredIds.add(highlightId);
        updateHighlightVisuals(highlightId, true);
        if (onHoverChange) {
          onHoverChange(highlightId, true);
        }
      }
    });

    span.addEventListener('mouseleave', () => {
      // Check if cursor is still over this highlight or a nested one
      if (!isHighlightStillHovered(highlightId)) {
        currentHoveredIds.delete(highlightId);
        updateHighlightVisuals(highlightId, false);
        if (onHoverChange) {
          onHoverChange(highlightId, false);
        }
      }
    });
  }

  // Check if a highlight is still being hovered (including nested highlights)
  function isHighlightStillHovered(highlightId) {
    const spans = document.querySelectorAll(`span[data-highlight-id="${highlightId}"]`);
    for (let span of spans) {
      if (span.matches(':hover')) {
        return true;
      }
    }
    return false;
  }

  // Attach listeners to all existing highlight spans
  editorElement.querySelectorAll('span[data-highlight-id]').forEach(attachSpanListeners);

  // Observe for new highlight spans and attach listeners
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          if (node.hasAttribute('data-highlight-id')) {
            attachSpanListeners(node);
          }
          node.querySelectorAll?.('span[data-highlight-id]').forEach(attachSpanListeners);
        }
      });
    });
  });

  observer.observe(editorElement, {
    childList: true,
    subtree: true,
  });
}

function updateHighlightVisuals(id, isHovered) {
  // Find all spans with this highlight ID
  const allHighlightSpans = document.querySelectorAll(`span[data-highlight-id="${id}"]`);
  allHighlightSpans.forEach((el) => {
    const colors = getColorForHighlight(id);
    el.style.backgroundColor = isHovered ? colors.hover : colors.normal;
  });
}

export function updateHoverFromState(highlightId, isHovered) {
  // Called when state changes externally (e.g., from button clicks)
  // Syncs the visual state and manages the hover set
  updateHighlightVisuals(highlightId, isHovered);
}

export class HighlightStateManager {
  constructor() {
    this.listeners = [];
    this.hoverState = new Map();
    this.onHoverChange = null;
    this.onHighlightAdded = null;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notifyHoverChange(id, hover) {
    this.hoverState.set(id, hover);
    this.listeners.forEach((listener) => listener({ type: 'hover', id, hover }));
  }

  notifyHighlightAdded(highlight) {
    this.listeners.forEach((listener) => listener({ type: 'added', highlight }));
  }

  getHover(id) {
    return this.hoverState.get(id) || false;
  }
}
