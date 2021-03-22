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
> Clears canvas

## Modes

> #### Draw
>
> Standard drawing mode that puts color to canvas.

> #### Erase
>
> Chosen as a mode and not a tool in order to allow use with multiple tools (eg. Erase/Fill, Erase/Line).

> #### Perfect
>
> Perfect pixel mode. Currently only works with pencil tool and enables smooth pixel perfect lines, even while drawing slowly.

## Tools

> #### Pencil
>
> Draws a pixel where your mouse goes.

> #### Replace
>
> Drawing will only put color down on top of the selected background color (eg. If the background color swatch is red, it will only draw on top of red pixels).

> #### Line
>
> Draw straight, pixel perfect lines. Click and hold to draw lines.

> #### Fill
>
> Fill in contiguous spaces of color.

> #### Curve
>
> Draws a quadratic bezier curve (3 control points). Click for each control point of the bezier curve. Control points currently cannot be altered after clicking.

> #### Picker
>
> Select a color that already exists on the canvas.

> #### Grab
>
> Move the canvas position freely.

### Key Features to be added

- Vector mode
- Layers
- Palette
- Ability to export image
- Ability to change brush size
- Alpha channel for colors
- Selection Tool

### Stretch Features to be added

- Ability to import a custom background image
- Dithered Gradient Tool
- Ability to toggle gridlines
- Increase functionality of curve tool to include more points
- Shapes Tool
- 9-Grid Mode
- Preview window
- Shading Tool

### UI Fixes Scheduled

- Zoom feature with scroll wheel should stay centered around mouse
- Make color picker window draggable
- Change tool buttons to icons
