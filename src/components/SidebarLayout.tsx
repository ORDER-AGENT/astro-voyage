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
  SidebarInset,
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
import * as FaIcons from "react-icons/fa"; // react-icons/fa をインポート

type IconType = keyof typeof LucideIcons | keyof typeof FaIcons; // LucideIconsとFaIconsのキーを結合

type SubMenuItem = {
  title: string;
  href: string;
  icon?: IconType; // IconTypeを使用
};

type MenuItem = {
  title: string;
  href?: string;
  icon: IconType; // IconTypeを使用
  submenu?: SubMenuItem[];
  isExternal?: boolean; // 外部リンクかどうかを示すプロパティを追加
};

export default function SidebarLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  const getIconComponent = (iconName: IconType) => {
    if (iconName in LucideIcons) {
      return (LucideIcons[iconName as keyof typeof LucideIcons] as LucideIcon);
    }
    if (iconName in FaIcons) {
      return (FaIcons[iconName as keyof typeof FaIcons] as LucideIcon); // FaIconsもLucideIconとして扱う
    }
    return null;
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <LucideIcons.Rocket className="!size-5" />
                <span className="text-base font-semibold">Astro-Voyage</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu className="p-2">
            {(sidebarMenuItems as MenuItem[]).map((item) => {
              const hasSub = !!item.submenu?.length
              const isActive =
                pathname === item.href ||
                (hasSub && item.submenu!.some((sub) => pathname.startsWith(sub.href)))

              const IconComponent = item.icon ? getIconComponent(item.icon) : null;

              if (hasSub) {
                // サブメニューあり
                return (
                  <Collapsible key={item.title} asChild defaultOpen className="group/collapsible">
                    <SidebarMenuItem className="whitespace-nowrap">
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
                          {item.submenu!.map((subItem, subIndex) => {
                            const SubIconComponent = subItem.icon ? getIconComponent(subItem.icon) : null;
                            return (
                              <SidebarMenuSubItem key={subIndex} className="whitespace-nowrap">
                                <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                                  <Link href={subItem.href}>
                                    {SubIconComponent && <SubIconComponent />}
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            )
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              }

              // サブメニューなし: そのままリンク
              return (
                <SidebarMenuItem key={item.title} className="whitespace-nowrap">
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                    <Link
                      href={item.href || "#"}
                      className="flex items-center"
                      target={item.isExternal ? "_blank" : "_self"} // isExternalがtrueの場合、新しいタブで開く
                      rel={item.isExternal ? "noopener noreferrer" : undefined} // セキュリティ対策
                    >
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
      <SidebarInset className="min-w-0">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}