import React from 'react';

export default function Link({ href, onClick, children, className, ...props }) {
  const handleClick = (e) => {
    // Allow default browser behavior for modifier clicks (Ctrl, Cmd, Shift, Middle Mouse Button)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) {
      return;
    }
    e.preventDefault();
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <a href={href || '#'} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
}
