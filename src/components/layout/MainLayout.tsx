import type { ReactNode } from 'react';
import { Header } from './Header';
import { StatusBar } from './StatusBar';
import './MainLayout.css';

interface MainLayoutProps {
  canvas: ReactNode;
  sidebar: ReactNode;
}

export function MainLayout({ canvas, sidebar }: MainLayoutProps) {
  return (
    <div className="main-layout">
      <Header />
      <div className="main-content">
        <div className="canvas-panel">
          {canvas}
        </div>
        <div className="sidebar-panel">
          {sidebar}
        </div>
      </div>
      <StatusBar />
    </div>
  );
}
