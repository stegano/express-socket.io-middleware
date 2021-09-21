import { AxiosRequestConfig } from 'axios';
import { RemoteSocket, Server } from 'socket.io';
import { EventEmitter } from 'stream';

export interface SocketIoMiddlewareLocals {
  /**
   * socketIo server instance
   */
  server: Server
  /**
   * The requested socketId object
   * ! In cluster mode, `data` object cannot be shared.
   */
  requestSocket?: Omit<RemoteSocket<EventEmitter>, 'data'>
}

export interface RequestData {
  /**
   * HTTP API pathname
   */
  pathname: string
  /**
   * HTTP method
   */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS'
  /**
   * HTTP headers
   */
  headers?: Record<string, string>
  /**
   * HTTP queryParams
   */
  params?: {
    /**
     * The requested id
     */
    requestId: string
    /**
     * The requested socketId
     */
    requestSocketId: string
  } | Record<string, string>
  /**
   * data
   */
  data?: any
}

export interface ResponseData {
  /**
   * HTTP response status code
   */
  status: number
  /**
   * HTTP headers
   */
  headers?: Record<string, string>
  /**
   * data
   */
  data?: any
}

export interface ResponsePayload {
  /**
   * The response data
   */
  response: ResponseData
  /**
   * The request data
   */
  request: RequestData
  /**
   * response processing time(ms)
   */
  took: number
}

export interface SocketIoMiddlewareConfig {
  /**
   * Send an error message to the socket
   * When an unexpected error occurs during internal processing of socketIoMiddleware.
   */
  unexpectedErrorMessage?: string
  /**
   * This setting can transform the response payload data to be sent to the socket.
   */
  transformResponsePayload?: (data: ResponsePayload) => any
  /**
   * This setting can change the socket event name.
   */
  eventNames?: {
    /**
     * When a socket is connected, it sends a JWT. This token contains authentication information
     * about the socket to connect to when making an API request.
     */
    token?: string
    /**
     * The name of the event to request with the websocket.
     */
    request?: string
    /**
     * The name of the event that will receive a response to information requested by the websocket.
     */
    response?: string
  }
  __advanced__?: {
    /**
     * Whether keepalive is enabled when communicating with the server internally
     */
    httpKeepAlive?: boolean
    /**
     * Setting up the axios library that is internally communicating with the server
     * @see https://github.com/axios/axios#request-config
     */
    axiosRequestConfig?: AxiosRequestConfig
  }
}
