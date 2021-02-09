import {assert} from 'chai';
import {describe, it} from 'mocha';

import {PaneError} from '../misc/pane-error';
import {TestUtil} from '../misc/test-util';
import {PlainTweakpane} from './plain-tweakpane';

describe(PlainTweakpane.name, () => {
	it('should dispose with default container', () => {
		const doc = TestUtil.createWindow().document;
		const c = new PlainTweakpane({
			document: doc,
		});

		assert.strictEqual(doc.body.hasChildNodes(), true);
		c.dispose();
		assert.strictEqual(doc.body.hasChildNodes(), false);
	});

	it('should dispose with specified container', () => {
		const doc = TestUtil.createWindow().document;
		const containerElem = doc.createElement('div');
		doc.body.appendChild(containerElem);

		const c = new PlainTweakpane({
			container: containerElem,
			document: doc,
		});
		c.dispose();

		assert.strictEqual(doc.body.contains(containerElem), true);
		assert.strictEqual(containerElem.hasChildNodes(), false);
	});

	it("should throw 'alreadyDisposed' error", () => {
		const doc = TestUtil.createWindow().document;
		const c = new PlainTweakpane({
			document: doc,
		});
		c.dispose();
		assert.throws(() => {
			c.dispose();
		}, PaneError);
	});

	it('should expanded by default', () => {
		const doc = TestUtil.createWindow().document;
		const c = new PlainTweakpane({
			document: doc,
			title: 'Title',
		});
		assert.strictEqual(c.controller.folder?.expanded, true);
	});

	it('should shrink by default with `expanded: false` option', () => {
		const doc = TestUtil.createWindow().document;
		const c = new PlainTweakpane({
			document: doc,
			expanded: false,
			title: 'Title',
		});
		assert.strictEqual(c.controller.folder?.expanded, false);
	});
});