import { RoomLog } from "./room-log";

export const mediaType = {
  audio: 'audioType',
  video: 'videoType',
  screen: 'screenType'
}
export const _EVENTS = {
  exitRoom: 'exitRoom',
  openRoom: 'openRoom',
  startVideo: 'startVideo',
  stopVideo: 'stopVideo',
  startAudio: 'startAudio',
  stopAudio: 'stopAudio',
  startScreen: 'startScreen',
  stopScreen: 'stopScreen'
}

export class RoomClient {


  _localMediaEl;
  _remoteVideoEl;
  _remoteAudioEl;
  _mediasoupClient;
  _socket;
  _room_id;
  _name;
  _successCallback;
  _consumers;
  _producers;
  _device;
  _producerTransport;
  _consumerTransport;
  _eventListeners;
  /**
  * map that contains a mediatype as key and producer_id as value
  */
  _producerLabel;

  _navigator: any = navigator;
  constructor(localMediaEl, remoteVideoEl, remoteAudioEl, mediasoupClient, socket, room_id, name, successCallback) {
    this._localMediaEl = localMediaEl;
    this._remoteVideoEl = remoteVideoEl;
    this._remoteAudioEl = remoteAudioEl;
    this._mediasoupClient = mediasoupClient;
    this._socket = socket;
    this._room_id = room_id;
    this._name = name;
    this._successCallback = successCallback;
    this._consumers = new Map()
    this._producers = new Map()
    this._producerLabel = new Map()
    this._device = null;
    this._producerTransport = null;
    this._consumerTransport = null;
    this._eventListeners = new Map()
    Object.keys(_EVENTS).forEach(function (evt) {
      this._eventListeners.set(evt, [])
    }.bind(this))




    this.createRoom(room_id).then(async function () {
      await this.join(name, room_id)
      this.initSockets()
      this._successCallback();
    }.bind(this))
  }




  async createRoom(room_id) {
    await this._socket.request('createRoom', {
      room_id
    }).catch(err => {
      console.log(err)
    })
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



  initSockets() {
    this._socket.on('consumerClosed', function ({
      consumer_id
    }) {
      console.log('closing consumer:', consumer_id)
      this.removeConsumer(consumer_id)
    }.bind(this))

    /**
     * data: [ {
     *  producer_id:
     *  producer_socket_id:
     * }]
     */
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
  async produce(type, deviceId = null) {
    let mediaConstraints = {}
    let audio = false
    let screen = false
    switch (type) {
      case mediaType.audio:
        mediaConstraints = {
          audio: {
            deviceId: deviceId
          },
          video: false
        }
        audio = true
        break
      case mediaType.video:
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
      case mediaType.screen:
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

      this._producers.set(producer.id, producer)

      let elem
      if (!audio) {
        elem = document.createElement('video')
        elem.srcObject = stream
        elem.id = producer.id
        elem.playsinline = false
        elem.autoplay = true
        elem.className = "vid"
        this._localMediaEl.appendChild(elem)
      }

      producer.on('trackended', () => {
        this.closeProducer(type)
      })

      producer.on('transportclose', () => {
        console.log('producer transport close')
        if (!audio) {
          elem.srcObject.getTracks().forEach(function (track) {
            track.stop()
          })
          elem.parentNode.removeChild(elem)
        }
        this._producers.delete(producer.id)

      })

      producer.on('close', () => {
        console.log('closing producer')
        if (!audio) {
          elem.srcObject.getTracks().forEach(function (track) {
            track.stop()
          })
          elem.parentNode.removeChild(elem)
        }
        this._producers.delete(producer.id)

      })

      this._producerLabel.set(type, producer.id)

      switch (type) {
        case mediaType.audio:
          this.event(_EVENTS.startAudio)
          break
        case mediaType.video:
          this.event(_EVENTS.startVideo)
          break
        case mediaType.screen:
          this.event(_EVENTS.startScreen)
          break;
        default:
          return
          break;
      }
    } catch (err) {
      console.log(err)
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

      this._consumers.set(consumer.id, consumer)

      let elem;
      if (kind === 'video') {
        elem = document.createElement('video')
        elem.srcObject = stream
        elem.id = consumer.id
        elem.playsinline = false
        elem.autoplay = true
        elem.className = "vid"
        this._remoteVideoEl.appendChild(elem)
      } else {
        elem = document.createElement('audio')
        elem.srcObject = stream
        elem.id = consumer.id
        elem.playsinline = false
        elem.autoplay = true
        this._remoteVideoEl.appendChild(elem)
      }

      consumer.on('trackended', function () {
        this.removeConsumer(consumer.id)
      }.bind(this))
      consumer.on('transportclose', function () {
        this.removeConsumer(consumer.id)
      }.bind(this))



    }.bind(this))
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
    this._producers.get(producer_id).close()
    this._producers.delete(producer_id)
    this._producerLabel.delete(type)

    if (type !== mediaType.audio) {
      let elem: any = document.getElementById(producer_id)
      elem.srcObject.getTracks().forEach(function (track) {
        track.stop()
      })
      elem.parentNode.removeChild(elem)
    }

    switch (type) {
      case mediaType.audio:
        this.event(_EVENTS.stopAudio)
        break
      case mediaType.video:
        this.event(_EVENTS.stopVideo)
        break
      case mediaType.screen:
        this.event(_EVENTS.stopScreen)
        break;
      default:
        return
        break;
    }

  }


  pauseProducer(type) {
    if (!this._producerLabel.has(type)) {
      console.log('there is no producer for this type ' + type)
      return
    }
    let producer_id = this._producerLabel.get(type)
    this._producers.get(producer_id).pause()

  }

  resumeProducer(type) {
    if (!this._producerLabel.has(type)) {
      console.log('there is no producer for this type ' + type)
      return
    }
    let producer_id = this._producerLabel.get(type)
    this._producers.get(producer_id).resume()

  }

  removeConsumer(consumer_id) {
    let elem: any = document.getElementById(consumer_id)
    elem.srcObject.getTracks().forEach(function (track) {
      track.stop()
    })
    elem.parentNode.removeChild(elem)

    this._consumers.delete(consumer_id)
  }


  exit(offline = false) {

    let clean = function () {
      this._isOpen = false
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
    this.event(_EVENTS.exitRoom)
  }


  async roomInfo() {
    let info = await this._socket.request('getMyRoomInfo')
    return info
  }

  static get mediaType() {
    return mediaType
  }

  event(evt) {
    if (this._eventListeners.has(evt)) {
      this._eventListeners.get(evt).forEach(callback => callback())
    }
  }

  on(evt, callback) {
    this._eventListeners.get(evt).push(callback)
  }

  static get EVENTS() {
    return _EVENTS
  }
}
