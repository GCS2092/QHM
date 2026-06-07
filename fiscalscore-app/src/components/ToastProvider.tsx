'use client';

import { Toaster } from 'sonner';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      theme="light"
      expand={false}
      closeButton
      visibleToasts={3}
    />
  );
}
