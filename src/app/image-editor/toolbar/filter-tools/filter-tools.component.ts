import { Component, OnInit, Input } from '@angular/core';
import {UtilService} from '../../util.service';

@Component({
  selector: 'app-filter-tools',
  templateUrl: './filter-tools.component.html',
  styleUrls: ['./filter-tools.component.css'],
  standalone: false
})
export class FilterToolsComponent implements OnInit {

  @Input() selectedToolType: any;
  @Input() activeObjectProps: any;

  filterScope!:string;
  panelType:string;
  filterValues:any;

  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 1000) + 'k';
    }

    return `${value}`;
  }
  onPanelChange(panelType:string):void{
    this.panelType = panelType;
  }

  toggleScope(filterScope: any){
    this.filterScope = filterScope;
    if(this.filterScope === 'ALL'){
      this.utilService.canvasCommand('FILTER:ALL',{});
    }
  }

  togglePreset(presetType: any):void{
    this.filterValues = {...this.filterValues,[`${presetType}`]:!this.filterValues[`${presetType}`]}
    this.onFilterUpdate();
  }

  onFilterUpdate():void{
    this.utilService.addImageFilter(this.filterScope,this.filterValues);
  }

  onSetToDefault(filterType:string):void{
    switch (filterType) {
      case 'brightness':
        this.filterValues = {...this.filterValues,brightness:0};
        break;
      case 'contrast':
        this.filterValues = {...this.filterValues,contrast:0};
        break;
      case 'saturation':
        this.filterValues = {...this.filterValues,saturation:0};
        break;
      case 'hue':
        this.filterValues = {...this.filterValues,hue:0};
        break;
      case 'noise':
        this.filterValues = {...this.filterValues,noise:0};
        break;
      case 'blur':
        this.filterValues = {...this.filterValues,blur:0};
        break;
      case 'pixelate':
        this.filterValues = {...this.filterValues,pixelate:0};
        break;
      default:
        break;
    }
    this.onFilterUpdate();
  }

  constructor(private utilService:UtilService) {
    this.panelType = 'PRESET';
  }

  ngOnInit() {
    this.filterScope = this.filterScope;
    this.filterValues = this.activeObjectProps;
  }

  ngOnChanges(){
    if(this.selectedToolType === 'FILTER:ALL'){
      this.filterScope = 'ALL'
    }
    else if(this.selectedToolType === 'FILTER:SINGLE'){
      this.filterScope = 'SINGLE'
    }

    this.filterValues = this.activeObjectProps;
  }
}
