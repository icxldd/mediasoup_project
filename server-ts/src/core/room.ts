/*
 * @Descripttion: 
 * @version: 1.0
 * @Author: icxl
 * @Date: 2021-07-06 16:55:18
 * @LastEditors: icxl
 * @LastEditTime: 2021-07-08 13:15:15
 */
import { types as mediasoupTypes } from "mediasoup";
import {
  types,
  version,
  observer,
  createWorker,
  getSupportedRtpCapabilities,
  parseScalabilityMode
} from 'mediasoup'
import { AudioLevelObserver, Consumer, Producer, Transport, WebRtcTransport, Worker } from "mediasoup/lib/types";
import { Peer } from './peer';
import config from '../config';
import { map } from "lodash";

export class Room {

  id: string;
  peers: Map<string, Peer>;
  io: any;
  router: mediasoupTypes.Router | undefined;
  audioLevelObserver: AudioLevelObserver | null = null;
  constructor(room_id: string, worker: Worker, io: any) {
    this.id = room_id;
    this.peers = new Map();
    this.io = io;

    const mediaCodecs = config.mediasoup.router.mediaCodecs;
    worker.createRouter({
      mediaCodecs
    }).then(async (router) => {
      this.router = router
      this.audioLevelObserver = await this.router.createAudioLevelObserver({ maxEntries: 1, threshold: -65, interval: 800 });
      this.audioLevelObserver.on("volumes", (volumes) => {
        const { producer, volume } = volumes[0];
        this.broadCastAll("activeSpeaker", {
          peerId: producer.appData.peerId,
          volume: volume
        });
      });
    });
  }
  addPeer(peer: Peer) {
    this.peers.set(peer.id, peer)
  }

  getProducerListForPeer(socket_id: string) {
    let producerList: any = []
    this.peers.forEach(peer => {
      peer.producers.forEach(producer => {
        producerList.push({
          producer_id: producer.id
        })
      })
    })
    return producerList
  }

  getRtpCapabilities() {
    return this.router?.rtpCapabilities
  }

  async createWebRtcTransport(socket_id: string) {
    const {
      maxIncomingBitrate,
      initialAvailableOutgoingBitrate
    } = config.mediasoup.webRtcTransport;

    const transport = <WebRtcTransport>await this.router?.createWebRtcTransport({
      listenIps: config.mediasoup.webRtcTransport.listenIps,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate,
    });
    if (maxIncomingBitrate) {
      try {
        await transport?.setMaxIncomingBitrate(maxIncomingBitrate);
      } catch (error) { }
    }

    transport.on('dtlsstatechange', (dtlsState) => {
      if (dtlsState === 'closed') {
        console.log('---transport close--- ' + this.peers.get(socket_id)?.name + ' closed')
        transport.close()
      }
    })

    transport.on('close', () => {
      console.log('---transport close--- ' + this.peers.get(socket_id)?.name + ' closed')
    })
    console.log('---adding transport---', transport?.id)
    this.peers.get(socket_id)?.addTransport(transport)
    return {
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters
      },
    };
  }
  async connectPeerTransport(socket_id: string, transport_id: string, dtlsParameters: any) {
    if (!this.peers.has(socket_id)) return
    await this.peers.get(socket_id)?.connectTransport(transport_id, dtlsParameters)
  }



  async produce(socket_id: string, producerTransportId: string, rtpParameters: any, kind: mediasoupTypes.MediaKind) {
    // handle undefined errors
    return new Promise(async (resolve, reject) => {
      let producer = await this.peers.get(socket_id)?.createProducer(producerTransportId, rtpParameters, kind);
      if (kind == "audio") {
        this.audioLevelObserver?.addProducer({ producerId: <string>producer?.id }).catch(() => { });
      }
      resolve(producer?.id)
      this.broadCast(socket_id, 'newProducers', [{
        producer_id: producer?.id,
        producer_socket_id: socket_id
      }])
    })
  }

  async consume(socket_id: string, consumer_transport_id: string, producer_id: string, rtpCapabilities: any) {
    // handle nulls
    if (!this.router?.canConsume({
      producerId: producer_id,
      rtpCapabilities,
    })) {
      console.error('can not consume');
      return;
    }

    let { consumer, params } = <{
      consumer: any,
      params: any
    }>await this.peers.get(socket_id)?.createConsumer(consumer_transport_id, producer_id, rtpCapabilities)

    consumer.on('producerclose', () => {
      console.log(`---consumer closed--- due to producerclose event  name:${this.peers.get(socket_id)?.name} consumer_id: ${consumer.id}`)
      this.peers.get(socket_id)?.removeConsumer(consumer.id)
      this.io.to(socket_id).emit('consumerClosed', {
        consumer_id: consumer.id
      })
    })

    return params

  }
  async removePeer(socket_id: string) {
    this.peers.get(socket_id)?.close()
    this.peers.delete(socket_id)
  }
  closeProducer(socket_id: string, producer_id: string) {
    this.peers.get(socket_id)?.closeProducer(producer_id)
  }



  broadCast(socket_id: string, name: string, data: any) {
    for (let otherID of Array.from(this.peers.keys()).filter(id => id !== socket_id)) {
      this.send(otherID, name, data)
    }
  }
  broadCastAll(name: string, data: any) {
    for (let otherID of Array.from(this.peers.keys())) {
      this.send(otherID, name, data)
    }
  }

  send(socket_id: string, name: string, data: any) {
    this.io.to(socket_id).emit(name, data)
  }

  getPeers() {
    return this.peers
  }



  toJson() {
    return {
      id: this.id,
      peers: JSON.stringify([...this.peers])
    }
  }



  toJson_peer(peerId: string) {
    return {
      id: this.id,
      peers: JSON.stringify([...this.peers]),
      peer: JSON.stringify(this.peers.get(peerId))
    }
  }
}


