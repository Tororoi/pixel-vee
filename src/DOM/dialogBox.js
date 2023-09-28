/**
 * Create a draggable, collapsible dialog box
 * @param {string} className
 * @param {string} titleText
 * @param {string} innerHTML
 */
const createDialogBox = (className, titleText, innerHTML) => {
  const fullPage = document.querySelector(".page")

  //create draggable box
  const box = document.createElement("div")
  box.className = `draggable ${className}`
  //create interactive header
  const header = document.createElement("div")
  header.className = "header dragger"

  const dragBtn = document.createElement("div")
  dragBtn.className = "drag-btn"
  header.appendChild(dragBtn)

  const title = document.createElement("span")
  title.innerText = titleText
  header.appendChild(title)

  const collapseBtn = document.createElement("label")
  collapseBtn.className = "collapse-btn"
  collapseBtn.dataset.tooltip = "Collapse/ Expand"
  const checkBox = document.createElement("input")
  checkBox.type = "checkbox"
  checkBox.ariaLabel = "Collapse or Expand"
  checkBox.className = "collapse-checkbox"
  collapseBtn.appendChild(checkBox)
  const arrow = document.createElement("span")
  arrow.className = "arrow"
  collapseBtn.appendChild(arrow)
  header.appendChild(collapseBtn)

  box.appendChild(header)

  //add box's content
  const collapsible = document.createElement("div")
  collapsible.className = "collapsible"
  collapsible.innerHTML = innerHTML

  fullPage.appendChild(box)
}

const createLayersBox = () => {
  const innerHTML = `
          <div class="layers-control">
            <div class="new-raster-layer btn" data-tooltip="New Layer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -0.5 14 14"
                shape-rendering="crispEdges"
              >
                <path
                  stroke="#000000"
                  d="M4 1h8M4 2h1M11 2h1M2 3h8M11 3h1M2 4h1M9 4h1M11 4h1M2 5h1M9 5h1M11 5h1M2 6h1M9 6h1M11 6h1M2 7h1M9 7h1M11 7h1M2 8h1M9 8h1M11 8h1M2 9h1M9 9h1M11 9h1M2 10h1M9 10h3M2 11h1M9 11h1M2 12h8"
                />
                <path
                  stroke="#ffffff"
                  d="M5 2h6M10 3h1M3 4h6M10 4h1M3 5h6M10 5h1M3 6h6M10 6h1M3 7h6M10 7h1M3 8h6M10 8h1M3 9h6M10 9h1M3 10h6M3 11h6"
                />
              </svg>
            </div>
            <label
              for="file-upload"
              class="custom-file-upload btn"
              data-tooltip="New Reference"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -0.5 14 14"
                shape-rendering="crispEdges"
              >
                <path
                  stroke="#000000"
                  d="M2 1h10M1 2h1M12 2h1M1 3h1M12 3h1M1 4h1M12 4h1M1 5h1M12 5h1M1 6h1M12 6h1M1 7h1M12 7h1M1 8h1M12 8h1M1 9h1M12 9h1M1 10h1M12 10h1M1 11h1M12 11h1M2 12h10"
                />
                <path
                  stroke="#acacac"
                  d="M2 2h10M2 3h2M6 3h6M2 4h1M7 4h5M2 5h1M7 5h5M2 6h2M6 6h6M2 7h5M11 7h1M2 8h4M2 9h1"
                />
                <path stroke="#ffffff" d="M4 3h2M3 4h4M3 5h4M4 6h2" />
                <path stroke="#575757" d="M7 7h4M6 8h6M3 9h9M2 10h10M2 11h10" />
              </svg>
            </label>
            <input type="file" id="file-upload" />
          </div>
          <div class="layers-container">
            <div class="layers"></div>
          </div>`
  createDialogBox("layers-interface", "Layers", innerHTML)
}

const createBrushBox = () => {
  const innerHTML = `
          <label for="brush-size" class="brush-size"
            >Line Weight: <span id="line-weight">1</span>px
          </label>
          <div class="brush-preview btn" data-tooltip="Click to switch brush">
            <div id="brush-preview">
              <svg
                class="brush"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -0.5 1 1"
                shape-rendering="crispEdges"
              >
                <path
                  stroke="rgba(255,255,255,255)"
                  d="M0 0h1M0 0h1M0 0h1M0 0h1"
                ></path>
              </svg>
            </div>
          </div>
          <input
            type="range"
            min="1"
            max="32"
            value="1"
            class="slider btn"
            id="brush-size"
            data-tooltip="Adjust brush size"
          />`
  createDialogBox("brush-container", "Brush", innerHTML)
}

export const initializeAllDialogBoxes = () => {
  createLayersBox()
  createBrushBox()
}
