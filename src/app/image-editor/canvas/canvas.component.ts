import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { UtilService } from '../util.service';
import * as fabric from "fabric";

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css'],
  standalone: false
})
export class CanvasComponent  implements AfterViewInit , OnDestroy {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  

  private cv: fabric.Canvas;

  private toolType!: string;
  private activeObjectType!: string;
  private activeObject: any;
  private activeObjectList: any;

  // Croping 
  private overlay:any;
  private croppingWindow:any;

  // Editor properties
  private screenReductionFactor:number = 180;
  private aspectRatioList: number[] = [(6/6),(8/6),(7/5),(6/4)]

  // Global Scope Tool values
  private globalFilterValues = {
    brightness:0,
    contrast:0,
    saturation:0,
    hue:0,
    noise:0,
    blur:0,
    pixelate:0,
    sharpen:false,
    emboss:false,
    grayscale:false,
    vintage:false,
    sepia:false,
    polaroid:false
  };

  // Tool default values
  private defaultTextProps = {
    text:'Sample Text',
    color:'#7F7F7F',
    opacity:1,
    fontFamily:'Roboto',
    fontSize:24,
    fontWeight:'normal',
    fontStyle:'normal',
    underline:false,
    linethrough:false,
    textAlign:'left',
    lineHeight:1.6,
    charSpacing:0
  }

  // canvas size preperty
  private size: any = {
    height: Math.round(window.innerHeight - this.screenReductionFactor),
    width: Math.round((window.innerHeight - this.screenReductionFactor) * this.aspectRatioList[3]),
  };

  // ------------------------------- subscribtion ------------------------------
  private windowResizeSubscription!:Subscription;
  private objectResizeSubscription!:Subscription;
  private addImageSubscription!:Subscription;
  private addImageFilterSubscription!:Subscription;
  private onUpdateTextSubscription!:Subscription;
  private onUpdateShapeMaskSubscription!:Subscription;
  private onSelectionModifiedSubscription!:Subscription;
  private canvasCommandSubscription!:Subscription;
  private changeCanvasSizeSubscription!:Subscription;

  
  onObjectSelected():void{
    const activeObjectSelection = this.getActiveSelection();
    this.activeObjectType = activeObjectSelection.type;

    if(this.activeObjectType === 'group'){
      this.activeObjectList = activeObjectSelection.activeObjectList;
      this.utilService.onSelectionCreated(this.activeObjectList,this.activeObjectType,{});
      this.utilService.changeToolType('DEACTIVATE',{});
    }
    else{
      this.activeObject = activeObjectSelection.activeObject;
      switch (this.activeObjectType) {
        case 'i-text':
          this.toolType = 'TEXT'              
          this.onSelectText(this.activeObject);
          break;
        case 'image':
          if(this.toolType === 'FILTER:ALL'){
            this.toolType = 'FILTER:SINGLE';
            this.onSelectImage(this.activeObject)
          }
          break; 
        case 'shape-mask':
          this.toolType = 'SHAPE_MASK';
          this.onSelectShapeMask();
          break;
        default:
          break;
      }
      this.utilService.onSelectionCreated(this.activeObject,this.activeObjectType,{});
    }
  }

  onSelectShapeMask(){
    if(this.activeObject){
      console.log(this.activeObject.shadow);
      this.utilService.changeToolType('SHAPE_MASK',{
        color: this.activeObject.fill,
        opacity: this.activeObject.opacity,
        shadowAmount: this.activeObject.shadow.color.split(',')[3].split(')')[0],
        shadowBlur: this.activeObject.shadow.blur,
        shadowOffsetX: this.activeObject.shadow.offsetX,
        shadowOffsetY: this.activeObject.shadow.offsetY
      });
    }
  }


  onObjectDeselected():void{
    // Turn off crop mode
    if(this.croppingWindow){
      this.stopCrop();
    }

    switch (this.activeObjectType) {
      case 'image':
        // Don't change to MAIN menu for image
        if(this.toolType === 'FILTER:SINGLE'){
          this.toolType = 'FILTER:ALL';
        }
        this.activeObjectType = '';
        this.activeObject = undefined;
        this.activeObjectList = [];
        this.utilService.changeToolType(this.toolType,this.activeObject);
        this.utilService.onSelectionCreated(this.activeObject,this.activeObjectType,{});
        break;    
      default:
        this.toolType = 'MAIN';
        this.activeObjectType = '';
        this.activeObject = undefined;
        this.activeObjectList = [];
        this.utilService.changeToolType(this.toolType,this.activeObject);
        this.utilService.onSelectionCreated(this.activeObject,this.activeObjectType,{});
        break;
    }
  }

