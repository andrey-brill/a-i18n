
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

import { Editor } from './src/Editor.jsx';
import css from 'bundle-text:./index.scss';


const style = document.createElement('style');
style.innerHTML = css;
document.head.appendChild(style);

const root = createRoot(document.getElementById('root'));
root.render(createElement(Editor));


