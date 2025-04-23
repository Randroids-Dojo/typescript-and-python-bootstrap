import { toast } from "sonner";
import * as React from "react";

// Creates Tailwind-themed toast notifications
export const notify = {
  success: (message: string, description?: string) => {
    return toast.success(message, {
      description,
      duration: 5000,
      classNames: {
        toast: "group flex shadow-lg rounded-lg overflow-hidden bg-white dark:bg-card border border-border",
        title: "text-foreground font-medium text-sm",
        description: "text-muted-foreground text-xs",
        actionButton: "bg-primary text-primary-foreground",
      },
      icon: React.createElement("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 20 20",
        fill: "currentColor",
        className: "w-5 h-5"
      }, React.createElement("path", {
        fillRule: "evenodd",
        d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z",
        clipRule: "evenodd"
      })),
    });
  },
  error: (message: string, description?: string) => {
    return toast.error(message, {
      description,
      duration: 5000,
      classNames: {
        toast: "group flex shadow-lg rounded-lg overflow-hidden bg-white dark:bg-card border border-destructive/30 dark:border-destructive/30",
        title: "text-destructive font-medium text-sm",
        description: "text-destructive/80 text-xs",
        actionButton: "bg-primary text-primary-foreground",
      },
      icon: React.createElement("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 20 20",
        fill: "currentColor",
        className: "w-5 h-5 text-destructive"
      }, React.createElement("path", {
        fillRule: "evenodd",
        d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z",
        clipRule: "evenodd"
      })),
    });
  },
  info: (message: string, description?: string) => {
    return toast(message, {
      description,
      duration: 5000,
      classNames: {
        toast: "group flex shadow-lg rounded-lg overflow-hidden bg-white dark:bg-card border border-border",
        title: "text-foreground font-medium text-sm",
        description: "text-muted-foreground text-xs",
        actionButton: "bg-primary text-primary-foreground",
      },
      icon: React.createElement("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 20 20",
        fill: "currentColor",
        className: "w-5 h-5"
      }, React.createElement("path", {
        fillRule: "evenodd",
        d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z",
        clipRule: "evenodd"
      })),
    });
  },
  loading: (message: string, description?: string) => {
    return toast.loading(message, {
      description,
      classNames: {
        toast: "group flex shadow-lg rounded-lg overflow-hidden bg-white dark:bg-card border border-border",
        title: "text-foreground font-medium text-sm",
        description: "text-muted-foreground text-xs",
        actionButton: "bg-primary text-primary-foreground",
      },
      icon: React.createElement("div", {
        className: "animate-spin text-primary"
      }, React.createElement("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        width: "18",
        height: "18",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, [
        React.createElement("path", {
          key: "circle",
          d: "M21 12a9 9 0 1 1-6.219-8.56"
        })
      ])),
    });
  },
  promise: <T,>(
    promise: Promise<T>,
    { loading, success, error }: { loading: string; success: string; error: string }
  ) => {
    return toast.promise(promise, {
      loading: {
        title: loading,
        classNames: {
          toast: "group flex shadow-lg rounded-lg overflow-hidden bg-white dark:bg-card border border-border",
          title: "text-foreground font-medium text-sm",
        },
      },
      success: {
        title: success,
        classNames: {
          toast: "group flex shadow-lg rounded-lg overflow-hidden bg-white dark:bg-card border border-border",
          title: "text-foreground font-medium text-sm",
        },
        icon: React.createElement("svg", {
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 20 20", 
          fill: "currentColor",
          className: "w-5 h-5"
        }, React.createElement("path", {
          fillRule: "evenodd",
          d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z",
          clipRule: "evenodd"
        })),
      },
      error: {
        title: error,
        classNames: {
          toast: "group flex shadow-lg rounded-lg overflow-hidden bg-white dark:bg-card border border-border",
          title: "text-foreground font-medium text-sm",
        },
        icon: React.createElement("svg", {
          xmlns: "http://www.w3.org/2000/svg", 
          viewBox: "0 0 20 20", 
          fill: "currentColor",
          className: "w-5 h-5"
        }, React.createElement("path", {
          fillRule: "evenodd",
          d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z",
          clipRule: "evenodd"
        })),
      },
    });
  },
};