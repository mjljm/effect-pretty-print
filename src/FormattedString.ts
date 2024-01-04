import * as TCNumber from '@effect/typeclass/data/Number';
import * as TCString from '@effect/typeclass/data/String';
import { Equal, Function, Hash, Order, Predicate, ReadonlyArray, String, pipe } from 'effect';

const moduleTag = '@mjljm/effect-pretty-print/FormattedString/';

const TypeId: unique symbol = Symbol.for(moduleTag + 'TypeId');
type TypeId = typeof TypeId;

/**
 * MODEL
 * A string that may contain format characters, e.g css styles or unicode characters
 */
export interface Type extends Equal.Equal {
	readonly [TypeId]: TypeId;
	/**
	 * The underlying string
	 */
	readonly value: string;
	/**
	 * The length of the printable characters, i.e excluding all formatting characters
	 */
	readonly printedLength: number;
}

/**
 * Type guards
 */
export const isType = (u: unknown): u is Type => Predicate.hasProperty(u, TypeId);

/**
 * Constructors
 */

const prototype = {
	[Equal.symbol](this: Type, that: Equal.Equal): boolean {
		return isType(that) ? Equal.equals(this.value, that.value) : false;
	},
	[Hash.symbol](this: Type): number {
		return Hash.hash(this.value);
	}
};

const make = ({
	printedLength,
	value
}: Readonly<Omit<Type, TypeId | typeof Equal.symbol | typeof Hash.symbol>>): Type =>
	Object.create(prototype, {
		[TypeId]: { value: TypeId },
		value: { value },
		printedLength: { value: printedLength }
	}) as Type;

export const makeFromUnformattedString = (s: string): Type =>
	make({
		value: s,
		printedLength: s.length
	});

export const makeWithZeroLengthFormatFunction = (s: string, f: (i: string) => string): Type =>
	make({
		value: f(s),
		printedLength: s.length
	});

export const empty = () => makeFromUnformattedString('');

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
			value: pipe(sArr, ReadonlyArray.prepend(self.value), TCString.Monoid.combineAll),

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
			value: pipe(sArr, ReadonlyArray.append(self.value), TCString.Monoid.combineAll),

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
	(self: Type, n: number): Type =>
		make({
			value: String.repeat(n)(self.value),
			printedLength: n * self.printedLength
		})
);

export const isEmpty = (self: Type): boolean => self.printedLength === 0;

export const order = Order.mapInput(Order.string, (s: Type) => s.value);
