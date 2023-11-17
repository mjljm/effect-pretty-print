import * as FormattedString from '#internal/FormattedString';
import { MFunction, MStruct } from '@mjljm/effect-lib';
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
export const make = MStruct.make<Property>;

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
