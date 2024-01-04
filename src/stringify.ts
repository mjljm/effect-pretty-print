import * as FormattedString from '#mjljm/effect-pretty-print/FormattedString';
import * as Options from '#mjljm/effect-pretty-print/Options';
import * as Properties from '#mjljm/effect-pretty-print/Properties';
import * as Property from '#mjljm/effect-pretty-print/Property';
import { MEither, MFunction, MMatch, Tree } from '@mjljm/effect-lib';
import { Chunk, Match, Option, Predicate, Tuple, pipe } from 'effect';

const moduleTag = '@mjljm/effect-pretty-print/stringify/';

//const moduleTag = '@mjljm/effect-pretty-print/stringify/';
const _ = Options._;

const NodeTypeId: unique symbol = Symbol.for(moduleTag + 'NodeTypeId');
type NodeTypeId = typeof NodeTypeId;

/**
 * Model
 */
interface Node {
	readonly [NodeTypeId]: NodeTypeId;
	readonly key: FormattedString.Type;
	readonly value: 'Array' | 'Object' | FormattedString.Type;
}

/**
 * Type guards
 */
const isNode = (u: unknown): u is Node => Predicate.hasProperty(u, NodeTypeId);
/**
 * Constructors
 */
const Node = (n: Readonly<Omit<Node, NodeTypeId>>): Node => ({ ...n, [NodeTypeId]: NodeTypeId });

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

	const formatLeaf = (leaf: Leaf): FormattedString.Type =>
		FormattedString.isType(leaf.value)
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
			  )(leaf.value);

	function formatNotLeaf(
		node: NotLeaf,
		children: Chunk.Chunk<FormattedString.Type>,
		withLineBreaks: boolean,
		level: number
	): FormattedString.Type {
		const baseFormat = node.type === 'Object' ? finalOptions.objectFormat : finalOptions.arrayFormat;

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
							value
						}),
						Chunk.empty<Property.Type>()
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
												value: 'Object'
											}),
											Properties.fromRecord(obj, finalOptions)
										)
									),
									Match.when(MMatch.array, (arr) =>
										Tuple.make(
											Node({
												key: nextSeed.prefixedKey,
												value: 'Array'
											}),
											Properties.fromArray(arr)
										)
									),
									Match.orElse((value) => makeLeaf(nextSeed.prefixedKey, value))
								)(nextSeed.value)
							)
					  );
			},
			memoize: true
		}),
		MEither.getRightWhenNoLeft,
		Tree.fold<NotLeaf | Leaf, FormattedString.Type>((value, children, level) =>
			formatProperty(
				value.key,
				value instanceof Leaf
					? formatLeaf(value)
					: pipe(formatNotLeaf(value, children, false, level), (formatted) =>
							formatted.printedLength <= finalOptions.noLineBreakIfShorterThan
								? formatted
								: formatNotLeaf(value, children, true, level)
					  )
			)
		)
	);
}
