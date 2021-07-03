/*
 * @Descripttion: 
 * @version: 1.0
 * @Author: icxl
 * @Date: 2021-07-03 20:03:48
 * @LastEditors: icxl
 * @LastEditTime: 2021-07-03 20:29:24
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
  removeConsumer:'removeConsumer'
}

export class RoomClientV2 {


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

  removeConsumer(consumer_id) {
    this.event_arg(_EVENTSV2.removeConsumer,consumer_id);
    this._consumers.delete(consumer_id)
  }

  initSockets() {
    this._socket.on('consumerClosed', function ({
      consumer_id
    }) {
      console.log('closing consumer:', consumer_id)
      this.removeConsumer(consumer_id)
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




  event(evt) {
    if (this._eventListeners.has(evt)) {
      this._eventListeners.get(evt).forEach(callback => callback())
    }
  }

  event_arg(evt,arg) {
    if (this._eventListeners.has(evt)) {
      this._eventListeners.get(evt).forEach(callback => callback(arg))
    }
  }

  on(evt, callback) {
    this._eventListeners.get(evt).push(callback)
  }
}
