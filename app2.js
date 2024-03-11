fabric.HammerCanvas = fabric.util.createClass(fabric.Canvas, /** @lends fabric.Canvas.prototype */ {

    // Disable touch scroll when an element is selected
    selectionCreatedHandler: function (e) {
      fabric.util.setStyle(this.wrapperEl, {
        'touch-action': 'none'
      })
      fabric.util.setStyle(this.upperCanvasEl, {
        'touch-action': 'none'
      })
      fabric.util.setStyle(this.lowerCanvasEl, {
        'touch-action': 'none'
      })
    },
    // Re-Enable touch scroll when nothing is selected
    selectionClearedHandler: function (e) {
      fabric.util.setStyle(this.wrapperEl, {
        'touch-action': 'manipulation'
      })
      fabric.util.setStyle(this.upperCanvasEl, {
        'touch-action': 'manipulation'
      })
      fabric.util.setStyle(this.lowerCanvasEl, {
        'touch-action': 'manipulation'
      })
    },
    /**
     * Be sure that touchstart reacts to multitouch on hammerjs
     * @param e
     * @private
     */
    _onMouseDown: function (e) {
      if (e.type === 'touchstart') {
        // Do not allow grouping in mobile mode
        this.selection = false
        fabric.util.removeListener(this.upperCanvasEl, 'mousedown', this._onMouseDown)
        if (this.currentTouchStart) {
          // Second event, stop this as this is multitouch
          clearTimeout(this.currentTouchStart)
          this.currentTouchStart = null
        } else {
          // First touch start, wait 100 ms then call
          this.currentTouchStart = setTimeout(() => {
            this.currentTouchStart = null
            this.callSuper('_onMouseDown', e)
          }, 75)
        }
      } else {
        this.callSuper('_onMouseDown', e)
      }
    },
  
    /**
     * mouseup delay has to be set as well
     * @param e
     * @private
     */
    _onMouseUp: function (e) {
      if (e.type === 'touchend') {
        setTimeout(() => {
          this.callSuper('_onMouseUp', e)
        }, 75)
      } else {
        this.callSuper('_onMouseUp', e)
      }
    },
  
    _onMouseMove: function (e) {
      this.getActiveObject() && e.preventDefault && e.preventDefault()
      this.__onMouseMove(e)
    },
  
    /**
     * add hammerjs event handlers as well
     * @param functor
     * @param eventjsFunctor
     */
    addOrRemove: function (functor, eventjsFunctor) {
      this.callSuper('addOrRemove', functor, eventjsFunctor)
      var mc = new Hammer.Manager(this.wrapperEl)
  
      // create a recognizer
      var Pinch = new Hammer.Pinch()
      var Rotate = new Hammer.Rotate()
  
      Pinch.recognizeWith(Rotate)
  
      // add the recognizer
      mc.add(Pinch)
      mc.add(Rotate)
  
      // subscribe to events
      mc.on('pinchstart', (e) => {
        this.initialPinchScale = this.getActiveObject() ? this.getActiveObject().scaleX : 1
      })
      mc.on('pinch', (e) => {
        let object = this.getActiveObject()
        if (object) {
          object.scale(e.scale * this.initialPinchScale)
          this.requestRenderAll()
        }
      })
      mc.on('rotatestart', (e) => {
        this.initialRotateTheta = e.rotation - (this.getActiveObject() ? this.getActiveObject().angle : 0)
        this.initialRotateAngle = this.getActiveObject() ? this.getActiveObject().angle : 0
      })
      mc.on('rotate', (e) => {
        let object = this.getActiveObject()
        if (object) {
          let rotationTheta = e.rotation - this.initialRotateTheta - this.initialRotateAngle
          if (Math.abs(rotationTheta) > 10) {
            let newRotationAngle = e.rotation - this.initialRotateTheta
            object.rotate(newRotationAngle)
          } else {
            object.rotate(this.initialRotateAngle)
          }
          this.requestRenderAll()
        }
      })
    }
  })
  
  // Initialization of the Fabric.js canvas
  //
  let canvas = new fabric.HammerCanvas('imageCanvas', {
      width: document.getElementById('canvasContainer').offsetWidth,
      height: document.getElementById('canvasContainer').offsetHeight
  });
  
  
  // Variables to keep track of the initial scale and rotation
  var initialScale = 1;
  var initialRotation = 0;
  
  let originalImageDimensions = { width: 0, height: 0 };
  
  function calculateRequiredCanvasDimensions() {
      // Start with the original image dimensions as the base bounding box
      let bbox = { left: 0, top: 0, right: originalImageDimensions.width, bottom: originalImageDimensions.height };
  
      // Expand the bounding box to include all canvas objects
      canvas.getObjects().forEach(obj => {
          let objBbox = obj.getBoundingRect();
          bbox.left = Math.min(bbox.left, objBbox.left);
          bbox.top = Math.min(bbox.top, objBbox.top);
          bbox.right = Math.max(bbox.right, objBbox.left + objBbox.width);
          bbox.bottom = Math.max(bbox.bottom, objBbox.top + objBbox.height);
      });
  
      // Calculate the required width and height based on the bounding box
      return { width: bbox.right - bbox.left, height: bbox.bottom - bbox.top };
  }
  
  
  document.getElementById('imageLoader').addEventListener('change', function(e) {
      const reader = new FileReader();
      reader.onload = function(event) {
          fabric.Image.fromURL(event.target.result, function(oImg) {
              // Calculate the scale to fit the image width within the canvas
              var scale = Math.min(canvas.getWidth() / oImg.width, canvas.getHeight() / oImg.height);
              // Apply the scale to adjust image dimensions
              oImg.scale(scale);
  
              // Position the image at the top of the canvas
              oImg.set({
                  left: canvas.getWidth() / 2, // Center horizontally
                  top: 0, // Align to the top edge of the canvas
                  originX: 'center', // Center horizontally based on the image's width
                  originY: 'top', // Align the top edge of the image to the top edge of the canvas
                  selectable: false,
                  evented: false,
                  hasControls: false
              });
  
              // Store original image dimensions after scaling
              originalImageDimensions.width = oImg.getScaledWidth();
              originalImageDimensions.height = oImg.getScaledHeight();
  
              // Add the image to the canvas and render
              canvas.add(oImg);
              canvas.renderAll();
          });
      };
      reader.readAsDataURL(e.target.files[0]);
  });
  
  
  document.querySelectorAll('.sticker').forEach(img => {
      img.addEventListener('click', function() {
          fabric.Image.fromURL(img.src, function(sticker) {
              // Set initial sticker size and rotation properties
              sticker.scaleToWidth(200); // Example: setting the sticker width to 100 pixels
              sticker.set({
                  originX: 'center', // Set originX to 'center'
                  originY: 'center', // Set originY to 'center'
                  // Other properties...
                  transparentCorners: false,
                  cornerColor: 'blue',
                  cornerSize: 12,
                  rotatingPointOffset: 20,
                  lockScalingFlip: true,
                  hasBorders: true,
                  hasControls: true,
                  hasRotatingPoint: true
              });
              
              // Set the sticker's position to canvas center for demonstration
              // You can set it to any position as needed
              sticker.set({
                  left: canvas.getWidth() / 2,
                  top: canvas.getHeight() / 2,
              });
  
              // Make sure the sticker is centered and added to the canvas
              sticker.setCoords(); // This recalculates the object's position based on its origin
              canvas.add(sticker);
              canvas.setActiveObject(sticker); // Optionally set it as active
              canvas.renderAll();
          });
      });
  });
  
  canvas.on('object:rotating', function(options) {
      options.target.snapAngle = 5; // Snaps the rotation to 15-degree increments
  });
  
  document.getElementById('deleteBtn').addEventListener('click', function() {
      var activeObject = canvas.getActiveObject();
      if (activeObject) {
          canvas.remove(activeObject);
          canvas.requestRenderAll();
      }
  });
  
  document.getElementById('resetBtn').addEventListener('click', function() {
      canvas.clear();
  });
  
  canvas.on('selection:created', function() {
      document.getElementById('deleteBtn').style.display = 'block';
  });
  
  canvas.on('selection:cleared', function() {
      document.getElementById('deleteBtn').style.display = 'none';
  });
  
  canvas.on('selection:updated', function() {
      document.getElementById('deleteBtn').style.display = 'block';
  });
  
  
  document.getElementById('addStickerBtn').addEventListener('click', function() {
      openStickerPopup(); // Function that opens the sticker selection pop-up
  });
  
  document.getElementById('saveBtn').addEventListener('click', function() {
      // Calculate required dimensions to include all overlays
      let requiredDims = calculateRequiredCanvasDimensions();
  
      // Adjust canvas size to fit all content
      canvas.setDimensions({ width: requiredDims.width, height: requiredDims.height });
  
      // Ensure the original image is positioned at the top
      // Note: This assumes the original image is already correctly positioned from when it was loaded
      // If you've manipulated the image or canvas and need to reposition, you would adjust here
  
      // Save canvas content
      const dataURL = canvas.toDataURL({
          format: 'png',
          quality: 1
      });
  
      // Download logic
      const link = document.createElement('a');
      link.download = 'mogged.png'; // Filename
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
      // Optionally, reset canvas dimensions or object positions if modified for saving
  });
  
  // Get the modal
  var modal = document.getElementById("stickerPopup");
  
  // Get the <span> element that closes the modal
  var span = document.getElementsByClassName("close")[0];
  
  // When the user clicks on <span> (x), close the modal
  span.onclick = function() {
      modal.style.display = "none";
  }
  
  // Function to open the modal
  function openStickerPopup() {
      modal.style.display = "block";
  }
  
  // Close the modal if the user clicks outside of it
  window.onclick = function(event) {
      if (event.target == modal) {
          modal.style.display = "none";
      }
  }
  
  // Add event listeners to stickers (similar to previous implementation)
  document.querySelectorAll('.sticker').forEach(img => {
      img.addEventListener('click', function() {
          // Existing code to add sticker to canvas
          modal.style.display = "none"; // Close the modal after selecting a sticker
      });
  });
  