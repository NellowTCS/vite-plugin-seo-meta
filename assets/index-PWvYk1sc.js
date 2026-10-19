(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=e=>document.getElementById(e);function t(t){return e(t).value.trim()}function n(t){return e(t).checked}function r(e,t){navigator.clipboard.writeText(e).then(()=>{let e=t.textContent;t.textContent=`Copied`,setTimeout(()=>t.textContent=e,1200)})}function i(){let r=t(`url`)||`https://example.com`,i=t(`name`)||`My Site`,a=t(`title`)||`My Site`,o=t(`titleTemplate`)||`%s | My Site`,s=t(`description`)||`My awesome site`,c=t(`locale`)||`en_US`,l=t(`author`),u=t(`image`),d=t(`twitter`),f=n(`jsonLdOrg`),p=n(`jsonLdWeb`),m=n(`addHome`),h=n(`addAbout`),g=n(`addPrivate`),_=t(`robots`),v=t(`sitemap`),y=t(`validate`),b=[];b.push(`  site: {`),b.push(`    url: "${r}",`),b.push(`    name: "${i}",`),b.push(`    title: "${a}",`),b.push(`    titleTemplate: "${o}",`),b.push(`    description: "${s}",`),c&&b.push(`    locale: "${c}",`),l&&b.push(`    author: "${l}",`),u&&b.push(`    image: "${u}",`),d&&b.push(`    twitter: "${d}",`),(f||p)&&(b.push(`    jsonLd: {`),f&&b.push(`      organization: true,`),p&&b.push(`      website: true,`),b.push(`    },`)),b.push(`  },`);let x=[];m&&x.push(`    "/": { title: "Home" },`),h&&x.push(`    "/about": { title: "About" },`),g&&x.push(`    "/private": { title: "Private", noindex: true },`);let S=[];x.length&&S.push(`  pages: {\n${x.join(`
`)}\n  },`),_===`disallowNoindex`?S.push(`  robots: { disallowNoindex: true },`):_===`false`&&S.push(`  robots: false,`),v===`false`&&S.push(`  sitemap: false,`),y===`error`?S.push(`  validate: "error",`):y===`false`&&S.push(`  validate: false,`);let C=`import { defineConfig } from "vite";
import { seo } from "vite-plugin-seo-meta";

export default defineConfig({
  plugins: [
    seo({
      configFile: false,
${b.join(`
`)}
${S.join(`
`)}
    }),
  ],
});
`,w=`import { defineSeoConfig } from "vite-plugin-seo-meta";

export default defineSeoConfig({
${b.map(e=>e.replace(/^  /,``)).join(`
`)}
});
`;e(`inline`).textContent=C,e(`seo`).textContent=w}function a(){let t=e(`form`);t?.addEventListener(`input`,i),t?.addEventListener(`change`,i),e(`generate`)?.addEventListener(`click`,i),e(`copy-inline`)?.addEventListener(`click`,t=>r(e(`inline`).textContent||``,t.currentTarget)),e(`copy-seo`)?.addEventListener(`click`,t=>r(e(`seo`).textContent||``,t.currentTarget)),i()}a();