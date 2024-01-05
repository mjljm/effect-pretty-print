import * as FormattedString from '#mjljm/effect-pretty-print/FormattedString';
import * as Options from '#mjljm/effect-pretty-print/Options';
import * as Properties from '#mjljm/effect-pretty-print/Properties';
import * as Property from '#mjljm/effect-pretty-print/Property';
import { MFunction, MMatch, Tree } from '@mjljm/effect-lib';
import { Function, Match, Option, ReadonlyArray, Tuple, pipe } from 'effect';

//const moduleTag = '@mjljm/effect-pretty-print/stringify/';

const _ = Options._;

const CIRCULAR = 'Circular';
/**
 * Model
 */
interface Node {
	readonly key: FormattedString.Type;
	readonly formatParams: Options.ComplexTypeFormat | FormattedString.Type | MFunction.Primitive | MFunction.Function;
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
		const format = withLineBreaks
			? pipe(
					FormattedString.concat(finalOptions.initialTab, FormattedString.repeat(finalOptions.tab, level)),
					(currentTab) => Tuple.make(currentTab, FormattedString.concat(currentTab, finalOptions.tab)),
					([currentTab, nextTab]) => ({
						startMark: FormattedString.concat(
							level === 0 ? currentTab : FormattedString.empty(),
							baseFormat.startMark,
							finalOptions.linebreak,
							nextTab
						),
						endMark: FormattedString.concat(finalOptions.linebreak, currentTab, baseFormat.endMark),
						separator: FormattedString.concat(baseFormat.separator, finalOptions.linebreak, nextTab)
					})
			  )
			: baseFormat;

		return FormattedString.concat(
			format.startMark,
			pipe(children, FormattedString.join(format.separator)),
			format.endMark
		);
	}

	return pipe(
		Tree.unfold({
			seed: Property.makeFromValue(Function.unsafeCoerce<unknown, MFunction.Unknown>(u)),
			unfoldfunction: ({ key, value }, isCircular) => {
				const makeLeaf = (
					key: FormattedString.Type,
					value: FormattedString.Type | MFunction.Primitive | MFunction.Function
				) =>
					Tuple.make(
						Node({
							key,
							formatParams: value
						}),
						ReadonlyArray.empty<Property.Type>()
					);
				return isCircular
					? makeLeaf(
							key,
							pipe(
								finalOptions.formatter(CIRCULAR),
								Option.getOrElse(() => CIRCULAR)
							)
					  )
					: pipe(
							finalOptions.formatter(value),
							Option.map((formattedValue) => makeLeaf(key, formattedValue)),
							Option.getOrElse(() =>
								pipe(
									Match.type<MFunction.Unknown>(),
									Match.when(Match.record, (obj) =>
										Tuple.make(
											Node({
												key,
												formatParams: finalOptions.objectFormat
											}),
											Properties.fromRecord(obj, finalOptions)
										)
									),
									Match.when(MMatch.array, (arr) =>
										Tuple.make(
											Node({
												key,
												formatParams: finalOptions.arrayFormat
											}),
											Properties.fromArray(arr)
										)
									),
									Match.orElse((primitiveOrFunction) => makeLeaf(key, primitiveOrFunction))
								)(value)
							)
					  );
			},
			memoize: true
		}),
		Tree.fold(({ formatParams, key }, formattedChildren, level) =>
			formatProperty(
				key,
				FormattedString.isType(formatParams)
					? formatParams
					: MFunction.isPrimitive(formatParams) || MFunction.isFunction(formatParams)
					  ? formatSimpleValue(formatParams)
					  : finalOptions.noLineBreakIfShorterThan === 0
					    ? formatComplexValue(formatParams, formattedChildren, true, level)
					    : pipe(
									formatComplexValue(formatParams, formattedChildren, false, level),
									Option.liftPredicate((formatted) => formatted.printedLength <= finalOptions.noLineBreakIfShorterThan),
									Option.getOrElse(() => formatComplexValue(formatParams, formattedChildren, true, level))
					      )
			)
		)
	);
}
