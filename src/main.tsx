// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // <--- Import Router
import App from './App';
import './index.css';
import Providers from './app/providers';



ReactDOM.createRoot(document.getElementById('root')!).render(
<React.StrictMode>
        <Providers>
             <App />
        </Providers>
</React.StrictMode>
); 