//Tool Library

//tool objects
const tools = {
    pencil: {
        name: "pencil",
        fn: drawSteps,
        brushSize: 1,
        options: ["perfect"]
    },
    replace: {
        name: "replace",
        fn: replaceSteps,
        brushSize: 1,
        options: ["perfect"]
    },
    line: {
        name: "line",
        fn: lineSteps,
        brushSize: 1,
        options: []
    },
    fill: {
        name: "fill",
        fn: fillSteps,
        brushSize: 1,
        options: ["contiguous"]
    },
    picker: {
        name: "picker",
        fn: pickerSteps,
        brushSize: 1,
        options: []
    },
    grab: {
        name: "grab",
        fn: grabSteps,
        brushSize: 1,
        options: []
    }
}