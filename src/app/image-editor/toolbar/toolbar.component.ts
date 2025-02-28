import { Component, OnInit } from '@angular/core';
import {UtilService} from '../util.service'


import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css'],
  standalone: false
})
export class ToolbarComponent implements OnInit {
  
  selectedToolTypeList:string[] = [
    'MAIN',
    'TEXT',
    'TEXT:EDITING',
    'CROP',
    'PREVIEW',
    'FILTER:ALL',
    'FILTER:SINGLE',
    'SHAPE_MASK',
    'PEN',
    'DEACTIVATE'
  ];
  selectedToolType:string;
  activeObjectProps:any;
  selection:any;
  selectionType:string;

  // ---------------------------- Subscription ------------------------------
  onChangeToolTypeSubscription:Subscription;
  onSelectionCreatedSubscription:Subscription;

  onChangeToolType(toolType:string):void {
    this.selectedToolType = toolType;
  }

  cleanSelect(){
    this.utilService.canvasCommand('CLEAN_SELECT',{});
    this.onChangeToolType('MAIN');
  }

  backToMainMenu(){
    this.utilService.canvasCommand('BACK_TO_MAIN_MENU',{});
    this.onChangeToolType('MAIN');
  }

  bringForward(){
    this.utilService.canvasCommand('BRING_FORWARD',{});
  }

  sendBackward(){
    this.utilService.canvasCommand('SEND_BACKWARD',{});
  }

  constructor(private utilService:UtilService) {
      this.selectedToolType = this.selectedToolTypeList[0];
      this.onChangeToolTypeSubscription = utilService.changeToolType$.subscribe(
        ({toolType,activeObjectProps})=>{
          if(activeObjectProps){
              this.activeObjectProps = activeObjectProps;
          }
          this.onChangeToolType(toolType);
        }
      )
      this.onSelectionCreatedSubscription = utilService.onSelectionCreated$.subscribe(
        ({selection,selectionType}) => {
          this.selectionType = selectionType;
          this.selection = selection;
        }
      )
   }

  ngOnInit() {
  }

  ngOnDestroy(){
    this.onChangeToolTypeSubscription.unsubscribe();
    this.onSelectionCreatedSubscription.unsubscribe();
  }

}
