/*
 * @Descripttion: 
 * @version: 1.0
 * @Author: icxl
 * @Date: 2021-07-03 20:03:48
 * @LastEditors: icxl
 * @LastEditTime: 2021-07-08 12:27:21
 */
export const mediaTypeV2 = {
  audio: 'audioType',
  video: 'videoType',
  screen: 'screenType'
}
export const _EVENTSV2 = {
  exitRoom: 'exitRoom',
  openRoom: 'openRoom',
  startVideo: 'startVideo',
  stopVideo: 'stopVideo',
  startAudio: 'startAudio',
  stopAudio: 'stopAudio',
  startScreen: 'startScreen',
  stopScreen: 'stopScreen',

  removeConsumer: 'removeConsumer',
  newConsumer: 'newConsumer',
  removeProducer: 'removeProducer',
  newProducer: 'newProducer',
  roomUpdate: 'roomUpdate',
  selfUpdate: 'selfUpdate',
  canStart:'canStart'
}

export class RoomClientV2 {


  _mediasoupClient;
  _socket;
  _room_id;
  _name;
  _successCallback;
  _consumers: Map<any, any>;
  _producers: Map<any, any>;
  _device;
  _producerTransport;
  _consumerTransport;
  _eventListeners;
  _producerLabel;
  _navigator: any = navigator;
  constructor(mediasoupClient, socket, room_id, name) {
    this._mediasoupClient = mediasoupClient;
    this._socket = socket;
    this._room_id = room_id;
    this._name = name;
    this._consumers = new Map()
    this._producers = new Map()
    this._producerLabel = new Map()
    this._device = null;
    this._producerTransport = null;
    this._consumerTransport = null;
    this._eventListeners = new Map()
    Object.keys(_EVENTSV2).forEach(function (evt) {
      this._eventListeners.set(evt, [])
    }.bind(this))
    this.createRoom(room_id).then(async function () {
      await this.join(name, room_id)
      this.initSockets()
    }.bind(this))
  }


  initSockets() {
    this._socket.on('consumerClosed', function ({
      consumer_id
    }) {
      console.log('closing consumer:', consumer_id)
      this.removeConsumer(this._consumers.get(consumer_id))
    }.bind(this))
    this._socket.on('newProducers', async function (data) {
      console.log('new producers', data)
      for (let {
        producer_id
      } of data) {
        await this.consume(producer_id)
      }
    }.bind(this))

    this._socket.on('disconnect', function () {
      this.exit(true)
    }.bind(this))
  }

  async join(name, room_id) {
    this._socket.request('join', {
      name,
      room_id
    }).then(async function (e) {
      console.log(e)
      const data = await this._socket.request('getRouterRtpCapabilities');
      let device = await this.loadDevice(data)
      this._device = device
      await this.initTransports(device)
      this._socket.emit('getProducers')
    }.bind(this)).catch(e => {
      console.log(e)
    })
  }

