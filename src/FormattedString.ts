import { MFunction } from '@mjljm/effect-lib';
import { Order } from 'effect';

/**
 * A string that may contain format characters, e.g css styles or unicode characters
 */
export interface Type {
	/**
	 * The underlying string
	 */
	readonly value: string;
	/**
	 * The length of the printable characters, i.e excluding all formatting characters
	 */
	readonly printedLength: number;
}

export const make = MFunction.makeReadonly<Type>;

export const makeFromUnformattedString = (s: string): Type =>
	make({
		value: s,
		printedLength: s.length
	});

export const makeWithZeroLengthFormatFunction = (
	s: string,
	f: (i: string) => string
): Type =>
	make({
		value: f(s),
		printedLength: s.length
	});

export const append =
	(s: Type) =>
	(self: Type): Type =>
		make({
			value: self.value + s.value,
			printedLength: self.printedLength + s.printedLength
		});

export const prepend =
	(s: Type) =>
	(self: Type): Type =>
		make({
			value: s.value + self.value,
			printedLength: s.printedLength + self.printedLength
		});

export const appendUnformattedString =
	(s: string) =>
	(self: Type): Type =>
		make({
			value: self.value + s,
			printedLength: self.printedLength + s.length
		});

export const prependUnformattedString =
	(s: string) =>
	(self: Type): Type =>
		make({
			value: s + self.value,
			printedLength: s.length + self.printedLength
		});

/*export const repeat =
	(n: number) =>
	(self: Type): Type => ({
		value: String.repeat(n)(self.value),
		printedLength: n * self.printedLength
	});*/

export const byValue = Order.mapInput(Order.string, (s: Type) => s.value);
