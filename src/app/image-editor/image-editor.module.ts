import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { ColorPickerModule } from 'ngx-color-picker';
import { CanvasComponent } from './canvas/canvas.component';
import { ImageEditorComponent } from './image-editor.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { ImagePickerComponent } from './image-picker/image-picker.component';
import { MenubarComponent } from './menubar/menubar.component';
import { MatSliderThumb } from '@angular/material/slider'; 

import { UtilService } from './util.service';
import { MainToolsComponent } from './toolbar/main-tools/main-tools.component';
import { FilterToolsComponent } from './toolbar/filter-tools/filter-tools.component';
import { TextToolsComponent } from './toolbar/text-tools/text-tools.component';
import { CropToolsComponent } from './toolbar/crop-tools/crop-tools.component';
import { ShapeMaskToolsComponent } from './toolbar/shape-mask-tools/shape-mask-tools.component';

@NgModule({
  imports: [
    CommonModule,    
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    FormsModule,
    MatSliderModule,
    ColorPickerModule,
    MatTooltipModule,
    MatSelectModule,
    MatSnackBarModule,
    MatMenuModule,
    MatSliderThumb,
  ],
  declarations: [CanvasComponent, ImageEditorComponent, ToolbarComponent, ImagePickerComponent, MenubarComponent, MainToolsComponent, FilterToolsComponent, TextToolsComponent, CropToolsComponent, ShapeMaskToolsComponent],
  exports:[ImageEditorComponent],
  providers:[UtilService]
})
export class ImageEditorModule {
  
}

