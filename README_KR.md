# Express Socket.io Middleware
> 이 미들웨어를 사용하면 기존의 HTTP REST API를 WebSocket으로 사용할 수 있습니다.

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
이 미들웨어를 사용하여 구현된 모든 REST API 요청과 응답을 WebSocket으로 처리할 수 있습니다.

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
* 이벤트 이름은 설정에서 변경하실수 있습니다. [설정](#configuration) 섹션을 확인해 주세요.

#### Client With Socket.io
> WebSocket을 통해 요청하고 응답을 수신
```ts
// 1) 소켓 객체를 생성하고 연결
const socket = io({
      path: '/ws',
      transports: ['websocket']
    });

// 2) 웹 소켓을 사용하여 요청 전송
socket.emit('request', {
  pathanme: '/test',
  method: 'GET',
  data: {},
  params: {}
});

// 3) 웹 소켓을 사용하여 응답 수신
socket.on('response', (data) => {
  console.log(data); // `{ request: {...}, response: { ..., data: 'Hello World' }} }`
});
```

#### Client With REST API and Socket.io
> REST API을 이용하여 요청하고 WebSocket을 이용하여 응답을 수신
```ts
// 1) 소켓 객체를 생성하고 연결
const socket = io({
      path: '/ws',
      transports: ['websocket']
    });

// 2) 인증 토큰을 수신
socket.on('token', ({token}) => {
  // 3) `authentication` 헤더를 포함하여 REST API 요청
  axios.get('/test', {
    headers: {
      authorization: `Bearer ${token}`
    }
  })
});

// 4) REST API 응답을 웹 소켓으로 수신
socket.on('response', (data) => {
  console.log(data); // `{ request: {...}, response: { ..., data: 'Hello World' }} }`
});
```

## Configuration
```ts
  /**
   * `socketIoMiddleware`의 내부 처리 중 예기치 않은 오류가 발생하면 소켓에 오류 메시지를 보냅니다
   */
  unexpectedErrorMessage?: string
  /**
   * 소켓으로 보낼 응답 페이로드 데이터를 변환할 수 있습니다.
   */
  transformResponsePayload?: (data: ResponsePayload) => any
  /**
   * 소켓 이벤트 이름을 변경할 수 있습니다.
   */
  eventNames?: {
    /**
     * 소켓이 연결되면 JWT 토큰을 전송합니다. 이 토큰에는 API를 요청할 때 연결할 소켓에 대한 인증 정보가 포함되어 있습니다.
     */
    token?: string
    /**
     * 웹 소켓에서 사용할 요청 이벤트 이름입니다.
     */
    request?: string
    /**
     * 웹 소켓에서 사용할 응답 이벤트 이름입니다.
     */
    response?: string
  }
  __advanced__?: {
    /**
     * 서버와 내부적으로 통신할 때 keepalive 사용 여부 입니다.
     */
    httpKeepAlive?: boolean
    /**
     * 서버와 내부적으로 통신 중인 Axios 라이브러리 설정 값 입니다.
     * @see https://github.com/axios/axios#request-config
     */
    axiosRequestConfig?: AxiosRequestConfig
  }
```

## Internal Implementation
이 미들웨어는 내부적으로 HTTP 요청을 웹 서버로 보내고 수신된 응답 값을 연결된 웹 소켓으로 보냅니다.
