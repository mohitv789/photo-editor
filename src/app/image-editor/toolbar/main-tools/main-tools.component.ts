import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import {UtilService} from '../../util.service';

@Component({
  selector: 'app-main-tools',
  templateUrl: './main-tools.component.html',
  styleUrls: ['./main-tools.component.css'],
  standalone: false
})
export class MainToolsComponent implements OnInit {

  @Input() selectedToolType : any;
  selectedFile!: File;
  caption: string = "";
  id: string = "";
  fileUrlList!: string;
  @Output() closeSignal: EventEmitter<any> = new EventEmitter();

  onChangeToolType(toolType:string):void{
    this.utilService.changeToolType(toolType,{});
  }

  canvasCommand(toolType:string):void{
    this.utilService.canvasCommand(toolType,{});
  }

  constructor(private utilService: UtilService) { }

  ngOnInit() {
  }

  editPhoto(event:any) {
    this.canvasCommand('DOWNLOAD_CURRENT_CANVAS');
    this.id = this.utilService.uploadedId;
    if (this.utilService.editedImageURL && this.id) {
      let imageformData = new FormData();
      console.log(this.utilService.editedImageURL);

      imageformData.append('image', this.utilService.editedImageURL);
      
    } else {
      console.log("Some Error");

    }
  }
}
