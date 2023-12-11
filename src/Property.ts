import * as FormattedString from '#mjljm/effect-pretty-print/FormattedString';
import * as Options from '#mjljm/effect-pretty-print/Options';
import { MFunction } from '@mjljm/effect-lib';
import { Data, Equal, Hash, Order } from 'effect';

const _ = Options._;
/**
 * Model
 */
export class Type extends Data.Class<{
	readonly originalKey: string | symbol;
	readonly key: FormattedString.Type;
	readonly prefixedKey: FormattedString.Type;
	readonly value: MFunction.Unknown;
	readonly level: number;
}> {
	[Equal.symbol] = (that: Equal.Equal): boolean =>
		that instanceof Type
			? Equal.equals(this.prefixedKey, that.prefixedKey)
			: false;
	[Hash.symbol] = (): number => Hash.hash(this.prefixedKey);
}

export const makeFromValue = (value: MFunction.Unknown) =>
	new Type({
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
