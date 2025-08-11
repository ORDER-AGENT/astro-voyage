"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
  //SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import sidebarMenuItems from "@/data/sidebar-menu-items.json";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, type LucideIcon } from "lucide-react"
import * as LucideIcons from "lucide-react";

type SubMenuItem = {
  title: string;
  href: string;
};

type MenuItem = {
  title: string;
  href?: string;
  icon: keyof typeof LucideIcons; // LucideIconsのキーとしてアイコン名を指定
  submenu?: SubMenuItem[];
};

export default function SidebarLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="text-lg font-bold truncate group-data-[collapsible=icon]:size-2!">Astro-Voyage</div>
          {
            //<SidebarTrigger className="mb-2" />
          }
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu className="p-2">
            {(sidebarMenuItems as MenuItem[]).map((item) => { // 型アサーションを追加
              const hasSub = !!item.submenu?.length
              const isActive =
                pathname === item.href ||
                (hasSub && item.submenu!.some((sub) => pathname.startsWith(sub.href)))

              // 動的にアイコンコンポーネントを取得し、LucideIcon型にアサーションします
              const IconComponent = item.icon ? (LucideIcons[item.icon] as LucideIcon) : null;

              if (hasSub) {
                // サブメニューあり
                return (
                  <Collapsible key={item.title} asChild defaultOpen className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          className="cursor-pointer"
                          isActive={isActive}
                          tooltip={item.title}
                        >
                          {IconComponent && <IconComponent />}
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.submenu!.map((subItem, subIndex) => (
                            <SidebarMenuSubItem key={subIndex} className="whitespace-nowrap">
                              <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                                <Link href={subItem.href}>{subItem.title}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              }

              // サブメニューなし: そのままリンク
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                    <Link href={item.href || "#"} className="flex items-center">
                      {IconComponent && <IconComponent />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      {children}
    </SidebarProvider>
  );
}