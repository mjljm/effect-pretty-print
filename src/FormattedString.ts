import * as TCNumber from '@effect/typeclass/data/Number';
import * as TCString from '@effect/typeclass/data/String';
import { MFunction } from '@mjljm/effect-lib';
import { Function, Order, ReadonlyArray, String, pipe } from 'effect';

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

export const empty = () => makeFromUnformattedString('');

export const makeWithZeroLengthFormatFunction = (
	s: string,
	f: (i: string) => string
): Type =>
	make({
		value: f(s),
		printedLength: s.length
	});

export const concat = (...sArr: ReadonlyArray<Type>): Type =>
	make({
		value: pipe(
			sArr,
			ReadonlyArray.map((s) => s.value),
			TCString.Monoid.combineAll
		),

		printedLength: pipe(
			sArr,
			ReadonlyArray.map((s) => s.printedLength),
			TCNumber.MonoidSum.combineAll
		)
	});

export const appendUnformattedString: {
	(...sArr: ReadonlyArray<string>): (self: Type) => Type;
	(self: Type, ...sArr: ReadonlyArray<string>): Type;
} = Function.dual(
	2,
	(self: Type, ...sArr: ReadonlyArray<string>): Type =>
		make({
			value: pipe(
				sArr,
				ReadonlyArray.prepend(self.value),
				TCString.Monoid.combineAll
			),

			printedLength: pipe(
				sArr,
				ReadonlyArray.map((s) => s.length),
				ReadonlyArray.append(self.printedLength),
				TCNumber.MonoidSum.combineAll
			)
		})
);

export const prependUnformattedString: {
	(...sArr: ReadonlyArray<string>): (self: Type) => Type;
	(self: Type, ...sArr: ReadonlyArray<string>): Type;
} = Function.dual(
	2,
	(self: Type, ...sArr: ReadonlyArray<string>): Type =>
		make({
			value: pipe(
				sArr,
				ReadonlyArray.append(self.value),
				TCString.Monoid.combineAll
			),

			printedLength: pipe(
				sArr,
				ReadonlyArray.map((s) => s.length),
				ReadonlyArray.append(self.printedLength),
				TCNumber.MonoidSum.combineAll
			)
		})
);

export const join =
	(sep: Type) =>
	(sArr: Iterable<Type>): Type => {
		let first = true;
		let result = empty();
		for (const s of sArr) {
			result = concat(result, first ? s : concat(sep, s));
			first = false;
		}
		return result;
	};

export const repeat: {
	(n: number): (self: Type) => Type;
	(self: Type, n: number): Type;
} = Function.dual(
	2,
	(self: Type, n: number): Type => ({
		value: String.repeat(n)(self.value),
		printedLength: n * self.printedLength
	})
);

export const isEmpty = (self: Type): boolean => self.printedLength === 0;

export const order = Order.mapInput(Order.string, (s: Type) => s.value);
