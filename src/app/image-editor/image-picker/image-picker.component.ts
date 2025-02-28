import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { UtilService } from '../util.service';

@Component({
  selector: 'app-image-picker',
  templateUrl: './image-picker.component.html',
  styleUrls: ['./image-picker.component.css'],
  standalone: false
})
export class ImagePickerComponent implements OnInit {

  fileInputElement: any;
  fileUrlList: string[] = [];
  loadingFiles: boolean;  //add loader while files is being loaded
  selection:any;
  index: number;
  orientation: string; 

  // ---------------------------- Subscription ------------------------------
  onSelectionCreatedSubscription:Subscription;
  
  onUploadButtonTrigger():void{
    this.fileInputElement.click();
  }

  onUpload(event: any): void {
    if (event.target.files) {
      for (let i = 0; i < event.target.files.length; i++) {
        const file = event.target.files[i];  // Correctly assign file
        const reader = new FileReader();
  
        reader.onload = (e: any) => {
          this.fileUrlList = [...this.fileUrlList, e.target.result];
        };
  
        reader.readAsDataURL(file);
      }
    }
  }
  

  onClearByIndex(indexToRemove:number):void{
    this.fileUrlList = this.fileUrlList.filter(
      (url,index) => index !== indexToRemove
    )
  }

  onClearAll(){
    this.fileUrlList = [];
  }

  onRemoveObjectFromCanvas(){
    this.utilService.canvasCommand('DELETE',{});
  }

  addImageOnCanvas(url:string):void{
    this.utilService.addImageToCanvas(url);
  }

  changeAspectRatio(index: number){
    this.index = index;
    this.utilService.changeCanvasSize(this.orientation,index);
  }
  
  changeOrientation(orientation: string){
    this.orientation = orientation;
    this.utilService.changeCanvasSize(orientation,this.index);
  }

  constructor(private utilService: UtilService ) {
    this.selection = undefined;
    this.onSelectionCreatedSubscription = utilService.onSelectionCreated$.subscribe(
      ({selection}) => {
        this.selection = selection;
      }
    )

    this.index = 1;
    this.orientation = 'LANDSCAPE';
   }

  ngOnInit() {
    this.fileInputElement = document.getElementById('upload-file-input');
  }

  ngOnDestroy(){
    this.onSelectionCreatedSubscription.unsubscribe();
  }

}
