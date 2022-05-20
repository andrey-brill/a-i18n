
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

import { Editor } from './src/Editor.jsx';

const root = createRoot(document.getElementById('root'));
root.render(createElement(Editor));
