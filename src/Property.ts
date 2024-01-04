import * as FormattedString from '#mjljm/effect-pretty-print/FormattedString';
import * as Options from '#mjljm/effect-pretty-print/Options';
import { MFunction } from '@mjljm/effect-lib';
import { Equal, Hash, Order, Predicate } from 'effect';

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
	readonly prefixedKey: FormattedString.Type;
	readonly value: MFunction.Unknown;
	readonly level: number;
}

/**
 * Type guards
 */
export const isType = (u: unknown): u is Type => Predicate.hasProperty(u, TypeId);

/**
 * Constructors
 */

const prototype = {
	// For circularity and memoization, use value object as equality
	[Equal.symbol](this: Type, that: Equal.Equal): boolean {
		return isType(that) ? Equal.equals(this.value, that.value) : false;
	},
	[Hash.symbol](this: Type): number {
		return Hash.hash(this.value);
	}
};

export const make = ({
	key,
	level,
	originalKey,
	prefixedKey,
	value
}: Readonly<Omit<Type, TypeId | typeof Equal.symbol | typeof Hash.symbol>>): Type =>
	Object.create(prototype, {
		[TypeId]: { value: TypeId },
		originalKey: { value: originalKey },
		key: { value: key },
		prefixedKey: { value: prefixedKey },
		value: { value },
		level: { value: level }
	}) as Type;

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
export const byPrefixedKey = Order.mapInput(FormattedString.order, (p: Type) => p.prefixedKey);
export const byLevel = Order.mapInput(Order.number, (p: Type) => p.level);
export const byLevelAndKey = Order.combine(byLevel, byKey);
