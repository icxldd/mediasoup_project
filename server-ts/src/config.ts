/*
 * @Descripttion: 
 * @version: 1.0
 * @Author: icxl
 * @Date: 2021-07-06 16:45:17
 * @LastEditors: icxl
 * @LastEditTime: 2021-07-06 18:59:57
 */
import * as os from 'os'
import { types as mediasoupTypes } from "mediasoup";
import { WorkerLogLevel, WorkerLogTag } from 'mediasoup/lib/Worker';
const defaultConfig = {
  listenIp: '0.0.0.0',
  listenPort: 3016,
  sslCrt: '../ssl/development.crt',
  sslKey: '../ssl/development.key',
  mediasoup: {
    numWorkers : Object.keys(os.cpus()).length,
    worker: {
      rtcMinPort: 10000,
      rtcMaxPort: 10100,
      logLevel:<WorkerLogLevel> 'warn',
      logTags: <WorkerLogTag[]>[
        'info',
        'ice',
        'dtls',
        'rtp',
        'srtp',
        'rtcp',
      ],
    },
    router: {
      mediaCodecs:
        [
          {
            kind: <mediasoupTypes.MediaKind>'audio',
            mimeType: 'audio/opus',
            clockRate: 48000,
            channels: 2
          },
          {
            kind: <mediasoupTypes.MediaKind>'video',
            mimeType: 'video/VP8',
            clockRate: 90000,
            parameters:
              {
                'x-google-start-bitrate': 1000
              }
          },
        ]
    },
  webRtcTransport: {
      listenIps: [
        {
          ip: '0.0.0.0',      
          announcedIp:'127.0.0.1' 
        }
      ],
      maxIncomingBitrate: 1500000,
      initialAvailableOutgoingBitrate: 1000000
  },
  }
};

export default defaultConfig;