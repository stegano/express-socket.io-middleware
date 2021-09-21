# Express Socket.io Middleware
> This middleware allows you to easily convert your existing HTTP REST APIs to websockets.

## Installation

The easiest way to install `express-socket.io-middleware` is with [npm](https://www.npmjs.com/package/express-socket.io-middleware).

```bash
npm install express-socket.io-middleware
```

Alternately, download the source.

```bash
git clone https://github.com/stegano/express-socket.io-middleware.git
```

## Benefits
> Benefits of implementing the websocket specification using HTTP API
* Already verified HTTP specifications can be used for websocket responses.
* Specification can be defined through existing OpenAPI or documents such as Swagger
* Can be tested through HTTP API without directly connecting to websocket
* Can handle asynchronous responses easily
   * For example, if you implement using HTTP API when implementing chat message transmission, you can use the async~await syntax, so it is easy to handle response status.

## Example
Load this middleware in express, then all HTTP APIs can be handled with websockets
### Server
```ts
...
const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  path: '/ws',
});

app
  .use(socketIoMiddleware(server, 'http://localhost:3000', 'secret!'))
  .get('/test', (_, res) => {
    res.send({message: 'Hello World'})
  });

server.listen(3000);
...
```

### Clients
* The event name can be changed in settings. See the [Configration](#configuration) session
#### Client With Socket.io
```ts
// 1) Create and connect socket object
const socket = io({
      path: '/ws',
      transports: ['websocket']
    });

socket.emit('request', {
  pathanme: '/test',
  method: 'GET',
  data: {},
  params: {}
});

socket.on('response', (data) => {
  // 4) Receive API response as socket
  console.log(data); // `{ request: {...}, response: { ..., data: 'Hello World' }} }`
});
```

#### Client With HTTP API and Socket.io
```ts
// 1) Create and connect socket object
const socket = io({
      path: '/ws',
      transports: ['websocket']
    });

// 2) Receive authentication token information
socket.on('token', ({token}) => {
  // 3) HTTP API calls using sockets
  axios.get('/test', {
    headers: {
      authorization: `Bearer ${token}`
    }
  })
});


socket.on('response', (data) => {
  // 4) Receive API response as socket
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
