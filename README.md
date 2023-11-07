# Pixel V

### Drawing application for pixel art

Visit here: https://pixelvee.netlify.app/

## Functions

<table>
  <tr>
    <td colspan="2"> Undo/Redo </td>
  </tr>
  <tr>
    <td colspan="2"> Any action that makes a change to the canvas can be undone. </td>
  </tr>
  <tr>
    <td colspan="2"> Color Picker </td>
  </tr>
  <tr>
    <td colspan="2"> Foreground and background color swatches can be clicked to open a color picker. Color picker uses an HSL gradient selector for intuitive color changing. Ability to adjust individual color channels or type in a hexcode. </td>
  </tr>
  <tr>
    <td colspan="2"> Zoom </td>
  </tr>
  <tr>
    <td colspan="2"> Zoom with buttons or with the mouse's scrollwheel.  </td>
  </tr>
  <tr>
    <td colspan="2"> Recenter </td>
  </tr>
  <tr>
    <td colspan="2"> Sometimes zooming can get out of hand. Press Recenter to bring the canvas back to normal size and starting position. </td>
  </tr>
  <tr>
    <td colspan="2"> Clear </td>
  </tr>
  <tr>
    <td colspan="2"> Clears canvas layer and removes any vectors that were on that layer. </td>
  </tr>
</table>

## Modes

<table>
  <tr>
    <td colspan="2"> Draw (D) </td>
  </tr>
  <tr>
    <td width="66" height="52"> <img src="public/pixelv-pencil.png" alt="Brush" width="40"/> </td>
    <td> Standard drawing mode that puts color to canvas. </td>
  </tr>
  <tr>
    <td colspan="2"> Erase (E) </td>
  </tr>
  <tr>
    <td width="66" height="52"> <img src="public/pixelv-eraser.svg" alt="Brush" width="40"/> </td>
    <td> Chosen as a mode and not a tool in order to allow use with multiple tools (eg. Erase/Fill, Erase/Line). </td>
  </tr>
  <tr>
    <td colspan="2"> Perfect (P) </td>
  </tr>
  <tr>
    <td width="66" height="52"> <img src="public/pixelv-mechanical-pencil.svg" alt="Brush" width="40"/> </td>
    <td> Perfect pixel mode. Currently only works with pencil tool and enables smooth pixel perfect lines, even while drawing slowly. </td>
  </tr>
    <tr>
    <td colspan="2"> Inject (I) </td>
  </tr>
  <tr>
    <td width="66" height="52"> <img src="public/pixelv-inject.svg" alt="Brush" width="40"/> </td>
    <td> Translucent colors will be applied directly instead of placed on top of other colors. </td>
  </tr>
</table>

