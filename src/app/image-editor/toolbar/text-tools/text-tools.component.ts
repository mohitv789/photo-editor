import { Component, OnInit, Input } from '@angular/core';
import {UtilService} from '../../util.service';

@Component({
  selector: 'app-text-tools',
  templateUrl: './text-tools.component.html',
  styleUrls: ['./text-tools.component.css'],
  standalone: false
})
export class TextToolsComponent implements OnInit {

  @Input() selectedToolType;
  @Input() activeObjectProps;
  activeObject: any;
  color:string;
  opacity:number;
  fontFamily:string;
  fontSize:number;
  fontWeight:string;
  fontStyle:string;
  underline:boolean;
  linethrough:boolean;
  textAlign:string;
  lineHeight:number;
  charSpacing:number;

  isSelectionInactive:boolean;

  fontList = ['Roboto','Alegreya Sans'];

  onObjectSelected(event: any) {
    if (event.target && event.target.type === 'text') {
      this.isSelectionInactive = false;
      this.fontSize = event.target.fontSize;
      this.fontFamily = event.target.fontFamily;
      this.fontWeight = event.target.fontWeight;
      this.fontStyle = event.target.fontStyle;
      this.underline = event.target.underline;
      this.linethrough = event.target.linethrough;
      this.textAlign = event.target.textAlign;
      this.color = event.target.fill;
      this.lineHeight = event.target.lineHeight;
    } else {
      this.isSelectionInactive = true;
    }
  }
  // onUpdateText():void{
  //   if(this.selectedToolType === 'TEXT'){
  //     this.utilService.onUpdateText(
  //       {
  //         color: this.color,
  //         opacity: this.opacity,
  //         fontFamily:this.fontFamily,
  //         fontSize:this.fontSize,
  //         fontWeight:this.fontWeight,
  //         fontStyle:this.fontStyle,
  //         underline:this.underline,
  //         linethrough:this.linethrough,
  //         textAlign:this.textAlign,
  //         lineHeight:this.lineHeight,
  //         charSpacing:this.charSpacing
  //       }
  //     )
  //   }
  //   else if( this.selectedToolType === 'TEXT:EDITING' ){
  //     this.utilService.onUpdateText(
  //       {
  //         fill: this.color,
  //         fontFamily:this.fontFamily,
  //         fontSize:this.fontSize,
  //         fontWeight:this.fontWeight,
  //         fontStyle:this.fontStyle,
  //         underline:this.underline,
  //         linethrough:this.linethrough,
  //       }
  //     )
  //   }
  // }

  onUpdateText() {
    if (!this.activeObject || this.activeObject.type !== 'text') return;
  
    this.activeObject.set({
      fontFamily: this.fontFamily,
      fontWeight: this.fontWeight,
      fontStyle: this.fontStyle,
      underline: this.underline,
      linethrough: this.linethrough,
      textAlign: this.textAlign,
      fill: this.color,
      opacity: this.opacity,
      fontSize: this.fontSize,
      lineHeight: this.lineHeight,
    });
  }
  
  
  toggleBold():void{
    this.fontWeight = this.fontWeight === 'normal'? 'bold' : 'normal';
    this.onUpdateText();
  }

  toggleItalic():void{
    this.fontStyle = this.fontStyle === 'normal'? 'italic' : 'normal';
    this.onUpdateText();
  }

  toggleUnderline():void{
    this.underline = !this.underline;
    this.onUpdateText();
  }

  toggleLinethrough():void{
    this.linethrough = !this.linethrough;
    this.onUpdateText();
  }

  setTextAlign(alignment):void{
    this.textAlign = alignment;
    this.onUpdateText();
  }

  constructor(private utilService:UtilService) { 
  }

  ngOnInit() {
    if(this.activeObjectProps && this.selectedToolType === 'TEXT'){
      this.color = this.activeObjectProps.color;
      this.opacity = this.activeObjectProps.opacity;
      this.fontFamily = this.activeObjectProps.fontFamily;
      this.fontSize = this.activeObjectProps.fontSize;
      this.fontStyle = this.activeObjectProps.fontStyle;
      this.underline = this.activeObjectProps.underline;
      this.linethrough = this.activeObjectProps.linethrough;
      this.textAlign = this.activeObjectProps.textAlign;
      this.lineHeight = this.activeObjectProps.lineHeight;
      this.charSpacing = this.activeObjectProps.charSpacing;
    }

    this.isSelectionInactive = false;
  }

  ngOnChanges(){
    if( this.activeObjectProps && this.selectedToolType === 'TEXT' ){
      this.color = this.activeObjectProps.color;
      this.opacity = this.activeObjectProps.opacity;
      this.fontFamily = this.activeObjectProps.fontFamily;
      this.fontWeight = this.activeObjectProps.fontWeight;
      this.fontSize = this.activeObjectProps.fontSize;
      this.fontStyle = this.activeObjectProps.fontStyle;
      this.underline = this.activeObjectProps.underline;
      this.linethrough = this.activeObjectProps.linethrough;
      this.textAlign = this.activeObjectProps.textAlign;
      this.lineHeight = this.activeObjectProps.lineHeight;
      this.charSpacing = this.activeObjectProps.charSpacing;
    }
    else if( this.activeObjectProps && this.selectedToolType === 'TEXT:EDITING' ){
      
      this.color = this.activeObjectProps['fill'] || '#7F7F7F';
      this.fontFamily = this.activeObjectProps['fontFamily'] || 'Roboto';
      this.fontSize = this.activeObjectProps['fontSize'] || 24;
      this.fontWeight = this.activeObjectProps['fontWeight'] || 'normal';
      this.fontStyle = this.activeObjectProps['fontStyle'] || 'normal';
      this.underline = this.activeObjectProps['underline'] || false;
      this.linethrough = this.activeObjectProps['linethrough'] || false;

      this.isSelectionInactive = this.activeObjectProps.isSelectionInactive || false;
    }
  }

}
