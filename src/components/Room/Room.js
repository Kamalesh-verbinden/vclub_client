import React, { useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer';
import styled from 'styled-components';
import socket from '../../socket';
import VideoCard from '../Video/VideoCard';
import BottomBar from '../BottomBar/BottomBar';
import Chat from '../Chat/Chat';
import '../../App.css'
// import Link from 'react-router-dom';

const Room = (props) => {
  const currentUser = sessionStorage.getItem('user');
  const [peers, setPeers] = useState([]);
  const [userVideoAudio, setUserVideoAudio] = useState({
    localUser: { video: true, audio: true },
  });
  const [videoDevices, setVideoDevices] = useState([]);
  const [displayChat, setDisplayChat] = useState(true);
  const [screenShare, setScreenShare] = useState(false);
  const [showVideoDevices, setShowVideoDevices] = useState(false);
  const peersRef = useRef([]);
  const userVideoRef = useRef();
  const screenTrackRef = useRef();
  const userStream = useRef();
  const roomId = props.match.params.roomId;

  useEffect(() => {
    // Get Video Devices
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const filtered = devices.filter((device) => device.kind === 'videoinput');
      setVideoDevices(filtered);
    });

    // Set Back Button Event
    window.addEventListener('popstate', goToBack);

    // Connect Camera & Mic
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        userVideoRef.current.srcObject = stream;
        userStream.current = stream;

        socket.emit('BE-join-room', { roomId, userName: currentUser });
        socket.on('FE-user-join', (users) => {
          // all users
          const peers = [];
          users.forEach(({ userId, info }) => {
            let { userName, video, audio } = info;

            if (userName !== currentUser) {
              const peer = createPeer(userId, socket.id, stream);

              peer.userName = userName;
              peer.peerID = userId;

              peersRef.current.push({
                peerID: userId,
                peer,
                userName,
              });
              peers.push(peer);

              setUserVideoAudio((preList) => {
                return {
                  ...preList,
                  [peer.userName]: { video, audio },
                };
              });
            }
          });

          setPeers(peers);
        });

        socket.on('FE-receive-call', ({ signal, from, info }) => {
          let { userName, video, audio } = info;
          const peerIdx = findPeer(from);

          if (!peerIdx) {
            const peer = addPeer(signal, from, stream);

            peer.userName = userName;

            peersRef.current.push({
              peerID: from,
              peer,
              userName: userName,
            });
            setPeers((users) => {
              return [...users, peer];
            });
            setUserVideoAudio((preList) => {
              return {
                ...preList,
                [peer.userName]: { video, audio },
              };
            });
          }
        });

        socket.on('FE-call-accepted', ({ signal, answerId }) => {
          const peerIdx = findPeer(answerId);
          peerIdx.peer.signal(signal);
        });

        socket.on('FE-user-leave', ({ userId, userName }) => {
          const peerIdx = findPeer(userId);
          peerIdx.peer.destroy();
          setPeers((users) => {
            users = users.filter((user) => user.peerID !== peerIdx.peer.peerID);
            return [...users];
          });
          peersRef.current = peersRef.current.filter(({ peerID }) => peerID !== userId );
        });
      });

    socket.on('FE-toggle-camera', ({ userId, switchTarget }) => {
      const peerIdx = findPeer(userId);

      setUserVideoAudio((preList) => {
        let video = preList[peerIdx.userName].video;
        let audio = preList[peerIdx.userName].audio;

        if (switchTarget === 'video') video = !video;
        else audio = !audio;

        return {
          ...preList,
          [peerIdx.userName]: { video, audio },
        };
      });
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, []);

  function createPeer(userId, caller, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socket.emit('BE-call-user', {
        userToCall: userId,
        from: caller,
        signal,
      });
    });
    peer.on('disconnect', () => {
      peer.destroy();
    });

    return peer;
  }

  function addPeer(incomingSignal, callerId, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socket.emit('BE-accept-call', { signal, to: callerId });
    });

    peer.on('disconnect', () => {
      peer.destroy();
    });

    peer.signal(incomingSignal);

    return peer;
  }

  function findPeer(id) {
    return peersRef.current.find((p) => p.peerID === id);
  }

  function createUserVideo(peer, index, arr) {
    return (
      <VideoBox
        className={`width-peer${peers.length > 25 ? '' : peers.length}`}
        onClick={expandScreen}
        key={index}
      >
        {writeUserName(peer.userName)}
        <FaIcon className='fas fa-expand' />
        <UserName>{peer.userName}</UserName>
        <Options>
            <Close className="cross-icon">×</Close>   
                    <div className="booth-btns">
                      <Buttons>
                        Send a gift
                      </Buttons>
                      <ButtonsActive >
                        Make small talk
                      </ButtonsActive>
                      <ButtonsActive>
                        Send private message
                      </ButtonsActive>
                      <ButtonsActive>
                        Mute this person
                      </ButtonsActive>
                    </div>
                   
                  </Options>

        <VideoCard key={index} peer={peer} number={arr.length} />
      </VideoBox>
    );
  }

  function writeUserName(userName, index) {
    if (userVideoAudio.hasOwnProperty(userName)) {
      if (!userVideoAudio[userName].video) {
        return <UserName key={userName}>{userName}</UserName>;
      }
    }
  }

  // Open Chat
  const clickChat = (e) => {
    e.stopPropagation();
    setDisplayChat(displayChat);
  };

  // BackButton
  const goToBack = (e) => {
    e.preventDefault();
    socket.emit('BE-leave-room', { roomId, leaver: currentUser });
    sessionStorage.removeItem('user');
    window.location.href = '/';
  };

  const toggleCameraAudio = (e) => {
    const target = e.target.getAttribute('data-switch');

    setUserVideoAudio((preList) => {
      let videoSwitch = preList['localUser'].video;
      let audioSwitch = preList['localUser'].audio;

      if (target === 'video') {
        const userVideoTrack = userVideoRef.current.srcObject.getVideoTracks()[0];
        videoSwitch = !videoSwitch;
        userVideoTrack.enabled = videoSwitch;
      } else {
        const userAudioTrack = userVideoRef.current.srcObject.getAudioTracks()[0];
        audioSwitch = !audioSwitch;

        if (userAudioTrack) {
          userAudioTrack.enabled = audioSwitch;
        } else {
          userStream.current.getAudioTracks()[0].enabled = audioSwitch;
        }
      }

      return {
        ...preList,
        localUser: { video: videoSwitch, audio: audioSwitch },
      };
    });

    socket.emit('BE-toggle-camera-audio', { roomId, switchTarget: target });
  };

  const clickScreenSharing = () => {
    if (!screenShare) {
      navigator.mediaDevices
        .getDisplayMedia({ cursor: true })
        .then((stream) => {
          const screenTrack = stream.getTracks()[0];

          peersRef.current.forEach(({ peer }) => {
            // replaceTrack (oldTrack, newTrack, oldStream);
            peer.replaceTrack(
              peer.streams[0]
                .getTracks()
                .find((track) => track.kind === 'video'),
              screenTrack,
              userStream.current
            );
          });

          // Listen click end
          screenTrack.onended = () => {
            peersRef.current.forEach(({ peer }) => {
              peer.replaceTrack(
                screenTrack,
                peer.streams[0]
                  .getTracks()
                  .find((track) => track.kind === 'video'),
                userStream.current
              );
            });
            userVideoRef.current.srcObject = userStream.current;
            setScreenShare(false);
          };

          userVideoRef.current.srcObject = stream;
          screenTrackRef.current = screenTrack;
          setScreenShare(true);
        });
    } else {
      screenTrackRef.current.onended();
    }
  };

  const expandScreen = (e) => {
    const elem = e.target;

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      /* Firefox */
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      /* Chrome, Safari & Opera */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      /* IE/Edge */
      elem.msRequestFullscreen();
    }
  };

  const clickBackground = () => {
    if (!showVideoDevices) return;

    setShowVideoDevices(false);
  };

  const clickCameraDevice = (event) => {
    if (event && event.target && event.target.dataset && event.target.dataset.value) {
      const deviceId = event.target.dataset.value;
      const enabledAudio = userVideoRef.current.srcObject.getAudioTracks()[0].enabled;

      navigator.mediaDevices
        .getUserMedia({ video: { deviceId }, audio: enabledAudio })
        .then((stream) => {
          const newStreamTrack = stream.getTracks().find((track) => track.kind === 'video');
          const oldStreamTrack = userStream.current
            .getTracks()
            .find((track) => track.kind === 'video');

          userStream.current.removeTrack(oldStreamTrack);
          userStream.current.addTrack(newStreamTrack);

          peersRef.current.forEach(({ peer }) => {
            // replaceTrack (oldTrack, newTrack, oldStream);
            peer.replaceTrack(
              oldStreamTrack,
              newStreamTrack,
              userStream.current
            );
          });
        });
    }
  };

  //const  widthpeer = peers.length >2 ? 50+"%" : 30+"%"; 

  return (
    <>
    {/* <TopNavigation />  */}
    <RoomContainer onClick={clickBackground}>
      
      <VideoAndBarContainer>
    
        <VideoContainer>
     
          {/* Current User Video */}
          <VideoBox
            className={`width-peer${peers.length > 25 ? '' : peers.length}`}
            //style={{width: widthpeer}}
          >
            {userVideoAudio['localUser'].video ? null : (
              <UserName>{currentUser}</UserName>
            )}
            <FaIcon className='fas fa-expand' />
            <UserName>{currentUser}</UserName>     
        
            <Options>
            <Close>×</Close>  
                    <div className="booth-btns">
                      <Buttons>
                        Send a gift
                      </Buttons>
                      <ButtonsActive>
                        Make small talk
                      </ButtonsActive>
                      <ButtonsActive>
                        Send private message
                      </ButtonsActive>
                      <ButtonsActive>
                        Mute this person
                      </ButtonsActive>
                    </div>
                   
                  </Options>

            <MyVideo
              onClick={expandScreen}
              ref={userVideoRef}
              muted
              autoPlay
              playInline
              
            ></MyVideo>
          </VideoBox>


          {/* Joined User Vidoe */}
          {peers &&
            peers.map((peer, index, arr) => createUserVideo(peer, index, arr))
          }


        </VideoContainer>


        <BottomBar
          clickScreenSharing={clickScreenSharing}
          clickChat={clickChat}
          clickCameraDevice={clickCameraDevice}
          goToBack={goToBack}
          toggleCameraAudio={toggleCameraAudio}
          userVideoAudio={userVideoAudio['localUser']}
          screenShare={screenShare}
          videoDevices={videoDevices}
          showVideoDevices={showVideoDevices}
          setShowVideoDevices={setShowVideoDevices}
        />
      </VideoAndBarContainer>
      <Chat display={displayChat} roomId={roomId} />
    </RoomContainer></>
  );
};

