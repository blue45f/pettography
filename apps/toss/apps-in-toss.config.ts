import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "pettography",
  brand: {
    primaryColor: "#5FB37A",
  },
  permissions: [
    { name: 'clipboard', access: 'read' },
    { name: 'clipboard', access: 'write' },
  ],
  webView: {},
  webBundleDir: "dist",
  navigationBar: { withBackButton: true, withHomeButton: true },
});
