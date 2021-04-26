import {PickerLayout} from '../../../blade/common/api/types';
import {PopupController} from '../../../common/controller/popup';
import {TextController} from '../../../common/controller/text';
import {ValueController} from '../../../common/controller/value';
import {Formatter} from '../../../common/converter/formatter';
import {Parser} from '../../../common/converter/parser';
import {findNextTarget, supportsTouch} from '../../../common/dom-util';
import {PrimitiveValue} from '../../../common/model/primitive-value';
import {Value} from '../../../common/model/value';
import {ValueMap} from '../../../common/model/value-map';
import {connectValues} from '../../../common/model/value-sync';
import {ViewProps} from '../../../common/model/view-props';
import {forceCast} from '../../../misc/type-util';
import {Color} from '../model/color';
import {PickedColor} from '../model/picked-color';
import {ColorView} from '../view/color';
import {ColorPickerController} from './color-picker';
import {ColorSwatchController} from './color-swatch';

interface Config {
	expanded: boolean;
	formatter: Formatter<Color>;
	parser: Parser<Color>;
	pickerLayout: PickerLayout;
	supportsAlpha: boolean;
	value: Value<Color>;
	viewProps: ViewProps;
}

/**
 * @hidden
 */
export class ColorController implements ValueController<Color> {
	public readonly value: Value<Color>;
	public readonly view: ColorView;
	public readonly viewProps: ViewProps;
	private readonly swatchC_: ColorSwatchController;
	private readonly textC_: TextController<Color>;
	private readonly pickerC_: ColorPickerController;
	private readonly popC_: PopupController | null;
	private readonly expanded_: Value<boolean>;

	constructor(doc: Document, config: Config) {
		this.onButtonBlur_ = this.onButtonBlur_.bind(this);
		this.onButtonClick_ = this.onButtonClick_.bind(this);
		this.onPopupChildBlur_ = this.onPopupChildBlur_.bind(this);
		this.onPopupChildKeydown_ = this.onPopupChildKeydown_.bind(this);

		this.value = config.value;
		this.viewProps = config.viewProps;

		this.expanded_ = new PrimitiveValue(config.expanded);

		this.swatchC_ = new ColorSwatchController(doc, {
			value: this.value,
			viewProps: this.viewProps,
		});
		const buttonElem = this.swatchC_.view.buttonElement;
		buttonElem.addEventListener('blur', this.onButtonBlur_);
		buttonElem.addEventListener('click', this.onButtonClick_);

		this.textC_ = new TextController(doc, {
			parser: config.parser,
			props: new ValueMap({
				formatter: config.formatter,
			}),
			value: this.value,
			viewProps: this.viewProps,
		});

		this.view = new ColorView(doc, {
			expanded: this.expanded_,
			pickerLayout: config.pickerLayout,
		});
		this.view.swatchElement.appendChild(this.swatchC_.view.element);
		this.view.textElement.appendChild(this.textC_.view.element);

		this.popC_ =
			config.pickerLayout === 'popup'
				? new PopupController(doc, {
						viewProps: this.viewProps,
				  })
				: null;
		if (this.popC_) {
			this.view.element.appendChild(this.popC_.view.element);
			connectValues({
				primary: this.expanded_,
				secondary: this.popC_.shows,
				forward: (p) => p.rawValue,
				backward: (_, s) => s.rawValue,
			});
		}

		const pickerC = new ColorPickerController(doc, {
			pickedColor: new PickedColor(this.value),
			supportsAlpha: config.supportsAlpha,
			viewProps: this.viewProps,
		});
		pickerC.view.allFocusableElements.forEach((elem) => {
			elem.addEventListener('blur', this.onPopupChildBlur_);
			elem.addEventListener('keydown', this.onPopupChildKeydown_);
		});
		if (config.pickerLayout === 'popup') {
			this.popC_?.view.element.appendChild(pickerC.view.element);
		} else {
			this.view.pickerElement?.appendChild(pickerC.view.element);
		}
		this.pickerC_ = pickerC;
	}

	get textController(): TextController<Color> {
		return this.textC_;
	}

	private onButtonBlur_(e: FocusEvent) {
		if (!this.popC_) {
			return;
		}

		const elem = this.view.element;
		const nextTarget: HTMLElement | null = forceCast(e.relatedTarget);
		if (!nextTarget || !elem.contains(nextTarget)) {
			this.popC_.shows.rawValue = false;
		}
	}

	private onButtonClick_() {
		this.expanded_.rawValue = !this.expanded_.rawValue;
		if (this.expanded_.rawValue) {
			this.pickerC_.view.allFocusableElements[0].focus();
		}
	}

	private onPopupChildBlur_(ev: FocusEvent): void {
		if (!this.popC_) {
			return;
		}

		const elem = this.popC_.view.element;
		const nextTarget = findNextTarget(ev);
		if (nextTarget && elem.contains(nextTarget)) {
			// Next target is in the picker
			return;
		}
		if (
			nextTarget &&
			nextTarget === this.swatchC_.view.buttonElement &&
			!supportsTouch(elem.ownerDocument)
		) {
			// Next target is the trigger button
			return;
		}

		this.popC_.shows.rawValue = false;
	}

	private onPopupChildKeydown_(ev: KeyboardEvent): void {
		if (!this.popC_) {
			return;
		}

		if (ev.key === 'Escape') {
			this.popC_.shows.rawValue = false;
		}
	}
}