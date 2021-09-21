/* eslint-disable no-underscore-dangle */
import {
  NextFunction, Request, RequestHandler, Response,
} from 'express';
import { Server } from 'socket.io';
import Axios, { AxiosError } from 'axios';
import http from 'http';
import jwt from 'jsonwebtoken';
import {
  SocketIoMiddlewareLocals,
  RequestData,
  SocketIoMiddlewareConfig,
  ResponsePayload,
  ResponseData,
} from './index.d';

/**
 * Send the response to the input socketId at the same time as the HTTP response
 * @param socketIoServer
 * @returns
 */
const socketIoMiddleware = (
  socketIoServer: Server,
  apiServerUrl: string,
  jwtTokenSecret: string,
  config: SocketIoMiddlewareConfig = {
  },
): RequestHandler => {
  const httpAgent = new http.Agent({ keepAlive: config.__advanced__?.httpKeepAlive || true });
  const axios = Axios.create(config.__advanced__?.axiosRequestConfig);

  const eventNames = {
    token: config.eventNames?.token || 'token',
    request: config.eventNames?.request || 'request',
    response: config.eventNames?.response || 'response',
  };

  socketIoServer.on('connection', (socket) => {
    /**
     * Send token to be used for REST API communication
     */
    socket.emit(eventNames.token, {
      token: jwt.sign({ socketId: socket.id }, jwtTokenSecret, {
        expiresIn: '30d',
      }),
    });
    socket.on(eventNames.request, async (requestData: RequestData) => {
      const reqStartAt = Date.now();
      const {
        data,
        method,
        pathname,
        params = {},
        headers = {},
      } = requestData as RequestData;
      try {
        /**
         * Regardless of the Axios response result,
         * the response is sent to the web socket when the server response is processed.
         */
        const socketAuthToken = jwt.sign({ socketId: socket.id }, jwtTokenSecret, {
          expiresIn: '30d',
        });
        await axios({
          method,
          data,
          params,
          httpAgent,
          url: pathname,
          baseURL: apiServerUrl,
          headers: Object.assign(headers, {
            /**
             * Real client IP information requested through Websocket
             */
            'x-forwarded-for': socket.conn.remoteAddress,
            /**
             * Authentication token
             */
            authorization: `Bearer ${socketAuthToken}`,
          }),
        });
      } catch (e) {
        const error = e as AxiosError;
        const took = Date.now() - reqStartAt;
        const { response } = error;
        if (response && response?.status <= 0) {
          /**
           * When the request fails, an error is sent directly to the socket.
           */
          const responsePayload = {
            took,
            response: {
              headers: response?.headers,
              data: response?.data,
              status: response?.status,
            } as ResponseData,
            request: requestData,
          } as ResponsePayload;
          socket.emit(
            eventNames.response,
            config.transformResponsePayload
              ? config.transformResponsePayload(responsePayload)
              : responsePayload,
          );
        } else {
          const message = config.unexpectedErrorMessage || error.message;
          const responsePayload = {
            took,
            response: {
              data: {
                message,
              },
              status: 500,
            } as ResponseData,
            request: requestData,
          } as ResponsePayload;
          socket.emit(
            eventNames.response,
            config.transformResponsePayload
              ? config.transformResponsePayload(responsePayload)
              : responsePayload,
          );
        }
      }
    });
  });

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { authorization } = req.headers;
    /**
     * The `socketId` to which to forward the response
     */
    let requestSocketId: string | undefined;

    if (authorization) {
      const [, token] = authorization.split(' ');
      requestSocketId = await new Promise(
        (resolve) => jwt.verify(token, jwtTokenSecret, (_err, decoded) => {
          resolve(decoded?.socketId);
        }),
      );
    }

    const [requestSocket] = requestSocketId
      ? await socketIoServer.to(requestSocketId).fetchSockets()
      : [];

    const resSend = res.send;
    const reqStartAt = Date.now();
    Object.assign(res, {
      /**
       * Send the response to the input socketId at the same time as the HTTP response
       * @param rawData
       */
      send: (rawData: any) => {
        if (requestSocketId) {
          /**
           * Send only if `socketId` exists
           */
          const { statusCode: status } = res;
          const {
            path: pathname,
            headers: reqHeaders,
            body: reqData,
            method,
            params,
          } = req;
          const headers = res.getHeaders();
          const isJsonData = headers['content-type']?.toString()?.startsWith('application/json');
          const data = isJsonData ? JSON.parse(rawData) : rawData;
          const responsePayload = {
            response: {
              status,
              headers,
              data,
            },
            request: {
              pathname,
              method,
              params,
              data: reqData,
              headers: reqHeaders,
            },
            took: Date.now() - reqStartAt,
          } as ResponsePayload;
          socketIoServer
            .to(requestSocketId)
            .emit(
              eventNames.response,
              config.transformResponsePayload
                ? config.transformResponsePayload(responsePayload)
                : responsePayload,
            );
        }
        resSend.call(res, rawData);
      },
    });
    res.locals.socketIo = {
      server: socketIoServer,
      requestSocket,
    } as SocketIoMiddlewareLocals;
    next();
  };
};

export default socketIoMiddleware;
