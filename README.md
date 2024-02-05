# Pixel V

## Drawing application for pixel art

Visit here: https://pixelvee.netlify.app/

## Concept

The goal of this drawing app is to combine a vector art workflow with a typical raster art workflow. This app especially makes drawing pixellated curves and ellipses very easy. Lines made with vector tools can also be modified at any time, even on the same layer as rasterized pixels. The aim is to make a faster, smoother workflow for pixel artists.

This app is a work in progress. See the bottom of this page for features that are planned to be added in the future.

## Functions

<table>
  <tr>
    <td colspan="2"> Undo/Redo </td>
  </tr>
  <tr>
    <td width="66" height="52"> <img src="public/pixelv-undo.svg" alt="Undo" width="40"/><img src="public/pixelv-redo.svg" alt="Redo" width="40"/> </td>
    <td> Any action that makes a change to the canvas can be undone. </td>
  </tr>
  <tr>
    <td colspan="2"> Color Picker </td>
  </tr>
  <tr>
    <td width="66" height="52"> <img src="public/pixelv-swatches.svg" alt="Swatches" width="40"/> </td>
    <td> Foreground and background color swatches can be clicked to open a color picker. Color picker uses an HSL gradient selector for intuitive color changing. Ability to adjust individual color channels or type in a hexcode. </td>
  </tr>
  <tr>
    <td colspan="2"> Zoom </td>
  </tr>
  <tr>
    <td width="66" height="52"> <img src="public/pixelv-plus.svg" alt="Plus" width="20" hspace="10"/> <img src="public/pixelv-minus.svg" alt="Minus" width="20" hspace="10" /> </td>
    <td> Zoom with buttons or with the mouse's scrollwheel.  </td>
  </tr>
  <tr>
    <td colspan="2"> Recenter </td>
  </tr>
  <tr>
    <td width="66" height="52"> <img src="public/pixelv-recenter.svg" alt="Recenter" width="40"/> </td>
    <td colspan="2"> Sometimes zooming can get out of hand. Press Recenter to bring the canvas back to normal size and starting position. </td>
  </tr>
  <tr>
    <td colspan="2"> Clear </td>
  </tr>
  <tr>
    <td width="66" height="52"> <img src="public/pixelv-clear.svg" alt="Clear" width="40"/> </td>
    <td> Clears canvas layer and removes any vectors that were on that layer. </td>
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
    <td colspan="2"> Fill (F) </td>
  </tr>
  <tr>
    <td width="66" height="52" valign="middle"> <img src="public/pixelv-fill.svg" alt="Fill" width="40"/> </td>
    <td> Fill in contiguous spaces of color. This tool is a vector type tool so the position and color can be adjusted at any time. Adjusting the position will hide any actions that came after the fill action until you are done making adjustments. </td>
  </tr>
  <tr>
    <td colspan="2"> Line (/ or Hold Shift with Brush) </td>
  </tr>
  <tr>
    <td width="66" height="52" valign="middle"> <img src="public/pixelv-line.svg" alt="Line" width="40"/> </td>
    <td> Draw straight, pixel perfect lines. Click and hold to draw lines. </td>
  </tr>
  <tr>
    <td colspan="2"> Quadratic Bezier Curve (Q) </td>
  </tr>
  <tr>
    <td width="66" height="52" valign="middle"> <img src="public/pixelv-quadratic-curve.svg" alt="Quadratic Bezier Curve" width="40"/> </td>
    <td> Draws a quadratic bezier curve (3 control points). Click for each control point of the bezier curve, starting with the two endpoints. This tool is a vector type tool so the control points and color can be adjusted at any time. </td>
  </tr>
  <tr>
    <td colspan="2"> Cubic Bezier Curve (C) </td>
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

## Brush

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

## Brush Modes

