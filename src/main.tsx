import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

// Suppress and patch known Google Translate DOM mutation errors in React
if (typeof window !== 'undefined') {
  if (window.location.search.includes('reset=')) {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Erro ao resetar storage via URL:', e);
    }
  }

  if (typeof Node === 'function' && Node.prototype) {
    const originalRemoveChild = Node.prototype.removeChild;
    // @ts-ignore
    Node.prototype.removeChild = function <T extends Node>(child: T): T {
      if (child.parentNode !== this) {
        if (console) {
          console.warn('Google Translate DOM node mismatch on removeChild handled safely:', child, this);
        }
        if (child.parentNode) {
          return child.parentNode.removeChild(child) as T;
        }
        return child;
      }
      return originalRemoveChild.call(this, child) as T;
    };

    const originalInsertBefore = Node.prototype.insertBefore;
    // @ts-ignore
    Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
      if (referenceNode && referenceNode.parentNode !== this) {
        if (console) {
          console.warn('Google Translate DOM node mismatch on insertBefore handled safely:', newNode, referenceNode, this);
        }
        if (referenceNode.parentNode) {
          return referenceNode.parentNode.insertBefore(newNode, referenceNode) as T;
        }
        return newNode;
      }
      return originalInsertBefore.call(this, newNode, referenceNode) as T;
    };

    window.addEventListener('error', (event) => {
      if (
        event.message?.includes("Failed to execute 'removeChild' on 'Node'") ||
        event.message?.includes("Failed to execute 'insertBefore' on 'Node'") ||
        event.message?.includes("The node to be removed is not a child of this node") ||
        event.message?.includes("NotFoundError")
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

