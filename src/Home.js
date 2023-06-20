import React, {useState, useEffect, useRef, useCallback} from "react";
import {socket} from "./socket";
import {RiUserVoiceFill} from "react-icons/ri";
import {FaRegUserCircle} from "react-icons/fa";
import {TbSend} from "react-icons/tb";
import {HiPhoneMissedCall, HiUserAdd} from "react-icons/hi";
import {IoMdCall} from "react-icons/io";
import {TbDeviceLaptop} from "react-icons/tb";
import {CopyToClipboard} from "react-copy-to-clipboard";
import Peer from "simple-peer";
import {Tooltip} from "@mui/material";
import {Button} from "@material-tailwind/react";
import {useLocation, useNavigate} from "react-router-dom";

const Home = ({name}) => {
  const [shareScreen, setShareScreen] = useState(false);
  const [me, setMe] = useState("");
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerName, setCallerName] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [message, setMessage] = useState("");
  const [chatMessagesData, setChatMessagesData] = useState([]);
  const [roomId, setRoomId] = useState("");
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();

  // handle username
  useEffect(() => {
    if (name === "") {
      navigate("/");
    }
  }, [location, navigate, name]);

  // prevent refresh page when calling

  // Get user media
  useEffect(() => {
    const onMe = (id) => {
      setMe(id);
      setRoomId(id);
    };
    const onCallUser = (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerName(data.callerName);
      setCallerSignal(data.signal);
      setRoomId(data.roomId);
    };
    const handleChatMessage = (messageData) => {
      setChatMessagesData((chatMessagesData) => [...chatMessagesData, messageData]);
    };
    const handleLeaveCall = () => {
      setCallEnded(true);
      setCallAccepted(false);
      setReceivingCall(false);
      if (connectionRef.current) {
        connectionRef.current.destroy();
      }
    };
    socket.on("me", onMe);
    socket.on("callUser", onCallUser);
    socket.on("chatMessage", handleChatMessage);
    socket.on("leaveCall", handleLeaveCall);
    return () => {
      socket.off("me", onMe);
      socket.off("callUser", onCallUser);
      socket.off("chatMessage", handleChatMessage);
      socket.on("leaveCall", handleLeaveCall);
    };
  }, []);
  useEffect(() => {
    const getUserMedia = async () => {
      try {
        await navigator.mediaDevices
          .getUserMedia({video: true, audio: true})
          .then((currentStream) => {
            setStream(currentStream);
            myVideo.current.srcObject = currentStream || {};
          });
      } catch (err) {
        console.log(err);
      }
    };
    getUserMedia();
  }, []);
  // handle Call
  const callUser = (id) => {
    try {
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: stream,
      });
      peer.on("signal", (data) => {
        socket.emit("callUser", {
          userToCall: id,
          signalData: data,
          from: me,
          callerName: name,
        });
      });
      peer.on("stream", (stream) => {
        userVideo.current.srcObject = stream || {};
      });
      peer.on("data", (data) => {
        const {caller, callerName} = JSON.parse(data);
        setCaller(caller);
        setCallerName(callerName);
      });
      peer.on("connect", () => {
        setIdToCall("");
        peer.send(JSON.stringify(roomId));
      });
      socket.on("callAccepted", (signal) => {
        setCallAccepted(true);
        peer.signal(signal);
      });

      connectionRef.current = peer;
    } catch (error) {
      console.log(error);
    }
  };
  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.emit("answerCall", {signal: data, to: caller});
    });
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream || {};
    });
    peer.on("connect", () => {
      peer.send(
        JSON.stringify({
          caller: me,
          callerName: name,
        })
      );
    });
    peer.on("data", (data) => {
      const roomId = JSON.parse(data);
      setRoomId(roomId);
      socket.emit("joinRoom", roomId);
    });
    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = useCallback(() => {
    setCallEnded(true);
    setCallAccepted(false);
    setReceivingCall(false);
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
  }, []);
  useEffect(() => {
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, []);

  /* On/Off Camera */
  /* const OnCamera = () => {
    setCamera(true);
  };
  const OffCamera = () => {
    setCamera(false);
  }; */

  /* On/Off Audio */
  /* const OnAudio = () => {
    setAudio(true);
  };
  const OffAudio = () => {
    setAudio(false);
  }; */
  /* On/Off Screen Sharing */
  const OnScreenSharing = async () => {
    try {
      await navigator.mediaDevices
        .getDisplayMedia({video: true, audio: true})
        .then((currentStream) => {
          myVideo.current.srcObject = currentStream || {};
          setShareScreen(true);
          setStream(currentStream);
        });
    } catch (err) {
      console.log(err);
    }
  };
  const OffScreenSharing = async () => {
    try {
      const tracks = myVideo.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      await navigator.mediaDevices
        .getUserMedia({video: true, audio: true})
        .then((currentStream) => {
          myVideo.current.srcObject = currentStream || {};
          setStream(currentStream);
          setShareScreen(false);
        });
    } catch (err) {
      console.log(err);
    }
  };
  /* Send Messages */
  const sendMessage = (e) => {
    e.preventDefault();
    const data = {message: message.trim(), roomId, name: name, sender: me};
    if (message !== "") {
      socket.emit("chatMessage", data);
      setMessage("");
    }
  };
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      leaveCall();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [leaveCall]);

  return (
    <div className="flex flex-col w-screen h-screen justify-center items-center relative">
      <h1 className="flex justify-center items-center w-full bg-sub_dark text-white text-xl h-[8vh] font-medium">
        Video Chat
      </h1>
      <div className="flex justify-center items-center w-full">
        <div className="flex flex-col w-2/3 h-[calc(100vh-8vh)] bg-main_dark">
          <div className="flex gap-2 justify-center items-center w-full h-[calc(100vh-8vh-8vh)] flex-wrap">
            <div className="w-[380px] relative">
              <video playsInline muted ref={myVideo} autoPlay className="w-full" />
              <p className="text-red font-bold absolute top-[10px] left-[10px]">{name}</p>
            </div>
            {callAccepted && !callEnded && (
              <div className="w-[380px] relative">
                <video playsInline muted ref={userVideo} autoPlay className="w-full" />
                <p className="text-black font-bold absolute top-[10px] left-[10px]">{callerName}</p>
              </div>
            )}
            {receivingCall && !callAccepted ? (
              <div className="text-white my-4 mx-2 p-2">
                <h1>{callerName} is calling...</h1>
                <Button variant="filled" onClick={answerCall}>
                  Answer
                </Button>
              </div>
            ) : null}
          </div>
          <div className="flex justify-between items-center w-full h-[8vh] bg-sub_dark px-4 py-2">
            <div className="flex justify-center items-center h-full gap-4">
              {/* Handle Camera */}
              {/* {camera ? (
                <div
                  className="bg-primary_color hover:bg-primary_color_hover duration-100 rounded-md flex justify-center items-center w-[36px] h-[36px]"
                  onClick={OffCamera}
                >
                  <BsFillCameraVideoFill className="text-white text-lg" />
                </div>
              ) : (
                <div
                  className="bg-red rounded-md flex justify-center items-center w-[36px] h-[36px]"
                  onClick={OnCamera}
                >
                  <BsFillCameraVideoOffFill className="text-white text-lg" />
                </div>
              )} */}
              {/* End handle Camera */}

              {/* Handle Audio */}
              {/* {audio ? (
                <div
                  className="bg-primary_color hover:bg-primary_color_hover duration-100 rounded-md flex justify-center items-center w-[36px] h-[36px]"
                  onClick={OffAudio}
                >
                  <TbMicrophone className="text-white text-lg" />
                </div>
              ) : (
                <div
                  className="bg-red rounded-md flex justify-center items-center w-[36px] h-[36px]"
                  onClick={OnAudio}
                >
                  <TbMicrophoneOff className="text-white text-lg" />
                </div>
              )} */}
              {/* End handle Audio */}

              {/* Handle Share Screen */}
              {shareScreen ? (
                <div
                  className="bg-primary_color hover:bg-primary_color_hover duration-100 rounded-md flex justify-center items-center w-[36px] h-[36px]"
                  onClick={OffScreenSharing}
                >
                  <RiUserVoiceFill className="text-white text-lg" />
                </div>
              ) : (
                <div
                  className="bg-primary_color rounded-md flex justify-center items-center w-[36px] h-[36px]"
                  onClick={OnScreenSharing}
                >
                  <TbDeviceLaptop className="text-white text-lg" />
                </div>
              )}
              {/* End Handle Share Screen */}
            </div>
            <div className="flex gap-4 justify-center items-center">
              {!callAccepted && (
                <input
                  placeholder="Id to Call"
                  value={idToCall}
                  style={{fontSize: "1rem"}}
                  onChange={(e) => setIdToCall(e.target.value)}
                  className="block w-[200px] p-2 text-gray-9  00 border border-gray-300 rounded-lg bg-gray-50 sm:text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />
              )}

              {callAccepted && !callEnded ? (
                <div
                  className="bg-primary_color hover:bg-primary_color_hover duration-100 rounded-md flex justify-center items-center w-[36px] h-[36px]"
                  onClick={leaveCall}
                >
                  <HiPhoneMissedCall className="text-white text-lg" />
                </div>
              ) : (
                <div
                  className="bg-primary_color hover:bg-primary_color_hover duration-100 rounded-md flex justify-center items-center w-[36px] h-[36px]"
                  onClick={() => callUser(idToCall)}
                >
                  <IoMdCall className="text-white text-lg" />
                </div>
              )}
              <CopyToClipboard text={me}>
                <Tooltip title="Get Id to Call">
                  <div className="bg-primary_color hover:bg-primary_color_hover duration-100 rounded-md flex justify-center items-center w-[36px] h-[36px]">
                    <HiUserAdd className="text-white text-lg" />
                  </div>
                </Tooltip>
              </CopyToClipboard>
            </div>
          </div>
        </div>
        <div className="flex flex-col w-1/3 h-[calc(100vh-8vh)] bg-semisub_dark">
          <div className="flex flex-col items-center h-[calc(100vh-16vh)] overflow-auto scrollbar scrollbar-thumb-gray-900 scrollbar-track-gray-100">
            {chatMessagesData.map((messageData, index) => (
              <div
                className={`w-full p-[16px] flex flex-col items-start gap-4 ${
                  messageData.sender === me ? "items-end" : "items-start"
                }`}
                key={index}
              >
                <div
                  className={`flex text-white gap-2 ${
                    messageData.sender !== me && "flex-row-reverse"
                  }`}
                >
                  <div>{messageData.name}</div>
                  <FaRegUserCircle className="text-white text-2xl" />
                </div>
                <div className="text-black justify-start bg-main_light p-2 rounded-xl">
                  {messageData.message}
                </div>
              </div>
            ))}
          </div>
          <form className="h-[8vh] flex justify-center items-center gap-4" onSubmit={sendMessage}>
            <input
              placeholder="Type a message here..."
              value={message}
              style={{fontSize: "1rem"}}
              onChange={(e) => setMessage(e.target.value)}
              className="block w-4/5 p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            />
            <button
              type="submit"
              className="bg-primary_color hover:bg-primary_color_hover duration-100_hover duration-100 rounded-md flex justify-center items-center w-[36px] h-[36px]"
            >
              <TbSend className="text-white text-lg" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Home;
