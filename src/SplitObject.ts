import * as MFunction from '@mjljm/effect-lib/effect/Function';
import * as MMatch from '@mjljm/effect-lib/effect/Match';
import * as MStruct from '@mjljm/effect-lib/effect/Struct';
import * as FormattedString from '@mjljm/effect-pretty-print/FormattedString';
import * as Options from '@mjljm/effect-pretty-print/Options';
import * as OptionsAndPrecalcs from '@mjljm/effect-pretty-print/OptionsAndPrecalcs';
import * as Property from '@mjljm/effect-pretty-print/Property';
import { Function, Match, Option, ReadonlyArray, identity, pipe } from 'effect';

const _ = (s: string) => FormattedString.makeFromUnformattedString(s);

export interface SplitObject {
	readonly startMark: FormattedString.FormattedString;
	readonly endMark: FormattedString.FormattedString;
	readonly propertySeparator: FormattedString.FormattedString;
	readonly separator: FormattedString.FormattedString;
	readonly properties: ReadonlyArray<Property.Property>;
	readonly marksLength: number;
	readonly sepsLength: number;
}
export const make = MStruct.make<SplitObject>;

export const stringify = (
	self: SplitObject,
	values: ReadonlyArray<FormattedString.FormattedString>,
	lineBreak: FormattedString.FormattedString,
	currentTab: FormattedString.FormattedString,
	tab: FormattedString.FormattedString,
	depth: number
): FormattedString.FormattedString =>
	pipe(FormattedString.append(tab)(currentTab), (nextTab) =>
		pipe(
			self.properties,
			ReadonlyArray.zip(values),
			ReadonlyArray.reduce(_(''), (acc, [prop, value], i) =>
				pipe(
					acc,
					i === 0
						? FormattedString.append(nextTab)
						: FormattedString.append(
								pipe(
									self.separator,
									FormattedString.append(lineBreak),
									FormattedString.append(nextTab)
								)
						  ),
					FormattedString.append(prop.prefixedKey),
					FormattedString.append(self.propertySeparator),
					FormattedString.append(value)
				)
			),
			FormattedString.append(lineBreak),
			FormattedString.append(currentTab),
			FormattedString.append(self.endMark),
			FormattedString.prepend(lineBreak),
			FormattedString.prepend(self.startMark),
			depth === 0 ? FormattedString.prepend(currentTab) : identity
		)
	);

interface MFORLoop<X> {
	readonly input: X;
	readonly protoChainLevel: number;
	readonly prefix: FormattedString.FormattedString;
}

const MFORLoop = <X>(args: MFORLoop<X>) => MStruct.make<MFORLoop<X>>(args);

const isObjectRecordMFORLoop = (l: MFORLoop<unknown>): l is MFORLoop<MFunction.Record> =>
	Match.record(l.input);

export const makeFromObjectRecord = (
	input: MFunction.Record,
	options: OptionsAndPrecalcs.OptionsAndPrecalcs
): SplitObject =>
	pipe(
		// Read and filter all properties (own and inherited if requested)
		MFunction.loopNonRecursive(
			MFORLoop<unknown>({
				input,
				protoChainLevel: 0,
				prefix: _('')
			}),
			{
				while: isObjectRecordMFORLoop,
				body: ({ input, protoChainLevel, prefix }) =>
					pipe(
						input,
						Reflect.ownKeys,
						ReadonlyArray.filterMap((key) =>
							pipe(
								options.propertyKeyFormatter(key),
								(formattedKey) =>
									Property.make({
										originalKey: key,
										key: formattedKey,
										prefixedKey: FormattedString.append(formattedKey)(prefix),
										value: input[key] as MFunction.Unknown,
										level: protoChainLevel
									}),
								(property) =>
									keepProperty(property, input, options) ? Option.some(property) : Option.none()
							)
						)
					),
				step: ({ input, protoChainLevel, prefix }) =>
					MFORLoop<unknown>({
						input: options.showInherited ? (Object.getPrototypeOf(input) as unknown) : null,
						protoChainLevel: protoChainLevel + 1,
						prefix: FormattedString.append(prefix)(options.prototypePrefix)
					})
			}
		),
		ReadonlyArray.flatten,
		// Sort as requested
		sort(options),
		(properties) =>
			make({
				startMark: options.objectStartMark,
				endMark: options.objectEndMark,
				propertySeparator: options.propertySeparator,
				separator: options.objectSeparator,
				properties,
				marksLength: options.objectMarksLength,
				sepsLength: options.propertySeparator.printedLength + options.objectSeparator.printedLength
			})
	);

const keepProperty = (
	property: Property.Property,
	obj: MFunction.Record,
	options: OptionsAndPrecalcs.OptionsAndPrecalcs
) =>
	Option.match(options.propertyPredicate(property), {
		onNone: () =>
			(!Function.isFunction(property.value) || options.showFunctions) &&
			pipe(
				Match.type<Options.stringOrSymbolPropertiesType>(),
				Match.when('string', () => typeof property.originalKey === 'string'),
				Match.when('symbol', () => typeof property.originalKey === 'symbol'),
				Match.when('both', () => true),
				Match.exhaustive
			)(options.stringOrSymbolProperties) &&
			pipe(
				Match.type<Options.enumerableOrNonEnumarablePropertiesType>(),
				Match.when('enumerable', () =>
					Object.prototype.propertyIsEnumerable.call(obj, property.originalKey)
				),
				Match.when(
					'nonEnumerable',
					() => !Object.prototype.propertyIsEnumerable.call(obj, property.originalKey)
				),
				Match.when('both', () => true),
				Match.exhaustive
			)(options.enumerableOrNonEnumarableProperties),
		onSome: Function.identity
	});

const sort =
	(options: OptionsAndPrecalcs.OptionsAndPrecalcs) => (self: ReadonlyArray<Property.Property>) =>
		pipe(
			Match.type<Options.objectPropertiesSortMethodType>(),
			Match.when('byName', () => ReadonlyArray.sort(Property.byName)(self)),
			Match.when('byPrefixedName', () => ReadonlyArray.sort(Property.byPrefixedName)(self)),
			Match.when('byLevelAndName', () => ReadonlyArray.sort(Property.byLevelAndName)(self)),
			Match.when('noSorting', () => self as Array<Property.Property>),
			Match.exhaustive
		)(options.propertiesSortMethod);

export const makeFromArray = (
	input: MFunction.Array,
	options: OptionsAndPrecalcs.OptionsAndPrecalcs
): SplitObject =>
	pipe(
		ReadonlyArray.map(input, (v) =>
			Property.make({
				originalKey: '',
				key: _(''),
				prefixedKey: _(''),
				value: v as MFunction.Unknown,
				level: 0
			})
		),
		(properties) =>
			make({
				startMark: options.arrayStartMark,
				endMark: options.arrayEndMark,
				propertySeparator: _(''),
				separator: options.arraySeparator,
				properties,
				marksLength: options.arrayMarksLength,
				sepsLength: options.arraySeparator.printedLength
			})
	);

export const makeFromArrayOrObjectRecord = (
	input: MFunction.RecordOrArray,
	options: OptionsAndPrecalcs.OptionsAndPrecalcs
): SplitObject =>
	pipe(
		Match.type<MFunction.RecordOrArray>(),
		Match.when(MMatch.array, (arr) => makeFromArray(arr, options)),
		Match.when(Match.record, (obj) => makeFromObjectRecord(obj, options)),
		Match.exhaustive
	)(input);
