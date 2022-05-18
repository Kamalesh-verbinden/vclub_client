import io from 'socket.io-client';
// const sockets = io('http://localhost:3001', { autoConnect: true, forceNew: true });
// const sockets = io('/');
const port1 = "ws://20.242.33.254";
const port2 = "ws://20.242.33.254:3003"
const port3 = "ws://vclubs.iverbinden.com"
const sockets = io(port3);
export default sockets;
