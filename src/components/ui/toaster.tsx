import * as React from "react";
import { ToastProvider, toast } from "sonner";

const Toaster: React.FC = ({ children }) => {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
};
export default Toaster;