<table>
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
    <tr>
    <td colspan="2"> Color Mask (M) </td>
  </tr>
  <tr>
    <td width="66" height="52" valign="middle"> <img src="public/pixelv-color-mask.svg" alt="Color Mask" width="40"/> </td>
    <td> Drawing will only put color down on top of the selected background color (eg. If the background color swatch is red, it will only draw on top of red pixels). </td>
  </tr>
</table>

## Palette

<table>
  <tr>
    <td colspan="2"> Primary/ Secondary Swatches </td>
  </tr>
  <tr>
    <td width="66" height="52"> <img src="public/pixelv-swatches.svg" alt="Swatches" width="40"/> </td>
    <td > Primary and secondary swatch. Click a swatch to open the color picker or press (R) to randomize the primary swatch color. </td>
  </tr>
  <tr>
    <td colspan="2"> Switch Primary/ Secondary Swatches </td>
  </tr>
  <tr>
    <td width="66" height="52"> <img src="public/pixelv-switch.svg" alt="Color Switch" width="40"/> </td>
    <td > Click to switch primary and secondary swatch colors. </td>
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
  <tr>
    <td colspan="2"> Add Color to Palette</td>
  </tr>
  <tr>
    <td width="66" height="52"> <img src="public/pixelv-plus.svg" alt="Plus" width="20" hspace="10"/> </td>
    <td> Click to open the color picker and add the selected color to the palette.  </td>
  </tr>
</table>

## Layers

<table>
  <tr>
    <td colspan="2"> Add Raster Layer </td>
  </tr>
  <tr>
    <td width="66" height="52"> <img src="public/pixelv-addlayer.svg" alt="Add Raster Layer" width="40"/> </td>
    <td> Add a new layer for drawing. </td>
  </tr>
  <tr>
    <td colspan="2"> Add Reference Layer </td>
  </tr>
  <tr>
    <td width="66" height="52" valign="middle"> <img src="public/pixelv-reference.svg" alt="Add Reference Layer" width="40"/> </td>
    <td> Add a new layer to be used for a background reference, such as for tracing. Reference layers cannot be drawn on. </td>
  </tr>
  <tr>
    <td colspan="2"> Remove Layer </td>
  </tr>
  <tr>
    <td width="66" height="52"> <img src="public/pixelv-trash.svg" alt="Remove Layer" width="40"/> </td>
    <td> Click the trash icon to remove the selected layer. </td>
  </tr>
</table>
<table>
  <tr>
    <td colspan="2"> Toggle Layer Visibility </td>
  </tr>
  <tr>
    <td width="66" height="52"> <img src="public/pixelv-eyeopen.svg" alt="Toggle Visibility" width="40"/> </td>
    <td> Click the eye icon to hide/show the layer. </td>
  </tr>
  <tr>
    <td colspan="2"> Layer Settings </td>
  </tr>
  <tr>
    <td width="66" height="52"> <img src="public/pixelv-gear.svg" alt="Open Layer Settings" width="40"/> </td>
    <td> Click the gear icon to open layer settings. The layer's name and opacity can be changed in the layer settings. </td>
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
    <td colspan="2"> Toggle Vector Visibility </td>
  </tr>
  <tr>
    <td width="66" height="52"> <img src="public/pixelv-eyeopen.svg" alt="Toggle Visibility" width="40"/> </td>
    <td> Click the eye icon to hide/show the vector. </td>
  </tr>
  <tr>
    <td colspan="2"> Remove Vector </td>
  </tr>
  <tr>
    <td width="66" height="52"> <img src="public/pixelv-trash.svg" alt="Remove Vector" width="40"/> </td>
    <td> Click the trash icon to remove the vector. </td>
  </tr>
</table>

## File Menu

<table>
  <tr>
    <td colspan="2"> Open </td>
  </tr>
  <tr>
    <td colspan="2"> Open saved drawing from your desktop. </td>
  </tr>
  <tr>
    <td colspan="2"> Save As... </td>
  </tr>
  <tr>
    <td colspan="2"> Open dialog box to download file with current drawing progress. </td>
  </tr>
  <tr>
    <td colspan="2"> Export </td>
  </tr>
  <tr>
    <td colspan="2"> Download the image as .png. </td>
  </tr>
