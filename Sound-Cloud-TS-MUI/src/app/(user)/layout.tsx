import * as React from 'react';
import ThemeRegistry from '@/components/theme-registry/theme.registry';
import AppFooter from '@/components/footer/app.footer';
import AppHeader from '@/components/headers/app.header';
import '@/styles/app.css'
import {Metadata} from "next";
export const metadata:Metadata ={
    title:'Discover the top streamed music and songs online DJ music',
    description:'DJ music'
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      <>
        <AppHeader />
        {children}
        <AppFooter />
      </>

  );
}
