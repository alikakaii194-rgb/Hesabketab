
'use client';
import type { ComponentProps, HTMLAttributes, ReactNode } from 'react';
import React, { createContext, useContext, useState, useMemo } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { cn } from '@/lib/utils';


const sidebarStyles = tv({
  slots: {
    base: 'flex flex-col bg-card text-card-foreground',
    header: 'p-4 border-b border-border',
    content: 'flex-1 overflow-y-auto',
    menu: 'flex flex-col gap-1 p-2',
    menuItem: 'flex items-center',
    menuButton: 'group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
    menuButtonIcon: 'size-5',
    menuButtonTooltip: 'invisible absolute left-full ml-2 -translate-y-1/2 rounded-md bg-popover px-2 py-1 text-sm font-medium text-popover-foreground shadow-md group-hover:visible',
    footer: 'p-4 border-t border-border mt-auto',
  },
  variants: {
    side: {
      left: { base: 'border-r border-border' },
      right: { base: 'border-l border-border' },
    },
    collapsed: {
      true: {
        menuButton: 'justify-center',
      },
      false: {},
    },
  },
  defaultVariants: {
    side: 'left',
    collapsed: false,
  },
});

interface SidebarContextProps extends VariantProps<typeof sidebarStyles> {
  isCollapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isCollapsed, setCollapsed] = useState(false);
  const value = useMemo(() => ({ isCollapsed, setCollapsed }), [isCollapsed]);

  return (
    <SidebarContext.Provider value={value}>
      <div className="flex h-screen overflow-hidden">{children}</div>
    </SidebarContext.Provider>
  );
};

interface SidebarProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof sidebarStyles> {}

export const Sidebar = ({ className, side, ...props }: SidebarProps) => {
  const { isCollapsed } = useSidebar();
  const { base } = sidebarStyles({ collapsed: isCollapsed, side });

  return (
    <div
      className={cn(base(), className)}
      data-collapsed={isCollapsed}
      {...props}
    />
  );
};

export const SidebarHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  const { header } = sidebarStyles();
  return <div className={cn(header(), className)} {...props} />;
};

export const SidebarContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  const { content } = sidebarStyles();
  return <div className={cn(content(), className)} {...props} />;
};

export const SidebarMenu = ({ className, ...props }: HTMLAttributes<HTMLUListElement>) => {
  const { menu } = sidebarStyles();
  return <ul className={cn(menu(), className)} {...props} />;
};

export const SidebarMenuItem = (props: HTMLAttributes<HTMLLIElement>) => {
  const { menuItem } = sidebarStyles();
  return <li className={cn(menuItem())} {...props} />;
};

interface SidebarMenuButtonProps extends ComponentProps<'button'> {
  isActive?: boolean;
  tooltip?: string;
  children: ReactNode;
}

export const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ className, isActive, tooltip, children, ...props }, ref) => {
    const { isCollapsed } = useSidebar();
    const { menuButton, menuButtonTooltip } = sidebarStyles({ collapsed: isCollapsed });

    return (
      <button
        ref={ref}
        className={cn(menuButton(), isActive && 'bg-muted', className)}
        {...props}
      >
        {children}
        {isCollapsed && tooltip && (
          <span className={cn(menuButtonTooltip())}>{tooltip}</span>
        )}
      </button>
    );
  }
);
SidebarMenuButton.displayName = 'SidebarMenuButton';

export const SidebarFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  const { footer } = sidebarStyles();
  return <div className={cn(footer(), className)} {...props} />;
};
