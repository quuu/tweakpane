import {InputParams} from '../../../api/types';
import {isEmpty} from '../../../misc/type-util';
import {
	CompositeConstraint,
	findConstraint,
} from '../../common/constraint/composite';
import {Constraint} from '../../common/constraint/constraint';
import {ListConstraint} from '../../common/constraint/list';
import {RangeConstraint} from '../../common/constraint/range';
import {StepConstraint} from '../../common/constraint/step';
import {
	createNumberFormatter,
	numberToString,
	parseNumber,
} from '../../common/converter/number';
import {numberFromUnknown} from '../../common/converter/number';
import {Value} from '../../common/model/value';
import {writePrimitive} from '../../common/writer/primitive';
import {InputBindingPlugin} from '../../input-binding';
import {
	findListItems,
	getBaseStep,
	getSuitableDecimalDigits,
	normalizeInputParamsOptions,
} from '../../util';
import {ListController} from '../common/controller/list';
import {NumberTextController} from './controller/number-text';
import {SliderTextController} from './controller/slider-text';

function createConstraint(params: InputParams): Constraint<number> {
	const constraints: Constraint<number>[] = [];

	if ('step' in params && !isEmpty(params.step)) {
		constraints.push(
			new StepConstraint({
				step: params.step,
			}),
		);
	}

	if (
		('max' in params && !isEmpty(params.max)) ||
		('min' in params && !isEmpty(params.min))
	) {
		constraints.push(
			new RangeConstraint({
				max: params.max,
				min: params.min,
			}),
		);
	}

	if ('options' in params && params.options !== undefined) {
		constraints.push(
			new ListConstraint({
				options: normalizeInputParamsOptions(params.options, numberFromUnknown),
			}),
		);
	}

	return new CompositeConstraint({
		constraints: constraints,
	});
}

function createController(doc: Document, value: Value<number>) {
	const c = value.constraint;

	if (c && findConstraint(c, ListConstraint)) {
		return new ListController(doc, {
			listItems: findListItems(c) ?? [],
			stringifyValue: numberToString,
			value: value,
		});
	}

	if (c && findConstraint(c, RangeConstraint)) {
		return new SliderTextController(doc, {
			baseStep: getBaseStep(c),
			formatter: createNumberFormatter(
				getSuitableDecimalDigits(value.constraint, value.rawValue),
			),
			parser: parseNumber,
			value: value,
		});
	}

	return new NumberTextController(doc, {
		baseStep: getBaseStep(c),
		formatter: createNumberFormatter(
			getSuitableDecimalDigits(value.constraint, value.rawValue),
		),
		parser: parseNumber,
		value: value,
	});
}

/**
 * @hidden
 */
export const NumberInputPlugin: InputBindingPlugin<number, number> = {
	id: 'input-number',
	binding: {
		accept: (value) => (typeof value === 'number' ? value : null),
		constraint: (args) => createConstraint(args.params),
		reader: (_args) => numberFromUnknown,
		writer: (_args) => writePrimitive,
	},
	controller: (args) => {
		return createController(args.document, args.binding.value);
	},
};