  onEnterningTextEditingMode(){
    const activeObjectSelection = this.getActiveSelection();
    this.toolType = 'TEXT:EDITING'
    this.activeObjectType = activeObjectSelection.type;
    this.activeObject = activeObjectSelection.activeObject;
    if(this.activeObjectType === 'i-text'){
      this.onSelectTextEditing(this.activeObject);
    }
  }

  onExitingTextEditingMode(){
    this.toolType = 'MAIN';
    this.activeObjectType = '';
    this.activeObject = undefined;
    this.activeObjectList = [];
    this.utilService.changeToolType(this.toolType,undefined);
  }

  onTextSelectionChange(){
    if(this.activeObjectType === 'i-text'){
      this.onSelectTextEditing(this.activeObject);
    }
  }

  startCrop() {
    console.log('Cropping started');
    this.cleanSelect();
  
    // ✅ Dark overlay
    this.overlay = new fabric.Rect({
      left: 0,
      top: 0,
      fill: '#000000',
      opacity: 0.5,
      width: this.size.width,
      height: this.size.height,
      selectable: false,
      evented: false
    });
    this.cv.add(this.overlay);
  
    // ✅ Crop selection rectangle
    this.croppingWindow = new fabric.Rect({
      left: 0,
      top: 0,
      fill: 'transparent',
      borderColor:'#ffffff',
      stroke: '#6b6ab53f',
      strokeWidth: 2,
      width: 300,
      height: 300,
      hasRotatingPoint: false,
      cornerColor: '#ffffff',
      borderOpacityWhenMoving: 1,
      selectable: true,
    });
  
    this.cv.add(this.croppingWindow);
    this.selectItemAfterAdded(this.croppingWindow);
    this.cv.requestRenderAll();
  }
  
  async cropSelectedWindow() {
    if (!this.croppingWindow) return;
    
    const { left, top, width, height } = this.croppingWindow;
    
    this.cv.getObjects().forEach(async (object: any) => {
      if (object.type === 'image') {
        // ✅ Create a new cropped image using fabric.js
        const croppedImage = await this.cropImage(object, left!, top!, width!, height!);
        this.cv.remove(object);
        this.cv.add(croppedImage);
        this.cv.setActiveObject(croppedImage);
      }
    });
  
    this.stopCrop();
  }
  
  async cropImage(image: fabric.Image, left: number, top: number, width: number, height: number): Promise<fabric.Image> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
  
      // ✅ Set canvas size to crop area
      canvas.width = width;
      canvas.height = height;
  
      const imgElement = image.getElement() as HTMLImageElement;
  
      // ✅ Draw cropped area
      ctx.drawImage(
        imgElement,
        left - image.left!, top - image.top!, // Source X, Y
        width, height, // Source Width, Height
        0, 0, // Destination X, Y
        width, height // Destination Width, Height
      );
  
      // ✅ Convert canvas to image
      const croppedURL = canvas.toDataURL();
  
