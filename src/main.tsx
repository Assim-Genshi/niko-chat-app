// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import Providers from './app/providers'; // Your custom Providers component
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter> {/* <--- BrowserRouter is now the outermost router context */}
            <Providers> {/* <--- Your contexts are inside BrowserRouter */}
                <App /> {/* <--- App will contain only Routes */}
            </Providers>
        </BrowserRouter>
    </React.StrictMode>
);