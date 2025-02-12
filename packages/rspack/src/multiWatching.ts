/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/MultiWatching.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */

import { MultiCompiler } from "./multiCompiler";
import Watching from "./watching";
import asyncLib from "neo-async";
import { Callback } from "tapable";

/** @typedef {import("./multiCompiler")} MultiCompiler */
/** @typedef {import("./watching")} Watching */

/**
 * @template T
 * @callback Callback
 * @param {(Error | null)=} err
 * @param {T=} result
 */

class MultiWatching {
	watchings: Watching[];
	compiler: MultiCompiler;

	/**
	 * @param {Watching[]} watchings child compilers' watchers
	 * @param {MultiCompiler} compiler the compiler
	 */
	constructor(watchings: Watching[], compiler: MultiCompiler) {
		this.watchings = watchings;
		this.compiler = compiler;
	}
	// @ts-expect-error
	invalidate(callback) {
		if (callback) {
			asyncLib.each(
				this.watchings,
				(watching, callback) => watching.invalidate(callback),
				callback
			);
		} else {
			for (const watching of this.watchings) {
				watching.invalidate();
			}
		}
	}

	/**
	 * @param {Callback<void>} callback signals when the watcher is closed
	 * @returns {void}
	 */
	// @ts-expect-error
	close(callback) {
		asyncLib.forEach(
			this.watchings,
			(watching, finishedCallback) => {
				watching.close(finishedCallback);
			},
			err => {
				this.compiler.hooks.watchClose.call();
				if (typeof callback === "function") {
					this.compiler.running = false;
					callback(err);
				}
			}
		);
	}
}

export default MultiWatching;
