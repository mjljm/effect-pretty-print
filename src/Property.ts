import * as MFunction from "@mjljm/effect-lib/effect/Function";
import * as MStruct from "@mjljm/effect-lib/effect/Struct";
import * as FormattedString from "@mjljm/effect-pretty-print/FormattedString";
import { Order } from "effect";

/**
 * Model
 */
export interface Property {
  readonly originalKey: string | symbol;
  readonly key: FormattedString.FormattedString;
  readonly prefixedKey: FormattedString.FormattedString;
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
  (p: Property) => p.key,
);
export const byPrefixedName = Order.mapInput(
  FormattedString.byValue,
  (p: Property) => p.prefixedKey,
);
export const byLevel = Order.mapInput(Order.number, (p: Property) => p.level);
export const byLevelAndName = Order.combine(byLevel, byName);
