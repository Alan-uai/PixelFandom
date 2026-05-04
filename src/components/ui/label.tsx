import * as React from "react";

const Label = React.forwardRef<
  HTMLLabelElement,
  React.ComponentProps<"label">
>(({ className, htmlFor, ...props }, ref) => {
  return (
    <label
      className={className}
      htmlFor={htmlFor}
      ref={ref}
      {...props}
    />
  );
});
Label.displayName = "Label";
export { Label };