import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import socket from '../../socket';
import curtain from "../../curtain.png";
import IMG1 from "../../IMG1.png";
import IMG2 from "../../friends_img1.png";
import './chat.css'
const Chat = ({ display, roomId }) => {
  const currentUser = sessionStorage.getItem('user');
  const [msg, setMsg] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef();
  
  useEffect(() => {
    socket.on('FE-receive-message', ({ msg, sender }) => {
      setMsg((msgs) => [...msgs, { sender, msg }]);
    });
  }, []);

  // Scroll to Bottom of Message List
  useEffect(() => {scrollToBottom()}, [msg])

  const scrollToBottom = () => {
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth'});
  }

  const sendMessage = (e) => {
    if (e.key === 'Enter') {
      const msg = e.target.value;

      if (msg) {
        socket.emit('BE-send-message', { roomId, msg, sender: currentUser });
        inputRef.current.value = '';
      }
    }
  };

  return (
    <ChatContainer className={display ? '' : 'width0'}>
       <div className="event-full-top">
                  <img src={curtain} style={{width:'100%'}} alt="curtain" />
                  <div className="event-content">
                    <h4 className="text-center">
                      This event is currently full.
                    </h4>
                    <h4 className="text-center">
                      {" "}
                      You will be added{" "}
                      <span className="break-word">
                        automatically when space
                      </span>{" "}
                      is available.
                    </h4>
                  </div>
                </div>
               
      {/* <TopHeader>Group Chat Room</TopHeader> */}
      <div className='list'>
      <button className='category_active'> Live Chat </button>
      <button className='category'> Host Chat </button>
      <button className='category'> Vshop</button>
      </div>
      
      <ChatArea>
        <MessageList>
          {msg &&
            msg.map(({ sender, msg }, idx) => {
              if (sender !== currentUser) {
                return (
                  <Message key={idx}>
                    <div className='chat-user-fig'>
                  <div>
                        <img src={IMG1} alt="chat_club IMG 1" />
                  </div>
                  <div className='name_msg'>
                  <strong>{sender}</strong>
                  <p>{msg}</p>
                  </div>
                    
                    </div>
                  </Message>
                );
              } else {
                return (
                  <UserMessage key={idx}>
                    {/* <strong>{sender}</strong>
                    <p>{msg}</p> */}
                      <div className='chat-user-fig'>
                  <div>
                        <img src={IMG2} alt="chat_club IMG 1" style={{width:47,height:47}} />
                  </div>
                  <div className='name_msg'>
                  <strong>{sender}</strong>
                  <p>{msg}</p>
                  </div>
                    
                    </div>
                  </UserMessage>
                );
              }
            })}
            <div style={{float:'left', clear: 'both'}} ref={messagesEndRef} />
        </MessageList>
      </ChatArea>
      <BottomInput
        ref={inputRef}
        onKeyUp={sendMessage}
        placeholder="Enter your message"
      />

    </ChatContainer>
  );
};

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 40%;
  background-color:#080134;
  // height: 100%!important;
  @media (max-width:425px){
    display: block;
    width: 100%;

  }
 
`;

const TopHeader = styled.div`
  width: 100%;
  margin-top:5px;
  font-weight: 500;
  font-size: 20px;
  color: white;
`;

const ChatArea = styled.div`
  width: 100%;
  height: 83%;
  max-height: 83%;
  overflow-x: hidden;
  overflow-y: auto;
`;

const MessageList = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  padding: 15px;
  color: #454552;
`;

const Message = styled.div`
  width: fit-content;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 16px;
  margin-top: 15px;
  margin-left: 15px;
  text-align: left;
  margin-right:10px;
 padding:5px;

 
`;

const UserMessage = styled.div`
width: fit-content;
display: flex;
flex-direction: column;
align-items: flex-start;
font-size: 16px;
margin-top: 15px;
margin-left: 15px;
text-align: left;
margin-right:10px;
padding:5px;

`;

const BottomInput = styled.input`
  bottom: 0;
  width: 100%;
  height: 14%;
  padding: 15px;
  background-color:#fff;
  border-top: 1px solid rgb(69, 69, 82, 0.25);
  box-sizing: border-box;
  

  :focus {
    outline: none;
  }
`;

export default Chat;