  async loadDevice(routerRtpCapabilities) {
    let device
    try {
      device = new this._mediasoupClient.Device();
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



  async initTransports(device) {

    // init producerTransport
    {
      const data = await this._socket.request('createWebRtcTransport', {
        forceTcp: false,
        rtpCapabilities: device.rtpCapabilities,
      })
      if (data.error) {
        console.error(data.error);
        return;
      }

      this._producerTransport = device.createSendTransport(data);

      this._producerTransport.on('connect', async function ({
        dtlsParameters
      }, callback, errback) {
        this._socket.request('connectTransport', {
          dtlsParameters,
          transport_id: data.id
        })
          .then(callback)
          .catch(errback)
      }.bind(this));

      this._producerTransport.on('produce', async function ({
        kind,
        rtpParameters
      }, callback, errback) {
        try {
          const {
            producer_id
          } = await this._socket.request('produce', {
            producerTransportId: this._producerTransport.id,
            kind,
            rtpParameters,
          });
          callback({
            id: producer_id
          });
        } catch (err) {
          errback(err);
        }
      }.bind(this))

      this._producerTransport.on('connectionstatechange', function (state) {
        switch (state) {
          case 'connecting':

            break;

          case 'connected':
            //localVideo.srcObject = stream
            break;

          case 'failed':
            this.producerTransport.close();
            break;

          default:
            break;
        }
      }.bind(this));
    }

    // init consumerTransport
    {
      const data = await this._socket.request('createWebRtcTransport', {
        forceTcp: false,
      });
      if (data.error) {
        console.error(data.error);
        return;
      }

      // only one needed
      this._consumerTransport = device.createRecvTransport(data);
      this._consumerTransport.on('connect', function ({
        dtlsParameters
      }, callback, errback) {
        this._socket.request('connectTransport', {
          transport_id: this._consumerTransport.id,
          dtlsParameters
        })
          .then(callback)
          .catch(errback);
      }.bind(this));

      this._consumerTransport.on('connectionstatechange', async function (state) {
        switch (state) {
          case 'connecting':
            break;

          case 'connected':
            
            //remoteVideo.srcObject = await stream;
            //await socket.request('resume');
            break;

          case 'failed':
            this.consumerTransport.close();
            break;

          default:
            break;
        }
      }.bind(this));
    }

  }


  async createRoom(room_id) {
    await this._socket.request('createRoom', {
      room_id
    }).catch(err => {
      console.log(err)
    })
  }





  async produce(type, deviceId = null) {
    let mediaConstraints = {}
    let audio = false
    let screen = false
    switch (type) {
      case mediaTypeV2.audio:
        mediaConstraints = {
          audio: {
            deviceId: deviceId
          },
          video: false
        }
        audio = true
        break
      case mediaTypeV2.video:
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
            /*aspectRatio: {
                ideal: 1.7777777778
            }*/
          }
        }
        break
      case mediaTypeV2.screen:
        mediaConstraints = false
        screen = true
        break;
      default:
        return
        break;
    }
    if (!this._device.canProduce('video') && !audio) {
      console.error('cannot produce video');
      return;
    }
    if (this._producerLabel.has(type)) {
      console.log('producer already exists for this type ' + type)
      return
    }
    console.log('mediacontraints:', mediaConstraints)
    let stream;
    try {
      stream = screen ? await this._navigator.mediaDevices.getDisplayMedia() : await this._navigator.mediaDevices.getUserMedia(mediaConstraints)
      console.log(this._navigator.mediaDevices.getSupportedConstraints())


      const track = audio ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0]
      const params: any = {
        track
      };
      if (!audio && !screen) {
        params.encodings = [{
          rid: 'r0',
          maxBitrate: 100000,
          //scaleResolutionDownBy: 10.0,
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
      let producer = await this._producerTransport.produce(params)

      console.log('producer', producer)
      this.newProducer(producer, stream,audio);

      producer.on('trackended', () => {
        this.closeProducer(type)
      })

      producer.on('transportclose', () => {
        console.log('producer transport close')
        this.removeProducer(producer, audio);
      })

      producer.on('close', () => {
        console.log('closing producer')
        this.removeProducer(producer, audio);
      })

      this._producerLabel.set(type, producer.id)

      switch (type) {
        case mediaTypeV2.audio:
          this.event(_EVENTSV2.startAudio)
          break
        case mediaTypeV2.video:
          this.event(_EVENTSV2.startVideo)
          break
        case mediaTypeV2.screen:
          this.event(_EVENTSV2.startScreen)
          break;
        default:
          return
          break;
      }
    } catch (err) {
      console.log(err)
    }
  }
  closeProducer(type) {
    if (!this._producerLabel.has(type)) {
      console.log('there is no producer for this type ' + type)
      return
    }
    let producer_id = this._producerLabel.get(type)
    console.log(producer_id)
    this._socket.emit('producerClosed', {
      producer_id
    })

    this._producerLabel.delete(type)
    let producer = this._producers.get(producer_id);
    producer.close();
    this.removeProducer(producer, type == mediaTypeV2.audio);

    switch (type) {
      case mediaTypeV2.audio:
        this.event(_EVENTSV2.stopAudio)
        break
      case mediaTypeV2.video:
        this.event(_EVENTSV2.stopVideo)
        break
      case mediaTypeV2.screen:
        this.event(_EVENTSV2.stopScreen)
        break;
      default:
        return
        break;
    }

  }
  async getConsumeStream(producerId) {
    const {
      rtpCapabilities
    } = this._device
    const data = await this._socket.request('consume', {
      rtpCapabilities,
      consumerTransportId: this._consumerTransport.id, // might be 
      producerId
    });
    const {
      id,
      kind,
      rtpParameters,
    } = data;

    let codecOptions = {};
    const consumer = await this._consumerTransport.consume({
      id,
      producerId,
      kind,
      rtpParameters,
      codecOptions,
    })
    const stream = new MediaStream();
    stream.addTrack(consumer.track);
    return {
      consumer,
      stream,
      kind
    }
  }
  async consume(producer_id) {

    //let info = await roomInfo()

    this.getConsumeStream(producer_id).then(function ({
      consumer,
      stream,
      kind
    }) {
      console.log(consumer,stream);
      this._consumers.set(consumer.id, consumer)

      if (kind === 'video') {
       this.newConsumer(consumer,stream,true);
      } else {
        this.newConsumer(consumer,stream,false);
      }

      consumer.on('trackended', function () {
        this.removeConsumer(consumer.id)
      }.bind(this))
      consumer.on('transportclose', function () {
        this.removeConsumer(consumer.id)
      }.bind(this))



    }.bind(this))
  }


  exit(offline = false) {
    

    let clean = function () {
        this._consumerTransport.close()
        this._producerTransport.close()
        this._socket.off('disconnect')
        this._socket.off('newProducers')
        this._socket.off('consumerClosed')
    }.bind(this)

    if (!offline) {
        this._socket.request('exitRoom').then(e => console.log(e)).catch(e => console.warn(e)).finally(function () {
            clean()
        }.bind(this))
    } else {
        clean()
    }

    this.event(_EVENTSV2.exitRoom)

}

  removeConsumer(consumer) {
    this.event_arg(_EVENTSV2.removeConsumer, {consumer});
    this._consumers.delete(consumer.id)
  }
  newProducer(producer, stream,audio) {
    this._producers.set(producer.id, producer);
    if (stream && !audio) {
      this.event_arg(_EVENTSV2.newProducer, { producer: producer, stream: stream });
    }
  }
  removeProducer(producer, isAudio) {
    this._producers.delete(producer.id);
    if (!isAudio) {
      this.event_arg(_EVENTSV2.removeProducer, {producer});
    }
  }
  newConsumer(consumer, stream, isVideo) {
    this._consumers.set(consumer.id, consumer)
    this.event_arg(_EVENTSV2.newConsumer, {consumer,stream, isVideo});
  }


  event(evt) {
    if (this._eventListeners.has(evt)) {
      this._eventListeners.get(evt).forEach(callback => callback())
    }
  }

  event_arg(evt, arg) {
    if (this._eventListeners.has(evt)) {
      this._eventListeners.get(evt).forEach(callback => callback(arg))
    }
  }

  on(evt, callback) {
    this._eventListeners.get(evt).push(callback)
  }
}
