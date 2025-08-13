import type { PluginOption } from 'vite';
import { minify, Options } from 'html-minifier-terser';

const minifyOptions: Options = {
  collapseBooleanAttributes: true,
  collapseWhitespace: true,
  removeComments: true,
  removeEmptyAttributes: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  sortAttributes: true,
  sortClassName: true,
  useShortDoctype: true,
  minifyCSS: true,
  minifyJS: {
    format: {
      comments: false,
    },
  },
};

export default function htmlMinify(): PluginOption {
  return {
    name: 'vite-plugin-html-minify',
    apply: 'build', // Apply this plugin only during build, not serve
    enforce: 'post', // Run after other plugins

    async transformIndexHtml(html) {
      try {
        const minifiedHtml = await minify(html, minifyOptions);
        console.log('HTML minified successfully!');
        return minifiedHtml;
      } catch (error) {
        console.error('Failed to minify HTML:', error);
        return html; // Return original HTML on error
      }
    },
  };
}
