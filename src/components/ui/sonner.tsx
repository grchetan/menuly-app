import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="bottom-right"
      closeButton
      duration={3800}
      offset="20px"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast font-sans !rounded-xl !border !shadow-xl !backdrop-blur-md",
          title: "font-sans !font-bold text-sm tracking-tight",
          description: "text-xs font-medium mt-0.5",
          actionButton: "!rounded-lg text-xs font-semibold px-3 py-1.5 shadow-sm",
          cancelButton: "!rounded-lg text-xs font-medium px-2.5 py-1",
          closeButton: "!rounded-md !border transition-all duration-150",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