## Tools
<table>
  <tr>
    <td colspan="2"> Brush (B) </td>
  </tr>
  <tr>
    <td width="66" height="52"> <img src="public/pixelv-brush.svg" alt="Brush" width="40"/> </td>
    <td> Draws a pixel where your pointer goes. </td>
  </tr>
  <tr>
    <td colspan="2"> Color Mask (M) </td>
  </tr>
  <tr>
    <td width="66" height="52" valign="middle"> <img src="public/pixelv-color-mask.svg" alt="Color Mask" width="40"/> </td>
    <td> Drawing will only put color down on top of the selected background color (eg. If the background color swatch is red, it will only draw on top of red pixels). </td>
  </tr>
  <tr>
    <td colspan="2"> Fill (F) </td>
  </tr>
  <tr>
    <td width="66" height="52" valign="middle"> <img src="public/pixelv-fill.svg" alt="Fill" width="40"/> </td>
    <td> Fill in contiguous spaces of color. This tool is a vector type tool so the position and color can be adjusted at any time. Adjusting the position will hide any actions that came after the fill action until you are done making adjustments. </td>
  </tr>
  <tr>
    <td colspan="2"> Line (L or Hold Shift with Brush) </td>
  </tr>
  <tr>
    <td width="66" height="52" valign="middle"> <img src="public/pixelv-line.svg" alt="Line" width="40"/> </td>
    <td> Draw straight, pixel perfect lines. Click and hold to draw lines. </td>
  </tr>
  <tr>
    <td colspan="2"> Quadratic Bezier Curve (C) </td>
  </tr>
  <tr>
    <td width="66" height="52" valign="middle"> <img src="public/pixelv-quadratic-curve.svg" alt="Quadratic Bezier Curve" width="40"/> </td>
    <td> Draws a quadratic bezier curve (3 control points). Click for each control point of the bezier curve, starting with the two endpoints. This tool is a vector type tool so the control points and color can be adjusted at any time. </td>
  </tr>
  <tr>
    <td colspan="2"> Cubic Bezier Curve (J) </td>
  </tr>
  <tr>
    <td width="66" height="52" valign="middle"> <img src="public/pixelv-cubic-curve.svg" alt="Cubic Bezier Curve" width="40"/> </td>
    <td> Draws a cubic bezier curve (4 control points). Click for each control point of the bezier curve, starting with the two endpoints. This tool is a vector type tool so the control points and color can be adjusted at any time. </td>
  </tr>
  <tr>
    <td colspan="2"> Ellipse (O) </td>
  </tr>
  <tr>
    <td width="66" height="52" valign="middle"> <img src="public/pixelv-ellipse.svg" alt="Ellipse" width="40"/> </td>
    <td> Draws an ellipse. Click down to place the center point and then drag to set the first radius. Initially this tool will draw a circle. Afterwards both radii can be adjusted separately to create an ellipse at any angle. By moving the cursor at the subpixel level you can adjust the way the center point behaves. For example, if the center is considered the center of the center pixel, a circle with a radius of 15 pixels will have a diameter of 31 pixels, but if the center is considered the top left corner of the center pixel, that circle will have a diameter of 30 pixels. Both the x and y components of this can be adjusted. This tool is a vector type tool so the control points and color can be adjusted at any time. Hold shift to force a circle. </td>
  </tr>
  <tr>
    <td colspan="2"> Eyedropper (Hold Alt) </td>
  </tr>
  <tr>
    <td width="66" height="52" valign="middle"> <img src="public/pixelv-eyedropper.svg" alt="Eyedropper" width="40"/> </td>
    <td> Select a color that already exists on the canvas. </td>
  </tr>
  <tr>
    <td colspan="2"> Grab (Hold Space) </td>
  </tr>
  <tr>
    <td width="66" height="52" valign="middle"> <img src="public/pixelv-grab.svg" alt="Grab" width="40"/> </td>
    <td> Move the canvas position freely. </td>
  </tr>
    <tr>
    <td colspan="2"> Move </td>
  </tr>
  <tr>
    <td width="66" height="52" valign="middle"> <img src="public/pixelv-move.svg" alt="Grab" width="40"/> </td>
    <td> Move a layer relative to other layers. </td>
  </tr>
</table>

## Top Menu

<table>
  <tr>
    <td colspan="2"> Grid </td>
  </tr>
  <tr>
    <td colspan="2"> Toggle the grid on or off. Only displays at higher zoom levels. </td>
  </tr>
  <tr>
    <td colspan="2"> Tooltips </td>
  </tr>
  <tr>
    <td colspan="2"> Toggle tooltips on or off. Hover to see a tooltip. </td>
  </tr>
  <tr>
    <td colspan="2"> Export </td>
  </tr>
  <tr>
    <td colspan="2"> Download the image as .png. </td>
  </tr>
</table>

## Brush Size

<table>
  <tr>
    <td colspan="2"> Change Brush Type </td>
  </tr>
  <tr>
    <td colspan="2"> Click the brush preview to toggle between circle and square brushes. </td>
  </tr>
  <tr>
    <td colspan="2"> Change Brush Size </td>
  </tr>
  <tr>
    <td colspan="2"> Change brush size by moving the slider between 1 and 32 pixels diameter. </td>
  </tr>
</table>

## Palette

<table>
  <tr>
    <td colspan="2"> Primary/ Secondary Swatches </td>
  </tr>
  <tr>
    <td colspan="2"> Primary and secondary swatch. Click a swatch to open the color picker or press (R) to randomize the primary swatch color. </td>
  </tr>
  <tr>
    <td colspan="2"> Palette Knife (Hold K or click on the selected color)</td>
  </tr>
  <tr>
    <td width="66" height="52"> <img src="public/pixelv-palette-knife.svg" alt="Palette Knife" width="40"/> </td>
    <td> Edit a palette swatch. Click the palette knife then click the color swatch you want to edit to open the color picker. </td>
  </tr>
  <tr>
    <td colspan="2"> Palette Scraper (Hold X)</td>
  </tr>
  <tr>
    <td width="66" height="52" valign="middle"> <img src="public/pixelv-palette-scraper.svg" alt="Palette Scraper" width="40"/> </td>
    <td> Remove a palette swatch. Click the palette scraper then click the color swatch you want to remove from the color palette. </td>
  </tr>
