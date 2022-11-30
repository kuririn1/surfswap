import { sveltekit } from '@sveltejs/kit/vite';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit(),
		NodeGlobalsPolyfillPlugin()],
	define: {
		global: {}
	}
};

export default config;
