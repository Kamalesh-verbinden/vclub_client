import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import socket from '../../socket';
import '../../App.css'

const Main = (props) => {
  const roomRef = useRef("conference");
  const userRef = useRef();
  const [err, setErr] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {

    socket.on('FE-error-user-exist', ({ error }) => {
      if (!error) {
        const roomName = roomRef.current.value;
        const userName = userRef.current.value;

        sessionStorage.setItem('user', userName);
        props.history.push(`/room/${roomName}`);
      } else {
        setErr(error);
        setErrMsg('User name already exist');
      }
    });
  }, [props.history]);

  function clickJoin() {
    const roomName = roomRef.current.value;
    const userName = userRef.current.value;

    if (!roomName || !userName) {
      setErr(true);
      setErrMsg('* Please enter your name');
    } else {
      socket.emit('BE-check-user', { roomId: roomName, userName });
    }
  }

  return (
    <MainContainer>
      <Row>
        <h1 className='h1_tag'>You are about to enter Vclubs conference</h1>
        {/* <Label className='roomLabel'>Room Name</Label> */}
        <Input type="text" id="roomName" ref={roomRef} value="conference"/>
      </Row>

      <Row>
        <Label>Enter your Name:</Label>
        <Input type="text" id="userName" ref={userRef} />
        <JoinButton onClick={clickJoin}> Join </JoinButton>
      </Row>

  
      {err ? <Error>{errMsg}</Error> : null}
    </MainContainer>
  );
};


const MainContainer = styled.div`
      margin-right: auto;
      margin-left: auto;
      background: #f3f2ef;
      display: flex;
      flex-direction: column;
      display: flex;
      justify-content: center;
      height: 480px;
      align-items: center;

`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 100px;
  line-height: 35px;
  @media (min-width:250px) and (max-width:425px){
    display:block;
}
`;

const Label = styled.label`
margin:10px;
color:black;
font-size:18px;
@media (min-width:250px) and (max-width:425px){
    font-size: 16px;  
}
`;

const Input = styled.input`
  width: 250px;
  height: 32px;
  margin-left: 15px;
  padding-left: 10px;
  height: 48px;
  background: transparent;
  color: black;
  font-size: 18px;
  border: 2px solid #a833b9;
  border-radius: 3px;
  @media (min-width:250px) and (max-width:425px){
    width: 151px;
    height: 30px;
}
`;

const Error = styled.div`
  margin-top: 10px;
  font-size: 18px;
  color: red;
  @media (min-width:250px) and (max-width:425px){
    font-size: 15px;

}
`;

const JoinButton = styled.button`
background: #a833b9;
width: 135px;
border: none;
border-radius: 40px;
margin-left: 20px;
font-size: 20px;
color:#fff;
text-transform: capitalize;
font-family: "Asap-Regular";
height: 48px;
// margin-top: 35px;
cursor: pointer;

  :hover {
    background-color:#fff;
    border:1px solid #a833b9;
    color: #a833b9;
    cursor: pointer;
  }
  @media (min-width:250px) and (max-width:425px){
    width: 100px;
    height: 35px;
    margin-right:auto;
    margin-left:auto;
    margin-top:30px;

}

`;


export default Main;
