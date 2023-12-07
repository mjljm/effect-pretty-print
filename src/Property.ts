import * as FormattedString from '#mjljm/effect-pretty-print/FormattedString';
import * as Options from '#mjljm/effect-pretty-print/Options';
import { MFunction } from '@mjljm/effect-lib';
import { Order } from 'effect';

const _ = Options._;
/**
 * Model
 */
export interface Type {
	readonly originalKey: string | symbol;
	readonly key: FormattedString.Type;
	readonly prefixedKey: FormattedString.Type;
	readonly value: MFunction.Unknown;
	readonly level: number;
}

/**
 * Constructor
 */
export const make = MFunction.makeReadonly<Type>;
export const makeFromValue = (value: MFunction.Unknown) =>
	make({
		originalKey: '',
		key: _(''),
		prefixedKey: _(''),
		value,
		level: 0
	});

/**
 * Orders
 */
export const byKey = Order.mapInput(FormattedString.order, (p: Type) => p.key);
export const byPrefixedKey = Order.mapInput(
	FormattedString.order,
	(p: Type) => p.prefixedKey
);
export const byLevel = Order.mapInput(Order.number, (p: Type) => p.level);
export const byLevelAndKey = Order.combine(byLevel, byKey);
