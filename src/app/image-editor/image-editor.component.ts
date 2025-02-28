import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { UtilService } from './util.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-image-editor',
  templateUrl: './image-editor.component.html',
  styleUrls: ['./image-editor.component.css'],
  standalone: false
})
export class ImageEditorComponent implements OnInit {
  // ------------------------------- subscribtion ------------------------------
  private openSnackBarSubscription:Subscription;
  
  constructor( private utilService: UtilService, private snackBar: MatSnackBar ) { 
    this.openSnackBarSubscription = utilService.openSnackBar$.subscribe(
      (({message,duration})=>{
        this.snackBar.open(message,undefined,{
          duration: duration
        });
      })
    );
  }

  ngOnInit() { }

  ngOnDestroy(){
    this.openSnackBarSubscription.unsubscribe();
  }

}
