/*
 * @Descripttion: 
 * @version: 1.0
 * @Author: icxl
 * @Date: 2021-07-06 16:48:47
 * @LastEditors: icxl
 * @LastEditTime: 2021-07-08 11:11:05
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
import { Consumer, Producer } from "mediasoup/lib/types";
export class Peer {

  id: string;
  name: string;
  order: number;
  transports: Map<string, mediasoupTypes.Transport>;
  consumers: Map<string, mediasoupTypes.Consumer>;
  producers: Map<string, mediasoupTypes.Producer>;
  constructor(socket_id: string, name: string, order: number) {
    this.id = socket_id
    this.name = name
    this.order = order;
    this.transports = new Map<string, mediasoupTypes.Transport>();
    this.consumers = new Map()
    this.producers = new Map()
  }

  /**
   * @Author: icxl
   * @msg: 创建Transport
   * @param {mediasoupTypes} transport
   * @return {*}
   */
  addTransport(transport: mediasoupTypes.Transport) {
    this.transports.set(transport.id, transport)
  }
  /**
   * @Author: icxl
   * @msg: 用户创建Transport连接
   * @param {string} transport_id
   * @param {any} dtlsParameters
   * @return {*}
   */
  async connectTransport(transport_id: string, dtlsParameters: any) {
    if (!this.transports.has(transport_id)) return
    let obj = this.transports.get(transport_id);
    await obj?.connect({ dtlsParameters });
  }

  async createProducer(producerTransportId: string, rtpParameters: any, kind: mediasoupTypes.MediaKind) {
    let obj = this.transports.get(producerTransportId);
    let producer = <Producer>await obj?.produce({
      kind,
      rtpParameters
    })
    this.producers.set(producer.id, producer);
    producer.on('transportclose', () => {
      console.log(`---producer transport close--- name: ${this.name} consumer_id: ${producer.id}`)
      producer.close()
      this.producers.delete(producer.id)
    })
    return producer
  }



  async createConsumer(consumer_transport_id: string, producer_id: string, rtpCapabilities: any): Promise<{ consumer: any, params: any } | null> {
    let consumerTransport = this.transports.get(consumer_transport_id)

    let consumer: Consumer;
    try {
      consumer = <Consumer>await consumerTransport?.consume({
        producerId: producer_id,
        rtpCapabilities,
        paused: false //producer.kind === 'video',
      });
    } catch (error) {
      console.error('consume failed', error);
      return null;
    }

    if (consumer.type === 'simulcast') {
      await consumer.setPreferredLayers({
        spatialLayer: 2,
        temporalLayer: 2
      });
    }

    this.consumers.set(consumer.id, consumer)

    consumer.on('transportclose', () => {
      console.log(`---consumer transport close--- name: ${this.name} consumer_id: ${consumer.id}`)
      this.consumers.delete(consumer.id)
    });

    return {
      consumer,
      params: {
        producerId: producer_id,
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        producerPaused: consumer.producerPaused
      }
    }
  }



  closeProducer(producer_id: string) {
    try {
      this.producers.get(producer_id)?.close()
    } catch (e) {
      console.warn(e)
    }
    this.producers.delete(producer_id)
  }

  getProducer(producer_id: string) {
    return this.producers.get(producer_id)
  }

  close() {
    this.transports.forEach(transport => transport.close())
  }

  removeConsumer(consumer_id: string) {
    this.consumers.delete(consumer_id)
  }

}