      fabric.Image.fromURL(croppedURL).then((newImage) => {
        newImage.set({
          left,
          top,
          scaleX: 1,
          scaleY: 1,
        });
        resolve(newImage);
      });
    });
  }
  
  stopCrop() {
    console.log('Stopping crop');
    
    if (this.overlay) this.cv.remove(this.overlay);
    if (this.croppingWindow) this.cv.remove(this.croppingWindow);
    
    this.cv.forEachObject((object: any) => {
      object.selectable = true;
    });
  
    this.croppingWindow = undefined;
    this.overlay = undefined;
    this.cv.requestRenderAll();
  }

  
  constructor(private utilService: UtilService ) {
    this.addImageSubscription = utilService.addImageToCanvas$.subscribe(
      (url : string) => {
        
        
        this.addImageOnCanvas(url);
      }
    )
    
    this.addImageFilterSubscription = utilService.addImageFilter$.subscribe(
      ({filterScope,filterProps})=>{
        switch (filterScope) {
          case 'SINGLE':
            this.applyFilterOnSingle(filterProps);
            break;
          case 'ALL':
            this.applyFilterOnAll(filterProps);
            break;
          default:
            break;
        }
      }
    )

    this.onUpdateTextSubscription = utilService.onUpdateText$.subscribe(
      (textProps) => {
        switch (this.toolType) {
          case 'TEXT':
            this.onUpdateText(textProps);
            break;
          case 'TEXT:EDITING':
            this.onUpdateTextEditing(textProps);
            break;
          default:
            break;
        }
      }
    )

    this.onUpdateShapeMaskSubscription = utilService.onUpdateShapeMask$.subscribe(
      (shapeMaskProps)=>{
        this.onUpdateShapeMask(shapeMaskProps);
      }
    );

    this.canvasCommandSubscription = utilService.canvasCommand$.subscribe(
      ({toolType,option}) => {
        switch (toolType) {
          case 'ADD_FILTER':
            if(this.activeObjectType==='image'){
              this.toolType = 'FILTER:SINGLE';
              this.utilService.changeToolType('FILTER:SINGLE',this.getActiveFilter(this.activeObject));
            }
            else if(this.activeObjectType===''){
              this.toolType = 'FILTER:ALL';
              this.utilService.changeToolType('FILTER:ALL',this.globalFilterValues);
            }
            break;
          case 'FILTER:ALL':
            this.cleanSelect();
            this.toolType='FILTER:ALL';
            this.utilService.changeToolType('FILTER:ALL',this.globalFilterValues);
            break;
          case 'ADD_TEXT':
            this.onAddText();
            break;
          case 'CLEAN_SELECT':
            this.cleanSelect();
            break;
          case 'BACK_TO_MAIN_MENU':
            // turn off drawing mode
            this.stopPenMode();           
            
            // if object type is image and in filter single mode, don't clear selection
            if(this.activeObjectType!=='image' && this.toolType !== 'FILTER:ALL'){
              this.cleanSelect();
            }            
            
            this.toolType = 'MAIN';
            break;
          case 'DELETE':
            this.removeSelection();
            this.onObjectDeselected();
            break;
          case 'BRING_FORWARD':
            this.bringForward();
            break;
          case 'SEND_BACKWARD':
            this.sendBackward();
            break;
          case 'START_CROP':
            this.startCrop();
            this.utilService.changeToolType('CROP',{});
            break;
          case 'STOP_CROP':
            this.onObjectDeselected();
            break;
          case 'FINISH_CROP':
            this.cropSelectedWindow();
            break;
          case 'FLIP:X':
            this.flipSelectedImage();
            break;
          case 'CLONE':
            this.clone();
            break;
          case 'ADD_SHAPE_MASK':
            this.addShapeMask(option);
            break;
          case 'DOWNLOAD_CURRENT_CANVAS':
            this.downloadCurrentCanvas();
            break;
          case 'PEN':
            this.startPenMode();
            break;
          default:
            break;
        }
      }
    )

    // this.changeCanvasSizeSubscription = utilService.changeCanvasSize$.subscribe(
    //   ({ orientation, aspectRatio })=>{

    //     if(orientation === 'LANDSCAPE'){
    //       this.size.height = Math.round(window.innerHeight - this.screenReductionFactor);
    //       this.size.width = Math.round((window.innerHeight - this.screenReductionFactor) * this.aspectRatioList[aspectRatio])
    //     }
    //     else{
    //       this.size.height = Math.round(window.innerHeight - this.screenReductionFactor);
    //       this.size.width = Math.round((window.innerHeight - this.screenReductionFactor) * Math.pow(this.aspectRatioList[aspectRatio],-1));
    //     }

    //     this.canvas.setWidth(this.size.width);
    //     this.canvas.setHeight(this.size.height);
    //   }
    // );

  }

  onUpdateShapeMask(shapeMaskProps : any){
    if(this.activeObject && this.activeObjectType === 'shape-mask'){
      this.activeObject.set('fill',shapeMaskProps.color);
      this.activeObject.set('opacity',shapeMaskProps.opacity);
      this.activeObject.setShadow({
        color: `rgba(0,0,0,${shapeMaskProps.shadowAmount})`,
        blur: shapeMaskProps.shadowBlur,
        offsetX: shapeMaskProps.shadowOffsetX,
        offsetY: shapeMaskProps.shadowOffsetY
      });
      
      this.cv.renderAll();
    }
  }
  startPenMode(){
    
    this.cv.isDrawingMode = true;
    this.cv.forEachObject((object : any)=>{
      // keep the drawing objects selectable
      object.selectable = false;
    })
    this.cleanSelect();
    this.utilService.changeToolType('PEN',{});
  }
  flipSelectedImage(){
    
    if(this.activeObjectType === 'image'){
      this.activeObject.flipX = this.activeObject.flipX ? !this.activeObject.flipX : true;
      this.cv.renderAll();
    }
    else{
      this.utilService.openSnackBar("No image selected",800);
    }
  }
  stopPenMode(){
    
    this.cv.isDrawingMode = false;
  }

  ngAfterViewInit() {
    if (this.cv) {
      this.cv.dispose();
    }

    if (this.canvas?.nativeElement) {
      this.cv = new fabric.Canvas(this.canvas.nativeElement, {
        hoverCursor: 'pointer',
        selection: true,
        selectionBorderColor: '#B3E5FC',
        backgroundColor: '#ffffff'
      });
  
      // ✅ Corrected: Set canvas size properly
      this.cv.setWidth(this.size.width);
      this.cv.setHeight(this.size.height);
  
      // this.cv.width = this.size.width;
      // this.cv.height = this.size.height;
  
      // ✅ Corrected: WebGL filter backend setup (if available)
      if (fabric.WebGLFilterBackend) {
        const webGLBackend = new fabric.WebGLFilterBackend({ tileSize: 4096 });
        fabric.setFilterBackend(webGLBackend);
      }
  
      // ✅ Corrected: Attach event listeners to `this.cv`, not `ctx`
      this.cv.on({
        'selection:created': () => {
          console.log('Selection active');
          this.onObjectSelected();
        },
        'selection:updated': () => {
          console.log('Selection updated');
          this.onObjectSelected();
        },
        'selection:cleared': () => {
          console.log('Selection inactive');
          this.onObjectDeselected();
        },
        'object:modified': () => {
          console.log('Object modified');
        },
        'text:editing:entered': () => {
          console.log('Editing entered');
          this.onEnterningTextEditingMode();
        },
        'text:editing:exited': () => {
          console.log('Editing exit');
          this.onExitingTextEditingMode();
        },
        'text:selection:changed': () => {
          console.log('Text selection change');
          this.onTextSelectionChange();
        },
        'text:changed': () => {
          console.log('Text changed');
        }
      });

    } else {
      console.error("Canvas element is not available");
    }

    // ✅ Corrected: Setting up Fabric.js on the canvas element
    
  }

  // ngAfterViewInit() {
  //   // ✅ Prevent multiple Fabric instances
  //   this.toolType = 'MAIN';
  //   this.activeObjectType = ''
  //   this.activeObject = undefined;
  //   this.activeObjectList = [];

  //   // Setting up fabric object on canvas
  //   this.cv = new fabric.Canvas('canvas', {
  //     hoverCursor: 'pointer',
  //     selection: true,
  //     selectionBorderColor: '#B3E5FC',
  //     backgroundColor:'#ffffff'
  //   });
  //   // fabric.textureSize = 4096;

  //   // Initializing backend
  //   var webglBackend = new fabric.WebGLFilterBackend();
  //   // var canvas2dBackend = new fabric.Canvas2dFilterBackend()
    

  //   // Default size of canvas
  //   this.cv.setWidth(this.size.width);
  //   this.cv.setHeight(this.size.height);
  //   // if (this.cv instanceof fabric.Canvas) {
  //   //   this.cv.dispose();
  //   // }

  //   // if (this.canvas?.nativeElement) {
  //   //   this.cv = new fabric.Canvas(this.canvas.nativeElement, {
  //   //     hoverCursor: 'pointer',
  //   //     selection: true,
  //   //     selectionBorderColor: '#B3E5FC',
  //   //     backgroundColor: '#ffffff'
  //   //   });

  //   //   // ✅ Correct way to set canvas dimensions
  //   //   this.cv.setWidth(this.size.width);
  //   //   this.cv.setHeight(this.size.height);

  //   //   // ✅ Fabric.js WebGL filter backend (if available)
  //   //   if ((fabric as any).WebGLFilterBackend) {
  //   //     const webGLBackend = new (fabric as any).WebGLFilterBackend({ tileSize: 2048 });
  //   //     fabric.setFilterBackend(webGLBackend);
  //   //   }

  //     // ✅ Attach event listeners correctly
  //     this.cv.on({
  //       'selection:created': () => this.onObjectSelected(),
  //       'selection:updated': () => this.onObjectSelected(),
  //       'selection:cleared': () => this.onObjectDeselected(),
  //       'object:modified': () => console.log('Object modified'),
  //       'text:editing:entered': () => this.onEnterningTextEditingMode(),
  //       'text:editing:exited': () => this.onExitingTextEditingMode(),
  //       'text:selection:changed': () => this.onTextSelectionChange(),
  //       'text:changed': () => console.log('Text changed')
  //     });
    
  // }
  
  getActiveSelection():any{
    
    const selectionList = this.cv.getActiveObjects();
    if(selectionList.length === 1){
      const activeObject = selectionList[0];
      switch (activeObject.type) {
        case 'image':
          return {
            type:'image',
            activeObject: activeObject
          };
        case 'i-text':
          return {
            type:'i-text',
            activeObject: activeObject
          };
        case 'rect':
          if(this.croppingWindow === undefined){
            return {
              type:'shape-mask',
              activeObject: activeObject
            }
          }
          else{
            return {
              type:'cropping-window',
              activeObject: activeObject
            }
          }
        case 'triangle':
          return {
            type:'shape-mask',
            activeObject: activeObject
          }
        case 'circle':
          return {
            type:'shape-mask',
            activeObject: activeObject
          }
        default:
          return {
            type:'UNKNOWN'
          }
      }
    }
    else{
      return {
        type:'group',
        activeObjectList: selectionList
      }
    }
  }

  selectItemAfterAdded(obj: any) {
    
    this.cv.discardActiveObject();
    this.cv.discardActiveObject(); // ✅ Discards active object
    this.cv.renderAll();
  }

  cleanSelect() {
    
    this.cv.discardActiveObject(); // ✅ Discards active object
    this.cv.renderAll();
  }
  async clone() {
    if (this.activeObjectType === 'image' && this.activeObject) {
      try {
        const clonedObj = await this.activeObject.clone();
        clonedObj.set({ left: 10, top: 10 });
        this.cv.add(clonedObj);
        this.selectItemAfterAdded(clonedObj);
        this.cv.requestRenderAll();
      } catch (error) {
        console.error('Error cloning object:', error);
      }
    } else {
      this.utilService.openSnackBar('No image selected', 800);
    }
  }
  
  
  removeSelection(){
    
    if(this.activeObjectType === 'group'){
      this.activeObjectList.map((activeObject : any)=>{
        this.cv.remove(activeObject);
      },this)
    }
    else{
      this.cv.remove(this.activeObject);
    }
    this.cleanSelect();
  }

  // startCrop(){
    
  //   console.log('cropping started');
  //   this.cleanSelect();
  //   this.overlay = new fabric.Rect({
  //     left: 0,
  //     top: 0,
  //     fill: '#000000',
  //     opacity:0.5,
  //     width: this.size.width,
  //     height: this.size.height,
  //   });
  //   this.cv.add(this.overlay);
  //   this.cv.forEachObject((object : any)=>{
  //     object.selectable = false;
  //   })
  //    this.croppingWindow = new fabric.Rect({
  //     left: 200,
  //     top: 200,
  //     fill: '#6b6ab53f',
  //     borderColor:'#6b6ab53f',
  //     cornerColor:'#6b6ab53f',
  //     borderOpacityWhenMoving:1,
  //     hasRotatingPoint:false,
  //     padding:0,
  //     width: 300,
  //     height: 300,
  //   });
  //   this.cv.add(this.croppingWindow);
  //   this.selectItemAfterAdded(this.croppingWindow);
  //   this.cv.renderAll();
  // }

  // cropSelectedWindow(){
  //   const width = this.croppingWindow.getScaledWidth()
  //   const height = this.croppingWindow.getScaledHeight()
    
  //   this.cv.forEachObject(
  //     (object: any)=>{
  //       if(object.type === 'image'){
  //         const objectWidth = object.getScaledWidth();
  //         const objectHeight = object.getScaledHeight();
  //         let x = (objectWidth/2) - (this.croppingWindow.left - object.left);
  //         let y = (objectHeight/2) - (this.croppingWindow.top - object.top);
  //         x = x * (1/object.scaleX);
  //         y = y * (1/object.scaleY);
          
  //         object.clipTo = (ctx : any) =>{
  //           ctx.rect((object.flipX ? 1 : -1) * x, -y, (object.flipX ? -1 : 1) * width * (1/object.scaleX), height * (1/object.scaleY));
  //         }
  //         this.utilService.addImageToCanvas(object);
  //         this.cv.renderAll();
  //       }
  //     }
  //   )
  //   this.stopCrop();
  // }


  randomId() {
    return Math.floor(Math.random() * 999999) + 1;
  }

  extend(obj: any, id: any): void {
    const originalToObject = obj.toObject.bind(obj); // ✅ Preserve original method
  
    obj.toObject = function () {
      return {
        ...originalToObject(), // ✅ Correct way to extend objects
        id: id, // ✅ Adds custom property
      };
    };
  }
  
  bringForward() {
    if (this.activeObjectType !== 'group' && this.activeObject) {
      const objects = this.cv.getObjects();
      const currentIndex = objects.indexOf(this.activeObject);
      
      if (currentIndex < objects.length - 1) {
        this.cv.moveObjectTo(this.activeObject, currentIndex + 1); // ✅ Correct Fabric.js v6 API
        this.cv.requestRenderAll(); // ✅ Ensures UI updates
      }
    }
  }
  
  sendBackward() {
    if (this.activeObjectType !== 'group' && this.activeObject) {
      const objects = this.cv.getObjects();
      const currentIndex = objects.indexOf(this.activeObject);
      
      if (currentIndex > 0) {
        this.cv.moveObjectTo(this.activeObject, currentIndex - 1); // ✅ Correct Fabric.js v6 API
        this.cv.requestRenderAll(); // ✅ Ensures UI updates
      }
    }
  }
  
  

  downloadCurrentCanvas(){
    
    const multiplier = 1080/this.size.height;
    console.log(multiplier);
    const url = this.cv.toDataURL({
      format: 'jpeg',
      quality: 1,
      multiplier: multiplier
    })

    window.open(url);
  }

  addShapeMask(shapeMaskProps: any) {
    let shapeToAdd: fabric.Object | null = null;
    
    switch (shapeMaskProps.shape) {
      case 'RECTANGLE':
        shapeToAdd = new fabric.Rect({
          top: 25,
          left: 25,
          height: 100,
          width: 100,
          fill: shapeMaskProps.color,
          opacity: shapeMaskProps.opacity,
          shadow: new fabric.Shadow({
            color: `rgba(0,0,0,${shapeMaskProps.shadowAmount})`,
            blur: shapeMaskProps.shadowBlur,
            offsetX: shapeMaskProps.shadowOffsetX,
            offsetY: shapeMaskProps.shadowOffsetY
          }),
        });
        break;
      case 'TRIANGLE':
        shapeToAdd = new fabric.Triangle({
          top: 25,
          left: 25,
          height: 100,
          width: 100,
          fill: shapeMaskProps.color,
          opacity: shapeMaskProps.opacity,
          shadow: new fabric.Shadow({
            color: `rgba(0,0,0,${shapeMaskProps.shadowAmount})`,
            blur: shapeMaskProps.shadowBlur,
            offsetX: shapeMaskProps.shadowOffsetX,
            offsetY: shapeMaskProps.shadowOffsetY
          }),
        });
        break;
      case 'CIRCLE':
        shapeToAdd = new fabric.Circle({
          top: 25,
          left: 25,
          radius: 50,
          fill: shapeMaskProps.color,
          opacity: shapeMaskProps.opacity,
          shadow: new fabric.Shadow({
            color: `rgba(0,0,0,${shapeMaskProps.shadowAmount})`,
            blur: shapeMaskProps.shadowBlur,
            offsetX: shapeMaskProps.shadowOffsetX,
            offsetY: shapeMaskProps.shadowOffsetY
          }),
        });
        break;
      default:
        console.warn("Invalid shape type:", shapeMaskProps.shape);
        return;
    }
  
    if (shapeToAdd) {
      this.cv.add(shapeToAdd);
      this.selectItemAfterAdded(shapeToAdd);
    }
  }

  addImageOnCanvas(url: string): void {
    if (!url) return;
  
    fabric.FabricImage.fromURL(url).then((image) => {
      
     
        if (!image) return;
  
        if (!this.cv) {
          console.error('Canvas is not initialized');
          return;
        }
  
        // Scale image to fit within canvas dimensions
        const scaleFactor = Math.min(
          (this.cv.getWidth() - 20) / image.width!,
          (this.cv.getHeight() - 20) / image.height!
        );
  
        image.set({
          crossOrigin: 'anonymous',
          left: 10,
          top: 10,
          scaleX: scaleFactor,
          scaleY: scaleFactor,
          angle: 0,
          cornerSize: 10,
          rotatingPointOffset: 20,
        });
  
        this.cv.add(image);
        this.cv.setActiveObject(image);
        this.cv.renderAll();
      
    });
  }
  
  // addImageOnCanvas(url:string):void{
    
  //   if (url) {
  //     // console.log(url);
  //     fabric.Image.fromURL(url, 
  //       {crossOrigin: 'anonymous'},
  //       (image: fabric.Image) => {
  //         if (!image) return;
  
  //         const scaleXFactor = (this.size.width - 20) / image.width!;
  //         const scaleYFactor = scaleXFactor;
  
  //         image.set({
  //           left: 10,
  //           top: 10,
  //           scaleX: scaleXFactor,
  //           scaleY: scaleYFactor,
  //           angle: 0,
  //           cornerSize: 10, // Correct property name
  //           rotatingPointOffset: 20, // Correct replacement for hasRotatingPoint
  //         });
  
  //         this.extend(image, this.randomId());
  //         this.cv.add(image);
  //         this.selectItemAfterAdded(image);
  //       }
  //     );  
          
  //   };
    
  // }

  generateFilterArray(filterProps: any) {
    const filterArray: fabric.filters.BaseFilter<any,any,any>[] = [];
  
    if (filterProps.brightness !== 0) {
      filterArray.push(new fabric.filters.Brightness({ brightness: filterProps.brightness }));
    }
  
    if (filterProps.contrast !== 0) {
      filterArray.push(new fabric.filters.Contrast({ contrast: filterProps.contrast }));
    }
  
    if (filterProps.saturation !== 0) {
      filterArray.push(new fabric.filters.Saturation({ saturation: filterProps.saturation }));
    }
  
    if (filterProps.hue !== 0) {
      filterArray.push(new fabric.filters.HueRotation({ rotation: filterProps.hue }));
    }
  
    if (filterProps.noise !== 0) {
      filterArray.push(new fabric.filters.Noise({ noise: filterProps.noise }));
    }
  
    if (filterProps.blur !== 0) {
      filterArray.push(new fabric.filters.Blur({ blur: filterProps.blur }));
    }
  
    if (filterProps.pixelate !== 0) {
      filterArray.push(new fabric.filters.Pixelate({ blockSize: filterProps.pixelate })); // ✅ Fixed property name
    }
  
    if (filterProps.sharpen) {
      filterArray.push(
        new fabric.filters.Convolute({
          matrix: [
            0, -1, 0,
            -1, 5, -1,
            0, -1, 0
          ],
        })
      );
    }
  
    if (filterProps.emboss) {
      filterArray.push(
        new fabric.filters.Convolute({
          matrix: [
            1, 1, 1,
            1, 0.7, -1,
            -1, -1, -1
          ],
        })
      );
    }
  
    if (filterProps.grayscale) {
      filterArray.push(new fabric.filters.Grayscale()); // ✅ Removed unsupported `mode` property
    }
  
    if (filterProps.vintage) {
      filterArray.push(new fabric.filters.Vintage()); // ✅ No options needed
    }
  
    if (filterProps.sepia) {
      filterArray.push(new fabric.filters.Sepia()); // ✅ No options needed
    }
  
    if (filterProps.polaroid) {
      filterArray.push(new fabric.filters.Polaroid()); // ✅ No options needed
    }
  
    return filterArray;
  }
  
  onSelectText(textObject : any):void{    
    this.utilService.changeToolType(this.toolType,{
      fontFamily:textObject['fontFamily'],
      fontSize:textObject['fontSize'],
      fontWeight:textObject['fontWeight'],
      fontStyle:textObject['fontStyle'],
      color:textObject['fill'],
      opacity:textObject['opacity'],
      underline:textObject['underline'],
      linethrough:textObject['linethrough'],
      textAlign:textObject['textAlign'],
      lineHeight:textObject['lineHeight'],
      charSpacing:textObject['charSpacing']
    });
  }

  onSelectTextEditing(textObject : any):void{
    if(textObject.isEditing){
      const startIndex = textObject.selectionStart;
      const endIndex = textObject.selectionEnd;
      if(startIndex!==endIndex){
        this.utilService.changeToolType(this.toolType,textObject.getSelectionStyles()[0]);
      }
      else{
        this.utilService.changeToolType(this.toolType,{
          isSelectionInactive:true
        });
      }
    }
  }

  onAddText():void {
    
    const textObject = new fabric.IText(this.defaultTextProps['text'], {
      left: 10,
      top: 10,
      angle: 0,
      fontFamily: this.defaultTextProps['fontFamily'],
      fontSize:this.defaultTextProps['fontSize'],
      fontWeight: this.defaultTextProps['fontWeight'],
      fontStyle: this.defaultTextProps['fontStyle'],
      fill: this.defaultTextProps['color'],
      opacity : this.defaultTextProps['opacity'],
      underline: this.defaultTextProps['underline'],
      linethrough: this.defaultTextProps['linethrough'],
      textAlign: this.defaultTextProps['textAlign'],
      hasRotatingPoint: true,
      lockScalingX:true,
      lockScalingY:true,
    });
    this.extend(textObject, this.randomId());
    this.cv.add(textObject);
    this.selectItemAfterAdded(textObject);
  }

  onUpdateText(textProps : any):void{
    
    if(this.activeObjectType==='i-text'){
      this.activeObject.set('fontFamily',textProps.fontFamily);
      this.activeObject.set('fontSize',textProps.fontSize);
      this.activeObject.set('fontWeight',textProps.fontWeight);
      this.activeObject.set('fontStyle', textProps.fontStyle);
      this.activeObject.set('fill',textProps.color);
      this.activeObject.set('opacity',textProps.opacity);
      this.activeObject.set('underline',textProps.underline);
      this.activeObject.set('linethrough',textProps.linethrough);
      this.activeObject.set('textAlign',textProps.textAlign);
      this.activeObject.set('lineHeight',textProps.lineHeight);
      this.activeObject.set('charSpacing',textProps.charSpacing);
    }
    this.cv.renderAll();
  }

  onUpdateTextEditing(textProps : any):void{
    
    if(this.activeObjectType==='i-text'){
      if( this.activeObject.isEditing ){
        this.activeObject.setSelectionStyles(textProps);
      }
    }
    this.cv.renderAll();
  }


  applyFilterOnSingle(filterProps:any):void{
    
    if(this.activeObjectType === 'image'){
      this.activeObject.filters = this.generateFilterArray(filterProps);
      this.activeObject.applyFilters();
      this.cv.renderAll();
    }
  }

  applyFilterOnAll(filterProps:any):void{
    
    this.globalFilterValues = filterProps;
    const globalFilter = this.generateFilterArray(filterProps);
    this.cv.forEachObject((object : any)=>{
      if(object.type === 'image'){
        object.filters = globalFilter;
        object.applyFilters();
      }
    })
    this.cv.renderAll();
  }

  getActiveFilter(imageObject : any){
    let activeFilter = {
      brightness:0,
      contrast:0,
      saturation:0,
      hue:0,
      noise:0,
      blur:0,
      pixelate:0,
      sharpen:false,
      emboss:false,
      grayscale:false,
      vintage:false,
      sepia:false,
      polaroid:false
    };
    imageObject.filters.map((filter: any)=>{
      switch (filter.type) {
        case 'Brightness':
          activeFilter = {...activeFilter,brightness:filter.brightness}  
          break;
        case 'Contrast':
          activeFilter = {...activeFilter,contrast:filter.contrast}  
          break;
        case 'Saturation':
          activeFilter = {...activeFilter,saturation:filter.saturation}  
          break;
        case 'HueRotation':
          activeFilter = {...activeFilter,hue:filter.rotation}  
          break;
        case 'Noise':
          activeFilter = {...activeFilter,noise:filter.noise}  
          break;
        case 'Blur':
          activeFilter = {...activeFilter,blur:filter.blur}  
          break;
        case 'Pixelate':
          activeFilter = {...activeFilter,pixelate:filter.blocksize}  
          break;
        case 'Grayscale':
          activeFilter = {...activeFilter,grayscale:true}  
          break;
        case 'Vintage':
          activeFilter = {...activeFilter,vintage:true}  
          break;
        case 'Sepia':
          activeFilter = {...activeFilter,sepia:true}  
          break;
        case 'Polaroid':
          activeFilter = {...activeFilter,polaroid:true}  
          break;
        case 'Convolute':
          const sharpenMatrix = [0, -1, 0, -1, 5, -1, 0, -1, 0];
          const embossMatrix = [1, 1, 1, 1, 0.7, -1, -1, -1, -1];

          if (JSON.stringify(filter.matrix) === JSON.stringify(sharpenMatrix)) {
            activeFilter = { ...activeFilter, sharpen: true };
          }

          if (JSON.stringify(filter.matrix) === JSON.stringify(embossMatrix)) {
            activeFilter = { ...activeFilter, emboss: true };
          }

          break;         
        default:
        break;
      }
    })
    return activeFilter;
  }
  onSelectImage(imageObject : any):void{
    this.utilService.changeToolType('FILTER:SINGLE',this.getActiveFilter(imageObject));
  }

  ngOnDestroy(){
     if (this.cv) {
      this.cv.off(); // ✅ Removes all event listeners to prevent memory leaks
      this.cv.dispose(); // ✅ Properly dispose of the Fabric.js instance
    }
    this.addImageSubscription.unsubscribe();
    this.addImageFilterSubscription.unsubscribe();
    this.onUpdateTextSubscription.unsubscribe();
    this.onUpdateShapeMaskSubscription.unsubscribe();
    this.canvasCommandSubscription.unsubscribe();
  }

}
