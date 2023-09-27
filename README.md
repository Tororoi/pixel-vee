# Pixel V

### Drawing application for pixel art

Visit here: https://pixelvee.netlify.app/

## Functions

> #### Undo/Redo
>
> Any action that makes a change to the canvas can be undone.

> #### Color Picker
>
> Foreground and background color swatches can be clicked to open a color picker.
> Color picker uses an HSL gradient selector for intuitive color changing.
> Ability to adjust individual color channels or type in a hexcode.

> #### Zoom and Recenter
>
> Zoom with buttons or with the mouse's scrollwheel.
> Sometimes zooming can get out of hand. Press Recenter to bring the canvas back to normal size and starting position.

> #### Clear
>
> Clears canvas layer

## Modes

> #### Draw (D)
>
> Standard drawing mode that puts color to canvas.

> #### Erase (E)
>
> Chosen as a mode and not a tool in order to allow use with multiple tools (eg. Erase/Fill, Erase/Line).

> #### Perfect (P)
>
> Perfect pixel mode. Currently only works with pencil tool and enables smooth pixel perfect lines, even while drawing slowly.

## Tools

> #### Brush (B)
>
> Draws a pixel where your pointer goes.

> #### Replace (R)
>
> Drawing will only put color down on top of the selected background color (eg. If the background color swatch is red, it will only draw on top of red pixels).

> #### Fill (F)
>
> Fill in contiguous spaces of color. This tool is a vector type tool so the position and color can be adjusted at any time. Adjusting the position will hide any actions that came after the fill action until you are done making adjustments.

> #### Line (L or Hold Shift with Brush)
>
> Draw straight, pixel perfect lines. Click and hold to draw lines.

> #### Quadratic Bezier Curve (C)
>
> Draws a quadratic bezier curve (3 control points). Click for each control point of the bezier curve, starting with the two endpoints. This tool is a vector type tool so the control points and color can be adjusted at any time.

> #### Cubic Bezier Curve (J)
>
> Draws a cubic bezier curve (4 control points). Click for each control point of the bezier curve, starting with the two endpoints. This tool is a vector type tool so the control points and color can be adjusted at any time.

> #### Ellipse (O)
>
> Draws an ellipse. Click down to place the center point and then drag to set the first radius. Initially this tool will draw a circle. Afterwards both radii can be adjusted separately to create an ellipse at any angle. By moving the cursor at the subpixel level you can adjust the way the center point behaves. For example, if the center is considered the center of the center pixel, a circle with a radius of 15 pixels will have a diameter of 31 pixels, but if the center is considered the top left corner of the center pixel, that circle will have a diameter of 30 pixels. Both the x and y components of this can be adjusted. This tool is a vector type tool so the control points and color can be adjusted at any time. Hold shift to force a circle.

> #### Eyedropper (Hold Alt)
>
> Select a color that already exists on the canvas.

> #### Grab (Hold Space)
>
> Move the canvas position freely.

## Top Menu

> #### Grid
>
> Toggle the grid on or off. Only displays at higher zoom levels.

> #### Tooltips
>
> Toggle tooltips on or off. Hover to see a tooltip.

> #### Export
>
> Download the image as .png

## Brush Size

> #### Change Brush Type
>
> Click the brush preview to toggle between circle and square brushes.

> #### Change Brush Size
>
> Change brush size by moving the slider between 1 and 32 pixels diameter

## Canvas Size

> #### Change Canvas Size
>
> Change canvas dimensions to between 8 and 1024 pixels.

## Layers

> #### Add Raster Layer
> ![image](public/pixelv-addlayer.png)
> Add a new layer for drawing

> #### Add Reference Layer
>
> Add a new layer to be used for a background reference, such as for tracing. Reference layers cannot be drawn on.

> #### Toggle Visibility
>
> Click the eye icon to hide/show the layer

> #### Remove Layer
>
> Click the trash icon to remove the layer.

> #### Change Layer Order
>
> Drag a layer to change its position in the layer stack.

## Vectors
List of vectors in the order they were drawn, newest at the top. The preview image reflects the vector's placement on the entire canvas area.

> #### Select Vector
>
> Click on a vector to select or deselect it. Selecting a vector changes the active tool to match the vector.

> #### Change Color
>
> Click on the color to open the color picker and change the vector's color.

> #### Remove Vector
>
> Click the trash icon to remove the vector.



### Key Features to be added

- Palette
- Alpha channel for colors
- Selection Tool

### Stretch Features to be added

- Ability to import a custom background image (_in progress_)
- Dithered Gradient Tool
- Shapes Tool
- 9-Grid Mode
- Preview window
- Shading Tool
- Perspective Tool (Add vanishing points off the canvas)

# Run locally
1. Run `npm install`
2. Start a local server. For example, `php -S localhost:8000` or `serve`
