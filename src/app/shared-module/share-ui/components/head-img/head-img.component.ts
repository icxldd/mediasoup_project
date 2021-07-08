import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-head-img',
  templateUrl: './head-img.component.html',
  styleUrls: ['./head-img.component.scss']
})
export class HeadImgComponent implements OnInit {

  headImages: Map<string, string>;
  @Input() value: string | null;
  @Input() isMe:boolean=false;
  @Input() isSpeaker:boolean = false;
  constructor() {
    this.headImages = new Map();
    this.headImages.set('1', 'http://imgs.wantubizhi.com/upload/i_0/T1huMFdJZ3Y2V3VzVloxUEtCaExYZz09/605029614x2240337309_26_0.jpg');
    this.headImages.set('2', 'http://imgs.wantubizhi.com/upload/i_1/T1huMFdJZ3Y2V3VzVloxUEtCaExYZz09/1533264708x1385022343_26_0.jpg');
    this.headImages.set('3', 'http://imgs.wantubizhi.com/upload/i_2/T1huMFdJZ3Y2V3VzVloxUEtCaExYZz09/2723201346x3279619512_26_0.jpg');
    this.headImages.set('4', 'http://imgs.wantubizhi.com/upload/i_1/T1huMFdJZ3Y2V3VzVloxUEtCaExYZz09/1604109836x3532046058_26_0.jpg');
  }


  get url():string{
    return this.headImages.get(this.value);
  }

  ngOnInit() {
  }

}
