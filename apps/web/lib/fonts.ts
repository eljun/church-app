import localFont from 'next/font/local'

// Gilroy Font Family
export const gilroy = localFont({
  src: [
    {
      path: '../public/fonts/Gilroy-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/Gilroy-LightItalic.ttf',
      weight: '300',
      style: 'italic',
    },
    {
      path: '../public/fonts/Gilroy-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Gilroy-RegularItalic.ttf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../public/fonts/Gilroy-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Gilroy-MediumItalic.ttf',
      weight: '500',
      style: 'italic',
    },
    {
      path: '../public/fonts/Gilroy-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/Gilroy-SemiBoldItalic.ttf',
      weight: '600',
      style: 'italic',
    },
    {
      path: '../public/fonts/Gilroy-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/Gilroy-BoldItalic.ttf',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-gilroy',
  display: 'swap',
})

// Agenor Neue Font Family
export const agenorNeue = localFont({
  src: [
    {
      path: '../public/fonts/AgenorNeue-Thin.otf',
      weight: '100',
      style: 'normal',
    },
    {
      path: '../public/fonts/AgenorNeue-Light.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/AgenorNeue-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/AgenorNeue-SemiBold.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/AgenorNeue-Bold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/AgenorNeue-ExtraBold.otf',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../public/fonts/AgenorNeue-Black.otf',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-agenor',
  display: 'swap',
})
