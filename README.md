# Express Socket.io Middleware
> This middleware allows you to use the existing HTTP REST API as a WebSocket.

## Installation

The easiest way to install `express-socket.io-middleware` is with [npm](https://www.npmjs.com/package/express-socket.io-middleware).

```bash
npm install express-socket.io-middleware
```

Alternately, download the source.

```bash
git clone https://github.com/stegano/express-socket.io-middleware.git
```

## Example
This middleware allows you to process all rest api requests and responses implemented as websockets.
### Server
```ts
...
const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  path: '/ws',
});

app
  .use(socketIoMiddleware(io, 'http://localhost:3000', 'secret!'))
  .get('/test', (_, res) => {
    res.send({message: 'Hello World'})
  });

server.listen(3000);
...
```

### Clients
* You can change the event name in configuration. Please check the [Configuration](#configuration) section.
#### Client With Socket.io
> Request through websocket and receive a response
```ts
// 1) Create and connect socket object
const socket = io({
      path: '/ws',
      transports: ['websocket']
    });

// 2) Send request using WebSocket
socket.emit('request', {
  pathanme: '/test',
  method: 'GET',
  data: {},
  params: {}
});

// 3) Receive response using WebSocket
socket.on('response', (data) => {
  console.log(data); // `{ request: {...}, response: { ..., data: 'Hello World' }} }`
});
```

#### Client With HTTP API and Socket.io
> Request using REST API and receive response using WebSocket
```ts
// 1) Create and connect socket object
const socket = io({
      path: '/ws',
      transports: ['websocket']
    });

// 2) Receive auth token via WebSocket
socket.on('token', ({token}) => {
  // 3) Send REST API request with `authentication` header
  axios.get('/test', {
    headers: {
      authorization: `Bearer ${token}`
    }
  })
});


socket.on('response', (data) => {
  // 4) Receive REST API response as WebSocket
  console.log(data); // `{ request: {...}, response: { ..., data: 'Hello World' }} }`
});
```

## Configuration
```ts
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
```

## Internal Implementation
This middleware internally sends an HTTP request to the web server and sends the received response value to the connected web socket.
