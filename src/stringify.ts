import * as FormattedString from '#mjljm/effect-pretty-print/FormattedString';
import * as Options from '#mjljm/effect-pretty-print/Options';
import * as Properties from '#mjljm/effect-pretty-print/Properties';
import * as Property from '#mjljm/effect-pretty-print/Property';
import { MFunction, MMatch, Tree } from '@mjljm/effect-lib';
import { Chunk, Data, Equivalence, Match, Option, Tuple, pipe } from 'effect';

const _ = Options._;

class Node extends Data.Class<{
	readonly value: Option.Option<FormattedString.Type>;
	readonly key: FormattedString.Type;
}> {}

/**
 * Pretty prints an object.
 *
 * @param u The object to print
 *
 */
export const stringify = (u: unknown, options?: Options.Type) =>
	pipe(
		// Default options
		Options.basic,
		// Merge with user's options
		(defaultOptions) =>
			Options.makeAllRequired({ ...defaultOptions, ...options }),
		(finalOptions) =>
			pipe(
				Tree.unfoldTree(
					Property.Type.makeFromValue(u as MFunction.Unknown),
					(parent, isCircular) => {
						const noChildren = (value: FormattedString.Type) =>
							Tuple.make(
								new Node({
									value: Option.some(
										FormattedString.isEmpty(parent.prefixedKey)
											? value
											: FormattedString.concat(
													parent.prefixedKey,
													finalOptions.objectFormat.propertySeparator,
													value
											  )
									),
									key: parent.prefixedKey
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
													new Node({
														value: Option.none(),
														key: parent.prefixedKey
													}),
													Properties.fromRecord(obj, finalOptions)
												)
											),
											Match.when(MMatch.array, (arr) =>
												Tuple.make(
													new Node({
														value: Option.none(),
														key: parent.prefixedKey
													}),
													Properties.fromArray(arr)
												)
											),
											Match.orElse((value) =>
												noChildren(
													pipe(
														Match.type<
															MFunction.Primitive | MFunction.Function
														>(),
														Match.when(Match.string, (s) => _("'" + s + "'")),
														Match.when(Match.number, (n) => _(n.toString())),
														Match.when(Match.bigint, (n) => _(n.toString())),
														Match.when(Match.boolean, (b) => _(b.toString())),
														Match.when(Match.symbol, (s) => _(s.toString())),
														Match.when(Match.undefined, () => _('undefined')),
														Match.when(Match.null, () => _('null')),
														Match.when(MMatch.function, () => _('Function()')),
														Match.exhaustive
													)(value)
												)
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
				)
				/*
				
				GraphWithOrigin.foldWith(
					Property.makeFromValue(u as MFunction.Unknown),
					{
						transformLeavesGetChildren: (parent) =>
							Option.match(finalOptions.formatter(parent.value), {
								onNone: () =>
									pipe(
										Match.type<MFunction.Unknown>(),
										// Get record children
										Match.when(Match.record, (obj) =>
											Either.right(Properties.fromRecord(obj, finalOptions))
										),
										// Get array children
										Match.when(MMatch.array, (arr) =>
											Either.right(Properties.fromArray(arr))
										),
										// Transform leaves
										Match.orElse((value) =>
											Either.left(
												pipe(
													Tuple.make(
														parent.prefixedKey,
														pipe(
															Match.type<
																MFunction.Primitive | MFunction.Function
															>(),
															Match.when(Match.string, (s) => _("'" + s + "'")),
															Match.when(Match.number, (n) => _(n.toString())),
															Match.when(Match.bigint, (n) => _(n.toString())),
															Match.when(Match.boolean, (b) => _(b.toString())),
															Match.when(Match.symbol, (s) => _(s.toString())),
															Match.when(Match.undefined, () => _('undefined')),
															Match.when(Match.null, () => _('null')),
															Match.when(MMatch.function, () =>
																_('Function()')
															),
															Match.exhaustive
														)(value)
													),
													([key, value]) =>
														FormattedString.isEmpty(key)
															? value
															: FormattedString.concat(
																	parent.value === u
																		? finalOptions.initialTab
																		: FormattedString.empty(),
																	key,
																	finalOptions.objectFormat.propertySeparator,
																	value
															  )
												)
											)
										)
									)(parent.value),
								onSome: (v) => Either.left(v)
							}),
						concatenateChildren: (parent, transformedChildren, level) =>
							pipe(
								MFunction.isRecord(parent.value)
									? finalOptions.objectFormat
									: finalOptions.arrayFormat,
								(format) =>
									pipe(
										FormattedString.concat(
											finalOptions.initialTab,
											FormattedString.repeat(finalOptions.tab, level),
											parent.prefixedKey,
											finalOptions.objectFormat.propertySeparator,
											format.startMark,
											pipe(
												transformedChildren,
												FormattedString.join(format.separator)
											),
											format.endMark
										),
										(s) =>
											s.printedLength > finalOptions.noLineBreakIfShorterThan
												? s
												: s
									)
							),
						circular: () => _('Circular')
					}
				)*/
			)
	);
