import * as FormattedString from '#mjljm/effect-pretty-print/FormattedString';
import * as Options from '#mjljm/effect-pretty-print/Options';
import * as Properties from '#mjljm/effect-pretty-print/Properties';
import * as Property from '#mjljm/effect-pretty-print/Property';
import { MFunction, MMatch, Tree } from '@mjljm/effect-lib';
import { Match, Option, ReadonlyArray, Tuple, pipe } from 'effect';

//const moduleTag = '@mjljm/effect-pretty-print/stringify/';

const _ = Options._;

/**
 * Model
 */
interface Node {
	readonly key: FormattedString.Type;
	readonly formatOrValue: Options.ComplexTypeFormat | FormattedString.Type;
}

/**
 * Constructors
 */
const Node = MFunction.make<Node>;

/**
 * Pretty prints an object.
 *
 * @param u The object to print
 *
 */
export function stringify(u: unknown, options?: Options.Type): FormattedString.Type {
	// Merge default options with user's options
	const finalOptions = Options.makeAllRequired({ ...Options.basic, ...options });

	const formatProperty = (key: FormattedString.Type, value: FormattedString.Type): FormattedString.Type =>
		FormattedString.isEmpty(key)
			? value
			: FormattedString.concat(key, finalOptions.objectFormat.propertySeparator, value);

	const formatSimpleValue = (value: MFunction.Primitive | MFunction.Function): FormattedString.Type =>
		pipe(
			Match.type<MFunction.Primitive | MFunction.Function>(),
			Match.when(Match.string, (s) => _("'" + s + "'")),
			Match.when(Match.number, (n) => _(n.toString())),
			Match.when(Match.bigint, (n) => _(n.toString())),
			Match.when(Match.boolean, (b) => _(b.toString())),
			Match.when(Match.symbol, (s) => _(s.toString())),
			Match.when(Match.undefined, () => _('undefined')),
			Match.when(Match.null, () => _('null')),
			Match.when(MMatch.function, () => _('Function()')),
			Match.exhaustive
		)(value);

	function formatComplexValue(
		baseFormat: Options.ComplexTypeFormat,
		children: ReadonlyArray<FormattedString.Type>,
		withLineBreaks: boolean,
		level: number
	): FormattedString.Type {
		const currentTab = FormattedString.concat(finalOptions.initialTab, FormattedString.repeat(finalOptions.tab, level));

		const nextTab = FormattedString.concat(currentTab, finalOptions.tab);

		const format = withLineBreaks
			? {
					startMark: FormattedString.concat(baseFormat.startMark, finalOptions.linebreak, nextTab),
					endMark: FormattedString.concat(finalOptions.linebreak, currentTab, baseFormat.endMark),
					separator: FormattedString.concat(baseFormat.separator, finalOptions.linebreak, nextTab)
			  }
			: baseFormat;

		return FormattedString.concat(
			format.startMark,
			pipe(children, FormattedString.join(format.separator)),
			format.endMark
		);
	}

	return pipe(
		Tree.unfold({
			seed: Property.makeFromValue(u as MFunction.Unknown),
			unfoldfunction: (nextSeed, isCircular) => {
				const makeLeaf = (key: FormattedString.Type, value: FormattedString.Type) =>
					Tuple.make(
						Node({
							key,
							formatOrValue: value
						}),
						ReadonlyArray.empty<Property.Type>()
					);
				return isCircular
					? makeLeaf(nextSeed.prefixedKey, _('Circular'))
					: pipe(
							finalOptions.formatter(nextSeed.value),
							Option.map((value) => makeLeaf(nextSeed.prefixedKey, value)),
							Option.getOrElse(() =>
								pipe(
									Match.type<MFunction.Unknown>(),
									Match.when(Match.record, (obj) =>
										Tuple.make(
											Node({
												key: nextSeed.prefixedKey,
												formatOrValue: finalOptions.objectFormat
											}),
											Properties.fromRecord(obj, finalOptions)
										)
									),
									Match.when(MMatch.array, (arr) =>
										Tuple.make(
											Node({
												key: nextSeed.prefixedKey,
												formatOrValue: finalOptions.arrayFormat
											}),
											Properties.fromArray(arr)
										)
									),
									Match.orElse((value) => makeLeaf(nextSeed.prefixedKey, formatSimpleValue(value)))
								)(nextSeed.value)
							)
					  );
			},
			memoize: true
		}),
		Tree.fold(({ formatOrValue, key }, transformedChildren, level) =>
			formatProperty(
				key,
				FormattedString.isType(formatOrValue)
					? formatOrValue
					: pipe(formatComplexValue(formatOrValue, transformedChildren, false, level), (formatted) =>
							formatted.printedLength <= finalOptions.noLineBreakIfShorterThan
								? formatted
								: formatComplexValue(formatOrValue, transformedChildren, true, level)
					  )
			)
		)
	);
}
