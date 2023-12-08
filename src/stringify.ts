import * as FormattedString from '#mjljm/effect-pretty-print/FormattedString';
import * as Options from '#mjljm/effect-pretty-print/Options';
import * as Properties from '#mjljm/effect-pretty-print/Properties';
import * as Property from '#mjljm/effect-pretty-print/Property';
import { MError, MFunction, MMatch, Tree } from '@mjljm/effect-lib';
import { Chunk, Data, Equivalence, Match, Option, Tuple, pipe } from 'effect';

const moduleTag = '@mjljm/effect-pretty-print/stringify/';
const _ = Options._;

class TreeValue extends Data.Class<{
	readonly value: Option.Option<FormattedString.Type>;
	readonly key: FormattedString.Type;
	readonly type: 'Array' | 'Object' | 'Other';
}> {}

/**
 * Pretty prints an object.
 *
 * @param u The object to print
 *
 */
export const stringify = (
	u: unknown,
	options?: Options.Type
): FormattedString.Type =>
	pipe(
		// Default options
		Options.basic,
		// Merge with user's options
		(defaultOptions) =>
			Options.makeAllRequired({ ...defaultOptions, ...options }),
		(finalOptions) => {
			const formatProperty = (
				key: FormattedString.Type,
				value: FormattedString.Type
			): FormattedString.Type =>
				FormattedString.isEmpty(key)
					? value
					: FormattedString.concat(
							key,
							finalOptions.objectFormat.propertySeparator,
							value
					  );

			const formatFunctionOrPrimitive = (
				value: MFunction.Primitive | MFunction.Function
			) =>
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

			const formatObjectOrArray = (
				father: TreeValue,
				properties: Properties.Type,
				withLineBreaks: boolean,
				level: number
			) =>
				pipe(
					father.type === 'Object'
						? finalOptions.objectFormat
						: finalOptions.arrayFormat,
					(format) =>
						withLineBreaks
							? {
									startMark: FormattedString.concat(
										format.startMark,
										finalOptions.linebreak
									),
									endMark: FormattedString.concat(
										finalOptions.linebreak,
										format.endMark
									),
									separator: FormattedString.concat(
										format.separator,
										finalOptions.linebreak
									),
									tab: FormattedString.concat(
										finalOptions.initialTab,
										FormattedString.repeat(finalOptions.tab, level)
									)
							  }
							: { ...format, tab: _('') },
					(format) =>
						FormattedString.concat(
							finalOptions.initialTab,
							FormattedString.repeat(finalOptions.tab, level),
							parent.prefixedKey,
							finalOptions.objectFormat.propertySeparator,
							format.startMark,
							pipe(transformedChildren, FormattedString.join(format.separator)),
							format.endMark
						)
				);

			return pipe(
				Tree.unfoldTree(
					Property.Type.makeFromValue(u as MFunction.Unknown),
					(parent, isCircular) => {
						const noChildren = (value: FormattedString) =>
							Tuple.make(
								new TreeValue({
									value: Option.some(formatProperty(parent.prefixedKey, value)),
									key: parent.prefixedKey,
									type: 'Other'
								}),
								Chunk.empty<Property.Type>()
							);

						return isCircular
							? noChildren(_('Circular'))
							: pipe(
									finalOptions.formatter(parent.value),
									Option.map((value) => noChildren(value)),
									Option.getOrElse(() =>
										pipe(
											Match.type<MFunction.Unknown>(),
											Match.when(Match.record, (obj) =>
												Tuple.make(
													new TreeValue({
														value: Option.none(),
														key: parent.prefixedKey,
														type: 'Object'
													}),
													Properties.fromRecord(obj, finalOptions)
												)
											),
											Match.when(MMatch.array, (arr) =>
												Tuple.make(
													new TreeValue({
														value: Option.none(),
														key: parent.prefixedKey,
														type: 'Array'
													}),
													Properties.fromArray(arr)
												)
											),
											Match.orElse((value) =>
												noChildren(formatFunctionOrPrimitive(value))
											)
										)(parent.value)
									)
							  );
					},
					true,
					Equivalence.make(
						(self: Property.Type, that: Property.Type) =>
							self.value === that.value
					)
				),
				// Using extendUp instead of fold allows us to not process twice the same nodes
				Tree.extendUp((node, level) =>
					pipe(
						node.value.value,
						Option.orElse(() =>
							pipe(
								node.forest,
								Chunk.map((child) =>
									pipe(
										child.value.value,
										Option.getOrThrowWith(
											() =>
												new MError.General({
													message: `Abnormal error while stringifying in ${moduleTag}. \
												Children should have already been calculated.`
												})
										)
									)
								),
								FormattedString.join(_(',')),
								Option.some
							)
						)
					)
				),
				(topNode) =>
					Option.getOrThrowWith(
						topNode.value,
						() =>
							new MError.General({
								message: `Abnormal error while stringifying in ${moduleTag}. \
						Top node should have been calculated.`
							})
					)
			);
		}
	);
