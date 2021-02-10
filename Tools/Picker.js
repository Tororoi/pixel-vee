class Picker {
    constructor(target, width, height) {
      this.target = target;
      this.width = width;
      this.height = height;
      this.target.width = width;
      this.target.height = height;
      //Get context 
      this.context = this.target.getContext("2d");
      //Circle (Color Selector Circle)
      this.pickerCircle = { x: 10, y: 10, width: 7, height: 7 };
  
      draw() {
        //Drawing Here
      }
  }