import * as FormattedString from '#mjljm/effect-pretty-print/FormattedString';
import * as Options from '#mjljm/effect-pretty-print/Options';
import * as OptionsAndPrecalcs from '#mjljm/effect-pretty-print/OptionsAndPrecalcs';
import * as SplitObject from '#mjljm/effect-pretty-print/SplitObject';
import { GraphOrigin, MFunction, MMatch } from '@mjljm/effect-lib';
import {
	HashSet,
	Match,
	MutableHashMap,
	Option,
	ReadonlyArray,
	Tuple,
	pipe
} from 'effect';

type ObjectCache = MutableHashMap.MutableHashMap<
	MFunction.RecordOrArray,
	FormattedString.Type
>;

const _ = Options._;
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
		// Add Precalcs
		(optionsWithDefaultValues) =>
			OptionsAndPrecalcs.make({
				...optionsWithDefaultValues,
				objectMarksLength:
					optionsWithDefaultValues.objectStartMark.printedLength +
					optionsWithDefaultValues.objectEndMark.printedLength,
				arrayMarksLength:
					optionsWithDefaultValues.arrayStartMark.printedLength +
					optionsWithDefaultValues.arrayEndMark.printedLength
			}),
		(optionsWithDefaultsAndPrecalcs) =>
			GraphOrigin.flatten({
				handleSpecialNode: (a) => optionsWithDefaultsAndPrecalcs.formatter(a),
				handleCircularNode: (a) => _('Circular'),
				handleNode: 1,
				split: (a)=)> pipe(
					SplitObject.makeFromArrayOrObjectRecord(a, optionsWithDefaultsAndPrecalcs),
					(split) =>
						pipe(
							Tuple.make(
								HashSet.add(parents, obj),
								FormattedString.append(options.tab)(currentTab),
								split.properties.length > 0 ? split.separator.printedLength : 0
							),
							([newParents, newTab, sepLength]) =>
								pipe(
									split.properties,
									ReadonlyArray.mapAccum(0, (acc, property) =>
										pipe(
											internalStringify(
												property.value,
												stringified,
												newParents,
												options,
												newTab,
												depth + 1
											),
											(s) =>
												Tuple.make(
													acc +
														property.prefixedKey.printedLength +
														split.sepsLength +
														s.printedLength,
													s
												),
										)
									),
									([length, values]) =>
										length - sepLength + split.marksLength <=
										options.noLineBreakIfShorterThan
											? SplitObject.stringify(
													split,
													values,
													_(''),
													currentTab,
													_(''),
													depth
											  )
											: SplitObject.stringify(
													split,
													values,
													options.linebreak,
													currentTab,
													options.tab,
													depth
											  )
								)
						)
				)
			})
	);

const internalStringify1 = (
	u: MFunction.Unknown,
	stringified: ObjectCache,
	parents: HashSet.HashSet<MFunction.RecordOrArray>,
	options: OptionsAndPrecalcs.Type,
	currentTab: FormattedString.Type,
	depth: number
): FormattedString.Type =>
	pipe(
		MFunction.isRecordOrArray(u)
			? MutableHashMap.get(stringified, u)
			: Option.none(),
		Option.getOrElse(() =>
			pipe(
				options.formatter(u),
				Option.getOrElse(() =>
					pipe(
						Match.type<MFunction.Unknown>(),
						Match.when(Match.string, (s) => _("'" + s + "'")),
						Match.when(Match.number, (n) => _(n.toString())),
						Match.when(Match.bigint, (n) => _(n.toString())),
						Match.when(Match.boolean, (b) => _(b.toString())),
						Match.when(Match.symbol, (s) => _(s.toString())),
						Match.when(Match.undefined, () => _('undefined')),
						Match.when(Match.null, () => _('null')),
						Match.when(MMatch.function, () => _('Function()')),
						Match.when(MMatch.recordOrArray, (obj) =>
							handleArrayOrObject(
								obj,
								stringified,
								parents,
								options,
								currentTab,
								depth
							)
						),
						Match.exhaustive,
						(matcher) => matcher(u),
						(value) =>
							MFunction.isRecordOrArray(u)
								? (MutableHashMap.set(stringified, u, value), value)
								: value
					)
				)
			)
		)
	);

const handleArrayOrObject = (
	obj: MFunction.RecordOrArray,
	stringified: ObjectCache,
	parents: HashSet.HashSet<MFunction.RecordOrArray>,
	options: OptionsAndPrecalcs.Type,
	currentTab: FormattedString.Type,
	depth: number
) =>
	HashSet.has(parents, obj)
		? _('Circular') //Obj is parent of himself...
		: pipe(SplitObject.makeFromArrayOrObjectRecord(obj, options), (split) =>
				pipe(
					Tuple.make(
						HashSet.add(parents, obj),
						FormattedString.append(options.tab)(currentTab),
						split.properties.length > 0 ? split.separator.printedLength : 0
					),
					([newParents, newTab, sepLength]) =>
						pipe(
							split.properties,
							ReadonlyArray.mapAccum(0, (acc, property) =>
								pipe(
									internalStringify(
										property.value,
										stringified,
										newParents,
										options,
										newTab,
										depth + 1
									),
									(s) =>
										Tuple.make(
											acc +
												property.prefixedKey.printedLength +
												split.sepsLength +
												s.printedLength,
											s
										),
									(z) => z
								)
							),
							([length, values]) =>
								length - sepLength + split.marksLength <=
								options.noLineBreakIfShorterThan
									? SplitObject.stringify(
											split,
											values,
											_(''),
											currentTab,
											_(''),
											depth
									  )
									: SplitObject.stringify(
											split,
											values,
											options.linebreak,
											currentTab,
											options.tab,
											depth
									  )
						)
				)
		  );
