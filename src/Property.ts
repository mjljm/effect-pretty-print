import * as FormattedString from '#mjljm/effect-pretty-print/FormattedString';
import { MFunction } from '@mjljm/effect-lib';
import { Order } from 'effect';

/**
 * Model
 */
export interface Property {
	readonly originalKey: string | symbol;
	readonly key: FormattedString.Type;
	readonly prefixedKey: FormattedString.Type;
	readonly value: MFunction.Unknown;
	readonly level: number;
}

/**
 * Constructor
 */
export const make = MFunction.makeReadonly<Property>;

/**
 * Orders
 */
export const byName = Order.mapInput(
	FormattedString.byValue,
	(p: Property) => p.key
);
export const byPrefixedName = Order.mapInput(
	FormattedString.byValue,
	(p: Property) => p.prefixedKey
);
export const byLevel = Order.mapInput(Order.number, (p: Property) => p.level);
export const byLevelAndName = Order.combine(byLevel, byName);
