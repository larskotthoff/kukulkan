import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

import { Kukulkan } from "./kukulkan.jsx";
import { Thread } from "./thread.jsx";
import { SingleMessage } from "./message.jsx";
import { Write } from "./write.jsx";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Outlet/>}>
        <Route index element={<Kukulkan/>} />
        <Route path="thread" element={<Thread/>} />
        <Route path="message" element={<SingleMessage/>} />
        <Route path="write" element={<Write/>} />
      </Route>
    </Routes>
  </BrowserRouter>
);

// vim: tabstop=2 shiftwidth=2 expandtab
