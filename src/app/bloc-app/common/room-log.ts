let datep: any = Date.prototype;
datep.format = function (format) {
  var o = {
    "M+": this.getMonth() + 1, //month
    "d+": this.getDate(),    //day
    "h+": this.getHours(),   //hour
    "m+": this.getMinutes(), //minute
    "s+": this.getSeconds(), //second
    "q+": Math.floor((this.getMonth() + 3) / 3),  //quarter
    "S": this.getMilliseconds() //millisecond
  }
  if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
    (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o) if (new RegExp("(" + k + ")").test(format))
    format = format.replace(RegExp.$1,
      RegExp.$1.length == 1 ? o[k] :
        ("00" + o[k]).substr(("" + o[k]).length));
  return format;
}
export class RoomLog {

  public static InfoLog(obj) {
    let date: any = new Date();
    console.log(date.format('yyyy-MM-dd hh:mm:ss'), obj);
  }


  public static ErrorLog(obj) {
    let date: any = new Date();
    console.error(date.format('yyyy-MM-dd hh:mm:ss'), obj);
  }
}
