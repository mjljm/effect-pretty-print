import * as FormattedString from '#mjljm/effect-pretty-print/FormattedString';
import * as Options from '#mjljm/effect-pretty-print/Options';
import * as Property from '#mjljm/effect-pretty-print/Property';
import { MFunction } from '@mjljm/effect-lib';
import { Function, Match, Option, ReadonlyArray, Tuple, pipe } from 'effect';

export type Type = ReadonlyArray<Property.Type>;

export const fromArray = (input: MFunction.Array): Array<Property.Type> =>
	pipe(
		input,
		ReadonlyArray.map((value) => Property.makeFromValue(value as MFunction.Unknown))
	);

export const fromRecord = (input: MFunction.Record, options: Required<Options.Type>): Array<Property.Type> =>
	pipe(
		// Get proto chain
		ReadonlyArray.unfold(input, (previous) =>
			options.showInherited
				? pipe(Object.getPrototypeOf(previous) as unknown, (proto) =>
						MFunction.isRecord(proto) ? Option.some(Tuple.make(proto, proto)) : Option.none()
				  )
				: Option.none()
		),
		ReadonlyArray.prepend(input),
		// Map to properties
		ReadonlyArray.map((proto, protoChainLevel) => {
			const prefix = pipe(options.prototypePrefix, FormattedString.repeat(protoChainLevel));
			return pipe(
				proto,
				Reflect.ownKeys,
				ReadonlyArray.filterMap((key) => {
					const formattedKey = options.keyFormatter(key);
					return pipe(
						Property.make({
							originalKey: key,
							key: formattedKey,
							prefixedKey: FormattedString.concat(prefix, formattedKey),
							value: input[key] as MFunction.Unknown,
							level: protoChainLevel
						}),
						Option.liftPredicate(keepProperty(input, options))
					);
				})
			);
		}),
		ReadonlyArray.flatten,
		// Sort as requested
		sort(options)
	);

const keepProperty = (obj: MFunction.Record, options: Required<Options.Type>) => (property: Property.Type) =>
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
				Match.when('enumerable', () => Object.prototype.propertyIsEnumerable.call(obj, property.originalKey)),
				Match.when('nonEnumerable', () => !Object.prototype.propertyIsEnumerable.call(obj, property.originalKey)),
				Match.when('both', () => true),
				Match.exhaustive
			)(options.enumerableOrNonEnumarableProperties),
		onSome: Function.identity
	});

const sort = (options: Required<Options.Type>) => (self: ReadonlyArray<Property.Type>) =>
	pipe(
		Match.type<Options.objectPropertiesSortMethodType>(),
		Match.when('byName', () => ReadonlyArray.sort(Property.byKey)(self)),
		Match.when('byPrefixedName', () => ReadonlyArray.sort(Property.byPrefixedKey)(self)),
		Match.when('byLevelAndName', () => ReadonlyArray.sort(Property.byLevelAndKey)(self)),
		Match.when('noSorting', () => self as Array<Property.Type>),
		Match.exhaustive
	)(options.propertiesSortMethod);
