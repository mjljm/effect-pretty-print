import * as MStruct from '@mjljm/effect-data-lib/effect/Struct';
import { Order } from 'effect';

/**
 * A string that may contain format characters, e.g css styles or unicode characters
 */
export interface FormattedString {
	/**
	 * The underlying string
	 */
	readonly value: string;
	/**
	 * The length of the printable characters, i.e excluding all formatting characters
	 */
	readonly printedLength: number;
}

export const FormattedString = MStruct.make<FormattedString>;

export const makeFromUnformattedString = (s: string): FormattedString =>
	FormattedString({
		value: s,
		printedLength: s.length
	});

export const append =
	(s: FormattedString) =>
	(self: FormattedString): FormattedString =>
		FormattedString({
			value: self.value + s.value,
			printedLength: self.printedLength + s.printedLength
		});

export const prepend =
	(s: FormattedString) =>
	(self: FormattedString): FormattedString =>
		FormattedString({
			value: s.value + self.value,
			printedLength: s.printedLength + self.printedLength
		});

export const appendUnformattedString =
	(s: string) =>
	(self: FormattedString): FormattedString =>
		FormattedString({
			value: self.value + s,
			printedLength: self.printedLength + s.length
		});

export const prependUnformattedString =
	(s: string) =>
	(self: FormattedString): FormattedString =>
		FormattedString({
			value: s + self.value,
			printedLength: s.length + self.printedLength
		});

/*export const repeat =
	(n: number) =>
	(self: FormattedString): FormattedString => ({
		value: String.repeat(n)(self.value),
		printedLength: n * self.printedLength
	});*/

export const byValue = Order.mapInput(Order.string, (s: FormattedString) => s.value);