const RoomContainer = styled.div`
  display: flex;
  width: 100%;
  max-height: 100vh;
  flex-direction: row;
  height: calc(100vh - 77px)!important;
  min-height: calc(100vh - 77px)!important;
  max-height: calc(100vh - 77px)!important;
  margin-top: 0!important;

@media (max-width:425px){
  display: block;
}
`;

const VideoContainer = styled.div`
  max-width: 100%;
  display: flex;
  flex-wrap:wrap;
`;

const VideoAndBarContainer = styled.div`
  position: relative;
  width: 100%;
  // height:100%!important;

  // @media (max-width:425px){
    
  //   height:0%!important;

  // }
`;

const MyVideo = styled.video` 
`;

const VideoBox = styled.div`
  position: relative;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  > video {
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  :hover {
  
    > i,div  {
      display: block;
    }

  }
`;

const UserName = styled.div`
  position: absolute;
  font-size:17px;
  font-weight:500;
  color:#fff;
  width:fit-content;
  padding:5px;
  border-radius:5px;
  margin-left:auto;
  margin-right:auto;
  bottom: 5px;
  @media (max-width:425px){
    font-size:12px;
    bottom: 2px;
    }
`;

const FaIcon = styled.i`
  display: none;
  position: absolute;
  cursor:pointer;
  left: 15px;
  top: 15px;
`;

const Options = styled.div`
position: absolute;
display:none;
`;
const Close = styled.span`
color:yellow;
`;
const Buttons = styled.a`
font-size:15px;
width:200px;
padding:5px;
color:#fff;
text-align:center;
background-color: #a833b9;
border-radius:50px;
cursor:pointer;
:hover {
    color:#a833b9;
    background-color: #fff;
  }
  @media (max-width:425px){
    font-size:12px;
    width:150px;
    text-align:center;
    }
`;

const ButtonsActive = styled.a`
font-size:15px;
width:200px;
padding:5px;
color: #a833b9;
background-color: #37103d;
border:1px solid #a833b9;
text-align:center;
border-radius:50px;
cursor:pointer;
:hover {
    color:#fff;
    background-color:#a833b9;  

}
@media (max-width:425px){
  font-size:12px;
  width:150px;
  text-align:center;
  }
`;

export default Room;