/*
 * @Descripttion: 
 * @version: 1.0
 * @Author: icxl
 * @Date: 2021-07-03 13:34:46
 * @LastEditors: icxl
 * @LastEditTime: 2021-07-03 15:11:23
 */

export class MediasoupHelp {


  /**
   * @Author: icxl
   * @msg: 加载摄像头设备
   * @param {*} mediasoupClient
   * @param {*} routerRtpCapabilities
   * @return {*}
   */
  public static async loadDevice(mediasoupClient, routerRtpCapabilities) {
    let device
    try {
      device = new mediasoupClient.Device();
    } catch (error) {
      if (error.name === 'UnsupportedError') {
        console.error('browser not supported');
      }
      console.error(error)
    }
    await device.load({
      routerRtpCapabilities
    })
    return device
  }

  /**
   * @Author: icxl
   * @msg: createSendTransport
   * @param {*} createWebRtcTransportResponse
   * @return {producerTransport}
   */
  public static async createSendTransport(device, createWebRtcTransportResponse) {
    return device.createSendTransport(createWebRtcTransportResponse);
  }

  /**
   * @Author: icxl
   * @msg: createRecvTransport
   * @param {*} device
   * @param {*} createWebRtcTransportResponse
   * @return {consumerTransport}
   */
  public static async createRecvTransport(device, createWebRtcTransportResponse) {
    return device.createRecvTransport(createWebRtcTransportResponse);
  }

  /**
   * @Author: icxl
   * @msg: 是否可以开启视频
   * @param {*} device
   * @return {*}
   */
  public static async canProduceVideo(device) {
    return device.canProduce('video');
  }

  /**
   * @Author: icxl
   * @msg: 是否可以开启音频
   * @param {*} device
   * @return {*}
   */
  public static async canProduceAudio(device) {
    return device.canProduce('audio');
  }

  /**
   * @Author: icxl
   * @msg: Track
   * @param {0:音频，1:视频，2:桌面分享} streamType
   * @param {*} deviceId
   * @return {*}
   */
  private static async getTrack(streamType, deviceId = null) {
    let mediaConstraints;
    let track;
    let _navigator: any = navigator;

    if (streamType == 1) {
      mediaConstraints = {
        audio: false,
        video: {
          width: {
            min: 640,
            ideal: 1920
          },
          height: {
            min: 400,
            ideal: 1080
          },
          deviceId: deviceId
        }
      }
      track = await _navigator.mediaDevices.getUserMedia(mediaConstraints).getVideoTracks()[0];
    }
    else if (streamType == 0) {
      mediaConstraints = {
        audio: {
          deviceId: deviceId
        },
        video: false
      }
      track = await _navigator.mediaDevices.getUserMedia(mediaConstraints).getAudioTracks()[0];
    }
    else if (streamType == 2) {
      track = _navigator.mediaDevices.getDisplayMedia().getVideoTracks()[0];
    }



  }

  /**
   * @Author: icxl
   * @msg: produceParams
   * @param {0:音频，1:视频，2:桌面分享} streamType
   * @param {*} deviceId
   * @return {produceParams}
   */
  public static async produceParams(streamType, deviceId = null) {
    let track = MediasoupHelp.getTrack(streamType, deviceId);
    let params: any = {
      track
    };
    if (streamType == 1) {
      params.encodings = [{
        rid: 'r0',
        maxBitrate: 100000,
        scalabilityMode: 'S1T3'
      },
      {
        rid: 'r1',
        maxBitrate: 300000,
        scalabilityMode: 'S1T3'
      },
      {
        rid: 'r2',
        maxBitrate: 900000,
        scalabilityMode: 'S1T3'
      }
      ];
      params.codecOptions = {
        videoGoogleStartBitrate: 1000
      };
    }

    return params;

  }

  /**
   * @Author: icxl
   * @msg: 消费流获取MediaStream
   * @param {*} consumerTransport
   * @param {*} consumeId
   * @param {*} producerId
   * @param {*} kind
   * @param {*} rtpParameters
   * @return {consumer,stream,kind}
   */
  public static async consume(consumerTransport, consumeId, producerId, kind, rtpParameters) {
    let codecOptions = {};
    const consumer = consumerTransport.consume({
      consumeId,
      producerId,
      kind,
      rtpParameters,
      codecOptions,
    });
    const stream = new MediaStream();
    stream.addTrack(consumer.track);
    return {
      consumer,
      stream,
      kind
    };
  }

  pauseProducer(producer) {
    producer.pause();
  }

  resumeProducer(producer) {
    producer.resume();
  }


}
