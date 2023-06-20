import "./shim.js";
import React from "react";
import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Home from "./Home.js";
import InputName from "./InputName.js";
export default function App() {
  const [name, setName] = React.useState("");
  return (
    <Router>
      <Routes>
        <Route path="/" element={<InputName setName={setName} />} />
        <Route path="/call-room" element={<Home name={name} />} />
      </Routes>
    </Router>
  );
}
