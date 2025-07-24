import { defineConfig } from 'vitepress'
import pkgJson from '../../package.json';

// HTML title
export const TITLE = 'Ethers-Opt';
export const HOMEPAGE = 'https://ethers-opt.com';
export const REPO = 'https://github.com/cpuchain/ethers-opt';
export const NPMJS = 'https://npmjs.com/package/ethers-opt';
export const LOGO = '/logo.png';

// https://vitepress.dev/reference/site-config
export const getConfig = defineConfig({
  sitemap: {
    hostname: HOMEPAGE,
  },

  title: TITLE,

  description: pkgJson.description,

  head: [
    ['link', { rel: 'icon', href: LOGO }],

    ['link', { rel: 'canonical', href: HOMEPAGE }],
    ['link', { rel: 'canonical', href: REPO }],
    ['link', { rel: 'canonical', href: NPMJS }],
    ['meta', { name: 'description', content: pkgJson.description }],
    ['meta', { name: 'keywords', content: (pkgJson.keywords || []).join(',') || pkgJson.name }],

    // og
    ['meta', { property: 'og:title', content: TITLE }],
    ['meta', { property: 'og:description', content: pkgJson.description }],
    ['meta', { property: 'og:image', content: LOGO }],
    ['meta', { property: 'og:url', content: HOMEPAGE }],

    // seo
    ['meta', { name: 'robots', content: 'index,follow' }],
    ['meta', { name: 'googlebot', content: 'index,follow' }],
  ],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: LOGO,

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Github', link: REPO },
      {
        text: `v${pkgJson.version}`,
        items: [
          { text: 'Package', link: NPMJS },
          //{ text: 'Changelog', link: 'https://github.com/cpuchain/ethers-opt/blob/main/CHANGELOG.md' },
        ]
      },
      { text: 'Examples', link: '/examples' }
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Code Examples', link: '/examples' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'homepage', link: 'https://cpuchain.org' },
      { icon: 'github', link: REPO },
      { icon: 'telegram', link: 'https://t.me/cpuchainofficial' },
    ],

    footer: {
      message: `
        Released under the 
        <a href="https://opensource.org/licenses/MIT" target="_blank" class="footer-year">MIT License</a>.
      `,
      copyright: 'Copyright © 2025 CPUchain'
    },
  }
})

export default getConfig;
