import * as FormattedString from '#mjljm/effect-pretty-print/FormattedString';
import * as Options from '#mjljm/effect-pretty-print/Options';
import * as Properties from '#mjljm/effect-pretty-print/Properties';
import * as Property from '#mjljm/effect-pretty-print/Property';
import { MFunction, MMatch, Tree } from '@mjljm/effect-lib';
import { Chunk, Data, Equivalence, Match, Option, Tuple, pipe } from 'effect';

//const moduleTag = '@mjljm/effect-pretty-print/stringify/';
const _ = Options._;

interface BaseNode {
	readonly key: FormattedString.Type;
}

class Node extends Data.Class<
	BaseNode & {
		readonly type: 'Array' | 'Object';
	}
> {}

class Leaf extends Data.Class<
	BaseNode & {
		readonly value:
			| MFunction.Primitive
			| MFunction.Function
			| FormattedString.Type;
	}
> {}

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

			const formatLeaf = (leaf: Leaf) =>
				formatProperty(
					leaf.key,
					leaf.value instanceof FormattedString.Type
						? leaf.value
						: pipe(
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
						  )(leaf.value)
				);

			const formatNode = (
				node: Node,
				children: Chunk.Chunk<FormattedString.Type>,
				withLineBreaks: boolean,
				level: number
			): FormattedString.Type =>
				pipe(
					node.type === 'Object'
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
						formatProperty(
							node.key,
							FormattedString.concat(
								format.startMark,
								pipe(children, FormattedString.join(format.separator)),
								format.endMark
							)
						)
				);

			return pipe(
				Tree.unfoldTree<Node | Leaf, Property.Type>(
					Property.makeFromValue(u as MFunction.Unknown),
					(parent, isCircular) => {
						const makeLeaf = (
							key: FormattedString.Type,
							value:
								| MFunction.Primitive
								| MFunction.Function
								| FormattedString.Type
						) =>
							Tuple.make(
								new Leaf({
									key,
									value
								}),
								Chunk.empty<Property.Type>()
							);
						return isCircular
							? makeLeaf(parent.prefixedKey, _('Circular'))
							: pipe(
									finalOptions.formatter(parent.value),
									Option.map((value) => makeLeaf(parent.prefixedKey, value)),
									Option.getOrElse(() =>
										pipe(
											Match.type<MFunction.Unknown>(),
											Match.when(Match.record, (obj) =>
												Tuple.make(
													new Node({
														key: parent.prefixedKey,
														type: 'Object'
													}),
													Properties.fromRecord(obj, finalOptions)
												)
											),
											Match.when(MMatch.array, (arr) =>
												Tuple.make(
													new Node({
														key: parent.prefixedKey,
														type: 'Array'
													}),
													Properties.fromArray(arr)
												)
											),
											Match.orElse((value) =>
												makeLeaf(parent.prefixedKey, value)
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
				Tree.fold<Node | Leaf, FormattedString.Type>(
					(value, children, level) =>
						value instanceof Leaf
							? formatLeaf(value)
							: pipe(formatNode(value, children, false, level), (formatted) =>
									formatted.printedLength <=
									finalOptions.noLineBreakIfShorterThan
										? formatted
										: formatNode(value, children, true, level)
							  )
				)
			);
		}
	);
