import { fabric } from 'fabric';
import CanvasHistory from '../../assets/js/canvasHistory'
import Text from '../../assets/js/text';
import CropImage from '../../assets/js/crop';
let history = [];
let objects = [];
let customParams = {};
let state = {
  color: "#000",
  fontSize: 32,
  strokeWidth: 7,
  currentTool: null
};
let canvas;
export const getCurrentColor = () => {
  return state.color;
}
export const canvasInit = (c) => {
  canvas = new fabric.Canvas(c);
  canvas.backgroundColor = '#fff';
  new CanvasHistory(canvas);
  return canvas;
}
export const changeColor = (colorProperty) => {
  state.color = colorProperty;
  set(state.currentTool)
}
export const drag = () => {
  canvas.isDrawingMode = false;
  canvas.forEachObject(object => {
    object.selectable = true;
    object.evented = true;
  });
  new Text(canvas, false);
  new CropImage(canvas, false, false, true)
}
export const set = (type, params) => {
  drag();
  state.currentTool = type;
  switch (type) {
    case "text":
      customParams = {
        fill: (params && params.fill) ? params.fill : state.color,
        fontFamily: (params && params.fontFamily) ? params.fontFamily : 'Arial',
        fontSize: (params && params.fontSize) ? params.fontSize : state.fontSize,
        placeholder: (params && params.placeholder) ? params.placeholder : 'Add Text',
      };
      new Text(canvas, true, customParams);
      break;
    case 'selectMode':
      drag();
    case 'freeDrawing':
      customParams = {
        stroke: (params && params.stroke) ? params.stroke : state.color,
        strokeWidth: (params && params.strokeWidth) ? params.strokeWidth : state.strokeWidth,
        drawingMode: (params && params.drawingMode) ? params.drawingMode : true,
      };
      canvas.isDrawingMode = customParams.drawingMode;
      canvas.freeDrawingBrush.color = customParams.stroke;
      canvas.freeDrawingBrush.width = customParams.strokeWidth;
      canvas.freeDrawingBrush.shadow = new fabric.Shadow({
        blur: 0,
        affectStroke: true,
        color: customParams.stroke,
      });
      canvas.on("object:added", function () {
        if (canvas.isDrawingMode) {
          new CanvasHistory(canvas)
        }
      })
      canvas.renderAll();
      break;
    case 'crop':
      customParams = {
        width: (params && params.width) ? params.width : 200,
        height: (params && params.height) ? params.height : 200,
        overlayColor: (params && params.overlayColor) ? params.overlayColor : "#000",
        overlayOpacity: (params && params.overlayOpacity) ? params.overlayOpacity : 0.7,
        transparentCorner: (params && params.transparentCorner) ? params.transparentCorner : false,
        hasRotatingPoint: (params && params.hasRotatingPoint) ? params.hasRotatingPoint : false,
        hasControls: (params && params.hasControls) ? params.hasControls : true,
        cornerSize: (params && params.cornerSize) ? params.cornerSize : 10,
        borderColor: (params && params.borderColor) ? params.borderColor : "#000",
        cornerColor: (params && params.cornerColor) ? params.cornerColor : "#000",
        cornerStyle: (params && params.cornerStyle) ? params.cornerStyle : "circle",
      };
      state.currentTool = 'selectMode';
      new CropImage(canvas,true,false,false,customParams);
  
      break;
    default:
  }
}
export const applyCropping = () => {
  
  new CropImage(canvas, true, true);
  drag()
}
export const cancelCropping = () => {
  
  new CropImage(canvas, false,false,true);
  drag()
}
export const redo = () => {
  drag();
  if (objects.length > 0) {
    if (objects[objects.length - 1] && objects[objects.length - 1].croppedImage) {
      JSON.parse(JSON.stringify(objects[objects.length - 1]))
      canvas.loadFromJSON(objects[objects.length - 1].json)
      setBackgroundImage(objects[objects.length - 1].croppedImage);
      new CanvasHistory(false, false, objects.pop())
    } else {
      canvas.loadFromJSON(objects[objects.length - 1])
      new CanvasHistory(false, false, objects.pop())
    }
  }
}
export const undo = () => {
  if (canvas.getActiveObject()) {
    canvas.discardActiveObject().renderAll()
  }
  drag();
  history = new CanvasHistory();
  if (history.length) {
    objects.push(history.pop())
    if (history[history.length - 1] && history[history.length - 1].croppedImage) {

      JSON.parse(JSON.stringify(history[history.length - 1]))
      canvas.loadFromJSON(history[history.length - 1].json)
      setBackgroundImage(history[history.length - 1].croppedImage)
    }
    else {
      canvas.loadFromJSON(history[history.length - 1])
      canvas.renderAll();
    }
  }
}
export const toDataUrl = (url, callback) => {
  var xhr = new XMLHttpRequest();
  xhr.onload = function () {
    var reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result);
    }
    reader.readAsDataURL(xhr.response);
  };
  xhr.open('GET', url);
  xhr.responseType = 'blob';
  xhr.send();
}
export const setBackgroundImage = (imageUrl) => {
  let imgObj = new Image();
    imgObj.src = imageUrl;
    imgObj.onload = function () {
      let image = new fabric.Image(imgObj);
      if (canvas.width <= image.width || canvas.height <= image.height) {
        let canvasAspect = canvas.width / canvas.height;
        let imgAspect = image.width / image.height;
        let top, left, scaleFactor;
        if (canvasAspect >= imgAspect) {
          scaleFactor = canvas.height / image.height
          top = 0;
          left = -((image.width * scaleFactor) - canvas.width) / 2;
        } else {
          scaleFactor = canvas.width / image.width;
          left = 0;
          top = -((image.height * scaleFactor) - canvas.height) / 2;
        }
        canvas.clear()
        canvas.setBackgroundImage(image, canvas.renderAll.bind(canvas), {
          top: top,
          left: left,
          scaleX: scaleFactor,
          scaleY: scaleFactor
        });
        let croppedImage = { json: canvas.toJSON(), croppedImage: canvas.toDataURL() };
        new CanvasHistory(canvas, croppedImage)
        canvas.renderAll();
      } else {
        let center = canvas.getCenter();
        canvas.clear()
        canvas.setBackgroundImage(image, canvas.renderAll.bind(canvas), {
          top: center.top,
          left: center.left,
          originX: 'center',
          originY: 'center'
        });
        let croppedImage = { json: canvas.toJSON(), croppedImage: canvas.toDataURL() };
        new CanvasHistory(canvas, croppedImage)
        canvas.renderAll();
      }

    }
}
export const clear = () => {
  drag();
  canvas.clear();
}
export const saveImage = () => {
  drag();
  return canvas.toDataURL('image/jpeg', 1);
}