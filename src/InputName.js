import {Button, Input} from "@material-tailwind/react";
import React, {useRef} from "react";
import {useNavigate} from "react-router-dom";

const InputName = ({setName}) => {
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const handleJoinRoom = () => {
    setName(inputRef.current.value);
    navigate("/call-room");
  };
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen">
      <div className="flex flex-col gap-4 items-center justify-center w-72">
        <Input label="Your Name" inputRef={inputRef} />
        <Button className="w-full" onClick={handleJoinRoom}>
          Join
        </Button>
      </div>
    </div>
  );
};

export default InputName;
