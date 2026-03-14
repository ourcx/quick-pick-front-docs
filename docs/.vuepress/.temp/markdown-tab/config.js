import { CodeTabs } from "/Users/zhuxinhao/quick-pick-front-docs/vuepress-starter/node_modules/.pnpm/@vuepress+plugin-markdown-tab@2.0.0-rc.86_markdown-it@14.1.1_vuepress@2.0.0-rc.20_@vuep_03e6b0e5cec90c53cfb1e91bbc2098ea/node_modules/@vuepress/plugin-markdown-tab/lib/client/components/CodeTabs.js";
import { Tabs } from "/Users/zhuxinhao/quick-pick-front-docs/vuepress-starter/node_modules/.pnpm/@vuepress+plugin-markdown-tab@2.0.0-rc.86_markdown-it@14.1.1_vuepress@2.0.0-rc.20_@vuep_03e6b0e5cec90c53cfb1e91bbc2098ea/node_modules/@vuepress/plugin-markdown-tab/lib/client/components/Tabs.js";
import "/Users/zhuxinhao/quick-pick-front-docs/vuepress-starter/node_modules/.pnpm/@vuepress+plugin-markdown-tab@2.0.0-rc.86_markdown-it@14.1.1_vuepress@2.0.0-rc.20_@vuep_03e6b0e5cec90c53cfb1e91bbc2098ea/node_modules/@vuepress/plugin-markdown-tab/lib/client/styles/vars.css";

export default {
  enhance: ({ app }) => {
    app.component("CodeTabs", CodeTabs);
    app.component("Tabs", Tabs);
  },
};