</table>

## Edit Menu

<table>
  <tr>
    <td colspan="2"> Resize Canvas... </td>
  </tr>
  <tr>
    <td colspan="2"> Open a dialog box to change the canvas dimensions. Canvas dimensions are limited to between 8 and 1024 pixels. </td>
  </tr>
  <tr>
    <td colspan="2"> Select All (Cmd + A) </td>
  </tr>
  <tr>
    <td colspan="2"> Select entire canvas area. </td>
  </tr>
  <tr>
    <td colspan="2"> Deselect (Cmd + D) </td>
  </tr>
  <tr>
    <td colspan="2"> Deselect selection area. </td>
  </tr>
  <tr>
    <td colspan="2"> Invert Selection (Cmd + I) </td>
  </tr>
  <tr>
    <td colspan="2"> Invert selection area. </td>
  </tr>
  <tr>
    <td colspan="2"> Cut (Cmd + X) </td>
  </tr>
  <tr>
    <td colspan="2"> Cut selection. </td>
  </tr>
  <tr>
    <td colspan="2"> Copy (Cmd + C) </td>
  </tr>
  <tr>
    <td colspan="2"> Copy selection. </td>
  </tr>
    <tr>
    <td colspan="2"> Paste (Cmd + V) </td>
  </tr>
  <tr>
    <td colspan="2"> Paste copied selection. </td>
  </tr>
</table>

## <img src="public/pixelv-gear.svg" alt="Settings" width="40" height="40"/>

<table>
  <tr>
    <td colspan="2"> Tooltips </td>
  </tr>
  <tr>
    <td colspan="2"> Toggle tooltips on or off. Hover to see a tooltip. </td>
  </tr>
  <tr>
    <td colspan="2"> Grid </td>
  </tr>
  <tr>
    <td colspan="2"> Toggle the grid on or off. Only displays at higher zoom levels. </td>
  </tr>
  <tr>
    <td colspan="2"> Subgrid Spacing </td>
  </tr>
  <tr>
    <td colspan="2"> Define the number of pixels between the subgrid overlaid onto the main grid. At a value of 1 no subgrid will be rendered. </td>
  </tr>
</table>

### Key Features to be added

- Dedicated Mobile/ Tablet UI

### Stretch Features to be added

- Ability to rasterize vectors and remove them from the vectors interface
- Dithered Gradient Tool
- Dithered Brush tool
- Custom stamp brush
- Rectangle Tool
- Mask Tool
- 9-Grid Mode: Make repeating patterns for selected tile area. Also offer options for brick repeat and half-drop repeat
- Preview window
- Toggle magnify pointer area for precise placement of pixels: move magnifier on canvas and then work in magnified window to place pixels. Useful for any tools that use subpixels, and for precise placement of vectors.
- Editable properties display for vectors
- Layer Settings: Blend-mode, duplicate layer
- Choose from set of default color palettes
- Ability to add colors to palette without closing the color picker
- Color ramps in color picker, along with ability to add an entire color ramp to the palette
- Optional palette mode with a small canvas for making a palette with a brush, eraser and eyedropper tools instead of the typical way of modifying a palette.
- Perspective Tool: Acts as a custom overlay on the canvas with user defined vanishing points and adjustable lines. 1-point, 2-point, 3-point, multipoint, 4-point curvilinear, 5-point curvilinear, isometric
- Smooth curves mode for brush. When drawing quickly, curves can look choppy and angular. Calculates curvature between points. Bonus: convert entire brush stroke into a series of linked vectors.
- Spritesheet options: custom grid to subdivide canvas
- Animation options: preview spritesheet animation, onion skins as sublayers, preview animation of layers with onion skins individually and simultaneously, set framerate for animation layer, export animation

# Run locally
1. Run `npm install`
2. Start a local server. For example, `php -S localhost:8000` or `serve`