</table>

## Canvas Size

<table>
  <tr>
    <td colspan="2"> Change Canvas Size </td>
  </tr>
  <tr>
    <td colspan="2"> Change canvas dimensions to between 8 and 1024 pixels. </td>
  </tr>
</table>

## Layers

<table>
  <tr>
    <td colspan="2"> Add Raster Layer </td>
  </tr>
  <tr>
    <td width="66" height="52"> <img src="public/pixelv-addlayer.png" alt="Add Raster Layer" width="40"/> </td>
    <td> Add a new layer for drawing. </td>
  </tr>
  <tr>
    <td colspan="2"> Add Reference Layer </td>
  </tr>
  <tr>
    <td width="66" height="52" valign="middle"> <img src="public/pixelv-reference.png" alt="Add Reference Layer" width="40"/> </td>
    <td> Add a new layer to be used for a background reference, such as for tracing. Reference layers cannot be drawn on. </td>
  </tr>
</table>
<table>
  <tr>
    <td colspan="2"> Toggle Layer Visibility </td>
  </tr>
  <tr>
    <td width="66" height="52"> <img src="public/pixelv-eyeopen.png" alt="Toggle Visibility" width="40"/> </td>
    <td> Click the eye icon to hide/show the layer. </td>
  </tr>
  <tr>
    <td colspan="2"> Remove Layer </td>
  </tr>
  <tr>
    <td width="66" height="52"> <img src="public/pixelv-trash.png" alt="Remove Layer" width="40"/> </td>
    <td> Click the trash icon to remove the layer. </td>
  </tr>
  <tr>
    <td colspan="2"> Change Layer Order </td>
  </tr>
  <tr>
    <td colspan="2"> Drag a layer to change its position in the layer stack. </td>
  </tr>
</table>

## Vectors
List of vectors in the order they were drawn, newest at the top. The preview image reflects the vector's placement on the entire canvas area.

<table>
  <tr>
    <td colspan="2"> Select Vector </td>
  </tr>
  <tr>
    <td colspan="2"> Click on a vector to select or deselect it. Selecting a vector changes the active tool to match the vector. </td>
  </tr>
  <tr>
    <td colspan="2"> Change Color </td>
  </tr>
  <tr>
    <td colspan="2"> Click on the color to open the color picker and change the vector's color. </td>
  </tr>
  <tr>
    <td colspan="2"> Remove Vector </td>
  </tr>
  <tr>
    <td width="66" height="52"> <img src="public/pixelv-trash.png" alt="Remove Vector" width="40"/> </td>
    <td> Click the trash icon to remove the vector. </td>
  </tr>
</table>



### Key Features to be added

- Selection Tool
- Dedicated Mobile/ Tablet UI
- Link Tool: Link vectors end to end to make unified adjustable curves. All cubic curve vectors on selected layer will have control points interactable.
- Menu dropdown for functionality that is used less frequently. Windows for canvas size for example do not need to be on screen at all times.

### Stretch Features to be added

- Ability to resize background image
- Dithered Gradient Tool
- Dithered Brush tool
- Custom stamp brush
- Rectangle Tool
- Mask Tool
- 9-Grid Mode: Make repeating patterns for selected tile area. Also offer options for brick repeat and half-drop repeat
- Preview window
- Toggle magnify pointer area for precise placement of pixels: move magnifier on canvas and then work in magnified window to place pixels. Useful for any tools that use subpixels, and for precise placement of vectors.
- Editable properties display for vectors
- Layer Settings: Adjust layer opacity, blend-mode, duplicate layer
- Choose from set of default color palettes
- Perspective Tool: Acts as a custom overlay on the canvas with user defined vanishing points and adjustable lines. 1-point, 2-point, 3-point, multipoint, 4-point curvilinear, 5-point curvilinear, isometric
- Smooth curves mode for brush. When drawing quickly, curves can look choppy and angular. Calculates curvature between points. Bonus: convert entire brush stroke into a series of linked vectors.
- Spritesheet options: custom grid to subdivide canvas
- Animation options: preview spritesheet animation, onion skins as sublayers, preview animation of layers with onion skins individually and simultaneously, set framerate for animation layer, export animation
- Dye Tool: Propogate colors through all animation frames. Adjust color in one frame and color changes in all selected frames.

# Run locally
1. Run `npm install`
2. Start a local server. For example, `php -S localhost:8000` or `serve`
