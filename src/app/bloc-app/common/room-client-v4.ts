import { mediaTypeV2, _EVENTSV2 } from "./room-client-v2";
import { types as mediasoupTypes } from "mediasoup-client";
import * as _mediasoupClient from "mediasoup-client";
export class RoomClientV4 {
  _socket;
  _room_id;
  _successCallback;
  _consumers: Map<string, mediasoupTypes.Consumer>;
  _producers: Map<string, mediasoupTypes.Producer>;
  _device: mediasoupTypes.Device;
  _producerTransport: mediasoupTypes.Transport;
  _consumerTransport: mediasoupTypes.Transport;
  _eventListeners;
  _producerLabel: Map<string, string>;
  _navigator: any = navigator;
  constructor(socket, room_id) {
    this._socket = socket;
    this._room_id = room_id;
    this._consumers = new Map()
    this._producers = new Map()
    this._producerLabel = new Map()
    this._device = null;
    this._producerTransport = null;
    this._consumerTransport = null;
    this._eventListeners = new Map();
    Object.keys(_EVENTSV2).forEach((evt) => {
      this._eventListeners.set(evt, [])
    })

    this._socket.request('getRoomInfo', {
      room_id
    }).then(async x => {
      if (x == null) {
        this.createRoom(room_id).then(async () => {
          await this.join(room_id)
          this.initSockets()
        })
      } else {
        let roomCount = JSON.parse(x.peers).length;
        if (roomCount >= 4) {
          alert('房间人数已满');
          return;
        } else {
          await this.join(room_id)
          this.initSockets()
        }
      }
    }).catch(err => {
      console.log(err)
    })
  }


  initSockets() {
    this._socket.on('consumerClosed', ({
      consumer_id
    }) => {
      console.log('closing consumer:', consumer_id)
      this.removeConsumer(this._consumers.get(consumer_id))
    });

    this._socket.on('newProducers', async (data) => {
      console.log('new producers', data)
      for (let {
        producer_id
      } of data) {
        await this.consume(producer_id)
      }
    });


    this._socket.on('roomUpdate', async (data) => {
      this.event_arg(_EVENTSV2.roomUpdate, data);
    });

    this._socket.on('disconnect', () => {
      this.exit(true)
    })

    

  }

  async join(room_id) {
    this._socket.request('join', {
      room_id
    }).then(async (e) => {
      console.log(e)
      const data = await this._socket.request('getRouterRtpCapabilities');
      let device = await this.loadDevice(data)
      this._device = device
      await this.initTransports(device)
      this._socket.emit('getProducers')
      this.event_arg(_EVENTSV2.selfUpdate, JSON.parse(e.peer));
      // this.event(_EVENTSV2.canStart);
      // await this.produce(mediaTypeV2.audio, this.audioDeviceId);
    }).catch(e => {
      console.log(e)
    })
  }

  async loadDevice(routerRtpCapabilities): Promise<mediasoupTypes.Device> {
    let device: mediasoupTypes.Device;
    try {
      device = new _mediasoupClient.Device();
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



  async initTransports(device: mediasoupTypes.Device) {

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

      this._producerTransport.on('connect', async ({
        dtlsParameters
      }, callback, errback) => {
        this._socket.request('connectTransport', {
          dtlsParameters,
          transport_id: data.id
        })
          .then(callback)
          .catch(errback)
      });

      this._producerTransport.on('produce', async ({
        kind,
        rtpParameters
      }, callback, errback) => {
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
      })

      this._producerTransport.on('connectionstatechange', (state) => {
        switch (state) {
          case 'connecting':

            break;

          case 'connected':
            //localVideo.srcObject = stream
            break;

          case 'failed':
            this._producerTransport.close();
            break;

          default:
            break;
        }
      });
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
      this._consumerTransport.on('connect', ({
        dtlsParameters
      }, callback, errback) => {
        this._socket.request('connectTransport', {
          transport_id: this._consumerTransport.id,
          dtlsParameters
        })
          .then(callback)
          .catch(errback);
      });

      this._consumerTransport.on('connectionstatechange', async (state) => {
        switch (state) {
          case 'connecting':
            break;

          case 'connected':

            //remoteVideo.srcObject = await stream;
            //await socket.request('resume');
            break;

          case 'failed':
            this._consumerTransport.close();
            break;

          default:
            break;
        }
      });
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
      this.newProducer(producer, stream, audio);

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

    const consumer = await this._consumerTransport.consume({
      id,
      producerId,
      kind,
      rtpParameters,
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

    this.getConsumeStream(producer_id).then(({
      consumer,
      stream,
      kind
    }) => {
      console.log(consumer, stream);
      this._consumers.set(consumer.id, consumer)

      if (kind === 'video') {
        this.newConsumer(consumer, stream, true);
      } else {
        this.newConsumer(consumer, stream, false);
      }

      consumer.on('trackended', () => {
        this.removeConsumer(consumer.id)
      })
      consumer.on('transportclose', () => {
        this.removeConsumer(consumer.id)
      })



    })
  }


  exit(offline = false) {


    let clean = () => {
      this._consumerTransport.close()
      this._producerTransport.close()
      this._socket.off('disconnect')
      this._socket.off('newProducers')
      this._socket.off('consumerClosed')
    }

    if (!offline) {
      this._socket.request('exitRoom').then(e => console.log(e)).catch(e => console.warn(e)).finally(() => {
        clean()
      })
    } else {
      clean()
    }

    this.event(_EVENTSV2.exitRoom)

  }

  removeConsumer(consumer) {
    this.event_arg(_EVENTSV2.removeConsumer, { consumer });
    this._consumers.delete(consumer.id)
  }
  newProducer(producer, stream, audio) {
    this._producers.set(producer.id, producer);
    if (stream && !audio) {
      this.event_arg(_EVENTSV2.newProducer, { producer: producer, stream: stream });
    }
  }
  removeProducer(producer, isAudio) {
    this._producers.delete(producer.id);
    if (!isAudio) {
      this.event_arg(_EVENTSV2.removeProducer, { producer });
    }
  }
  newConsumer(consumer, stream, isVideo) {
    this._consumers.set(consumer.id, consumer)
    this.event_arg(_EVENTSV2.newConsumer, { consumer, stream, isVideo });
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