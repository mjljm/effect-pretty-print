import * as FormattedString from '#mjljm/effect-pretty-print/FormattedString';
import * as Options from '#mjljm/effect-pretty-print/Options';
import { MFunction } from '@mjljm/effect-lib';
import { Equal, Hash, Order } from 'effect';

const moduleTag = '@mjljm/effect-pretty-print/Property/';

const TypeId: unique symbol = Symbol.for(moduleTag + 'TypeId');
type TypeId = typeof TypeId;

const _ = Options._;
/**
 * Model
 */
export interface Type extends Equal.Equal {
	readonly [TypeId]: TypeId;
	readonly originalKey: string | symbol;
	readonly key: FormattedString.Type;
	readonly value: MFunction.Unknown;
}

/**
 * Type guards
 */
export const isType = MFunction.isOfId<Type>(TypeId);

/**
 * Constructors
 */

const prototype = {
	// For circularity and memoization, check equality on values. If values are objects, object reference is used.
	[Equal.symbol](this: Type, that: Equal.Equal): boolean {
		return isType(that) ? this.value === that.value : false;
	},
	[Hash.symbol](this: Type): number {
		return Hash.hash(this.value);
	}
};

export const make = MFunction.makeWithId<Type>(TypeId, prototype);

export const makeFromValue = (value: MFunction.Unknown) =>
	make({
		originalKey: '',
		key: _(''),
		value
	});

/**
 * Orders
 */
export const byKey = Order.mapInput(FormattedString.order, (p: Type) => p.key);
