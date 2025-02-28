import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-menubar',
  templateUrl: './menubar.component.html',
  styleUrls: ['./menubar.component.css'],
  standalone: false
})
export class MenubarComponent implements OnInit {

  projectName: string;

  constructor() { }

  ngOnInit() {
    this.projectName = "New Project"
  }

}
